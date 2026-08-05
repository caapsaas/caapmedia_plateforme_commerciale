import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../src/common/utils/prisma/prisma.service';
import { LoggerService } from '../../src/common/utils/logger/logger.service';
import {
  UserRole,
  DocumentCategory,
  DocumentStatus,
  SecretariatTaskStatus,
  Prisma,
} from '@prisma/client';
import { CreateCompanyDocumentDto } from './dto/create-company-document.dto';
import { generateId } from '../../src/common/utils/generate-id.util';
import { ID_PREFIXES } from '../../src/common/constants/id-prefixes.const';
import {
  CreateSecretariatTaskDto,
  UpdateSecretariatTaskDto,
} from './dto/task.dto';
import { PaginationQueryDto } from '../common/pagination/dto/pagination-query.dto';
import { paginate } from '../common/pagination/pagination';
import {
  withSubsidiaryScope,
  assertSubsidiaryAccess,
  SubsidiaryScopeContext,
} from '../common/utils/subsidiary-scope';

@Injectable()
export class SecretariatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // CRUD for CompanyDocument

  //1-Creation de document pour la company
  async createCompanyDocument(
    dto: CreateCompanyDocumentDto, // DTO sans fileUrl
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
    file: Express.Multer.File, // Le fichier est passé directement
  ) {
    // Déterminer le subsidiaryId: utiliser celui du DTO si fourni, sinon celui de l'utilisateur
    const subsidiaryId = dto.subsidiaryId || currentUser.subsidiaryId;

    this.logger.log(
      `Attempting to create document "${dto.documentName}" for subsidiary ${subsidiaryId}`,
      'SecretariatService',
    );

    // Guard : Vérifier que data est valide
    if (!dto || !subsidiaryId) {
      // file is now a separate parameter
      this.logger.error(
        'Invalid or missing data provided (subsidiaryId required)',
        'SecretariatService',
      );
      throw new BadRequestException(
        'Invalid or missing data (subsidiaryId required)',
      );
    }
    if (!file) {
      // File is mandatory for creation
      this.logger.error(
        'File is missing for document creation',
        'SecretariatService',
      );
      throw new BadRequestException(
        'A file is required to create the document',
      );
    }

    // Vérifier si la filiale existe ET appartient au user (complète le commentaire)
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: subsidiaryId },
    });
    if (!subsidiary) {
      this.logger.error(
        `Subsidiary with ID ${subsidiaryId} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Subsidiary not found');
    }

    // Un ADMIN peut créer pour n'importe quelle filiale, un SECRETARY uniquement pour la sienne.
    if (
      currentUser.role !== UserRole.ADMIN &&
      subsidiary.id !== currentUser.subsidiaryId
    ) {
      this.logger.warn(
        `User ${currentUser.id} (role: ${currentUser.role}) tried to create document for foreign subsidiary ${subsidiaryId}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized: this subsidiary does not belong to you',
      );
    }

    // Construire le fileUrl ici, similaire à orders.service.ts
    const fileUrl = `/public/uploads/secretariat/${file.filename}`; // Assurez-vous que votre serveur sert ce chemin statiquement

    // Créer le document (Prisma gérera subsidiaryId via data)
    const document = await this.prisma.companyDocument.create({
      data: {
        id: generateId(ID_PREFIXES.COMPANYDOCUMENT),
        documentName: dto.documentName,
        category: dto.category,
        status: dto.status,
        fileUrl: fileUrl,
        subsidiaryId: subsidiaryId,
        createdBy: currentUser.id,
      },
    });

    this.logger.log(
      `Company document ${document.documentName} created successfully for subsidiary ${subsidiaryId}`,
      'createCompanyDocument',
    );
    return document;
  }

  async updateCompanyDocument(
    id: string,
    dto: {
      // Renommé data en dto pour clarté
      documentName?: string;
      category?: DocumentCategory;
      status?: DocumentStatus;
      // fileUrl ne doit pas être dans le DTO pour update, il est géré par le fichier
    },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
    file?: Express.Multer.File, // Le fichier est optionnel pour la mise à jour
  ) {
    // Vérifier si le document existe
    const document = await this.prisma.companyDocument.findUnique({
      where: { id },
    });
    if (!document) {
      this.logger.error(
        `Company document with ID ${id} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Company document not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to update company document ${id}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized to update this company document',
      );
    }
    const ctx = { subsidiaryId: currentUser.subsidiaryId, hasGlobalScope: currentUser.role === UserRole.ADMIN };
    assertSubsidiaryAccess(document.subsidiaryId, ctx);

    // Construire les données de mise à jour
    const updateData: Prisma.CompanyDocumentUpdateInput = { ...dto };
    if (file) {
      updateData.fileUrl = `/public/uploads/secretariat/${file.filename}`; // Construire l'URL si un nouveau fichier est fourni
    }

    // Vérifier si des données de mise à jour sont fournies (dto + file)
    if (Object.keys(updateData).length === 0) {
      return document;
    }

    const updatedDocument = await this.prisma.companyDocument.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(
      `Company document ${id} updated successfully`,
      'SecretariatService',
    );
    return updatedDocument;
  }

  async deleteCompanyDocument(
    id: string,
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si le document existe
    const document = await this.prisma.companyDocument.findUnique({
      where: { id },
    });
    if (!document) {
      this.logger.error(
        `Company document with ID ${id} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Company document not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to delete company document ${id}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized to delete this company document',
      );
    }
    const ctx = { subsidiaryId: currentUser.subsidiaryId, hasGlobalScope: currentUser.role === UserRole.ADMIN };
    assertSubsidiaryAccess(document.subsidiaryId, ctx);

    // Supprimer le document
    await this.prisma.companyDocument.delete({ where: { id } });

    this.logger.log(
      `Company document ${id} deleted successfully`,
      'SecretariatService',
    );
    return { message: 'Company document deleted successfully' };
  }

  async getAllCompanyDocuments(
    ctx: SubsidiaryScopeContext,
    paginationQuery: PaginationQueryDto = {},
  ) {
    let where: Prisma.CompanyDocumentWhereInput = {};

    if (paginationQuery.search) {
      where.documentName = {
        contains: paginationQuery.search,
        mode: 'insensitive',
      };
    }

    where = withSubsidiaryScope(where, ctx);

    const result = await paginate(
      this.prisma.companyDocument,
      { where, include: { subsidiary: true, creator: { select: { id: true, userName: true } } }, orderBy: { createdAt: 'desc' } },
      paginationQuery,
    );

    this.logger.log(
      `Retrieved ${result.data.length} company documents`,
      'SecretariatService',
    );
    return result;
  }

  async archiveCompanyDocument(
    id: string,
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si le document existe
    const document = await this.prisma.companyDocument.findUnique({
      where: { id },
    });
    if (!document) {
      this.logger.error(
        `Company document with ID ${id} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Company document not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to archive company document ${id}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized to archive this company document',
      );
    }
    const ctx = { subsidiaryId: currentUser.subsidiaryId, hasGlobalScope: currentUser.role === UserRole.ADMIN };
    assertSubsidiaryAccess(document.subsidiaryId, ctx);

    // Archiver le document
    const archivedDocument = await this.prisma.companyDocument.update({
      where: { id },
      data: { status: DocumentStatus.ARCHIVED },
    });

    this.logger.log(
      `Company document ${id} archived successfully`,
      'SecretariatService',
    );
    return archivedDocument;
  }

  async searchCompanyDocuments(
    query: {
      documentName?: string;
      category?: DocumentCategory;
      status?: DocumentStatus;
      includeArchived?: boolean;
    } & PaginationQueryDto,
    ctx: SubsidiaryScopeContext,
  ) {
    let where: any = {};

    // Par défaut, exclure les documents archivés
    if (!query.includeArchived) {
      where.status = { not: DocumentStatus.ARCHIVED };
    }

    if (query.documentName) {
      where.documentName = {
        contains: query.documentName,
        mode: 'insensitive',
      };
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.status) {
      where.status = query.status;
    }

    where = withSubsidiaryScope(where, ctx);

    const result = await paginate(
      this.prisma.companyDocument,
      { where, include: { subsidiary: true, creator: { select: { id: true, userName: true } } }, orderBy: { createdAt: 'desc' } },
      query,
    );

    this.logger.log(
      `Found ${result.data.length} company documents matching query`,
      'SecretariatService',
    );
    return result;
  }

  // CRUD for Meeting

  async createMeeting(
    data: {
      title: string;
      meetingDateTime: Date;
      meetingLocation?: string;
      agenda?: string;
      subsidiaryId?: string;
      participantIds?: string[];
    },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Déterminer le subsidiaryId: utiliser celui des données si fourni, sinon celui de l'utilisateur
    const subsidiaryId = data.subsidiaryId || currentUser.subsidiaryId;

    // Vérifier les autorisations (SECRETARY ou ADMIN)
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to create a meeting`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized to create a meeting',
      );
    }

    // Vérifier si la filiale existe et appartient au user
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: subsidiaryId },
    });
    if (!subsidiary) {
      this.logger.error(
        `Subsidiary with ID ${subsidiaryId} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Subsidiary not found');
    }
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.subsidiaryId !== subsidiaryId
    ) {
      this.logger.error(
        `User ${currentUser.id} cannot create meeting for subsidiary ${subsidiaryId}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Cannot create a meeting for another subsidiary',
      );
    }

    // Créer la réunion avec gestion des participants en transaction
    const meeting = await this.prisma.$transaction(async (tx) => {
      // Créer la réunion de base
      const createdMeeting = await tx.meeting.create({
        data: {
          id: generateId(ID_PREFIXES.MEETING),
          title: data.title,
          meetingDateTime: data.meetingDateTime,
          meetingLocation: data.meetingLocation,
          agenda: data.agenda,
          subsidiaryId: subsidiaryId,
          createdBy: currentUser.id,
        },
      });

      // Ajouter les participants si fournis
      if (data.participantIds && data.participantIds.length > 0) {
        // Vérifier que les employés existent et appartiennent à la même filiale
        const employees = await tx.employee.findMany({
          where: {
            id: { in: data.participantIds },
            subsidiaryId: subsidiaryId, // Restriction à la filiale du meeting
          },
        });

        if (employees.length !== data.participantIds.length) {
          this.logger.error(
            `Some employees not found or not from subsidiary ${subsidiaryId}`,
            'SecretariatService',
          );
          throw new BadRequestException(
            'Some employees not found or do not belong to the meeting subsidiary',
          );
        }

        // Créer les liens participants
        const participantData = data.participantIds.map((employeeId) => ({
          meetingId: createdMeeting.id,
          employeeId,
        }));

        await tx.meetingParticipant.createMany({
          data: participantData,
          skipDuplicates: true, // Ignore doublons via @@unique
        });
      }

      return createdMeeting;
    });

    this.logger.log(
      `Meeting ${meeting.title} created successfully`,
      'SecretariatService',
    );
    return meeting;
  }

  async updateMeeting(
    id: string,
    data: {
      title?: string;
      meetingDateTime?: Date;
      meetingLocation?: string;
      agenda?: string;
      minutes?: string;
      participantIds?: string[];
    },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si la réunion existe
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { subsidiary: true }, // Inclure pour vérification filiale
    });
    if (!meeting) {
      this.logger.error(
        `Meeting with ID ${id} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Meeting not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to update meeting ${id}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized to update this meeting',
      );
    }
    const ctx = { subsidiaryId: currentUser.subsidiaryId, hasGlobalScope: currentUser.role === UserRole.ADMIN };
    assertSubsidiaryAccess(meeting.subsidiaryId, ctx);

    // Vérifier si des données de mise à jour sont fournies
    if (!data || Object.keys(data).length === 0) {
      return meeting;
    }

    // Mettre à jour la réunion avec gestion des participants en transaction
    const updatedMeeting = await this.prisma.$transaction(async (tx) => {
      // Mettre à jour les champs de base si fournis
      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.meetingDateTime) updateData.meetingDateTime = data.meetingDateTime;
      if (data.meetingLocation !== undefined)
        updateData.meetingLocation = data.meetingLocation;
      if (data.agenda !== undefined) updateData.agenda = data.agenda;
      if (data.minutes !== undefined) {
        updateData.minutes = data.minutes;
        updateData.minutesUpdatedBy = currentUser.id;
        updateData.minutesUpdatedAt = new Date();
      }

      const updated = await tx.meeting.update({
        where: { id },
        data: updateData,
      });

      // Gérer les participants si fournis
      if (data.participantIds !== undefined) {
        // Supprimer les anciens participants
        await tx.meetingParticipant.deleteMany({ where: { meetingId: id } });

        // Ajouter les nouveaux
        if (data.participantIds.length > 0) {
          // Vérifier employés
          const employees = await tx.employee.findMany({
            where: {
              id: { in: data.participantIds },
              subsidiaryId: meeting.subsidiaryId,
            },
          });

          if (employees.length !== data.participantIds.length) {
            this.logger.error(
              `Some employees not found or not from subsidiary ${meeting.subsidiaryId}`,
              'SecretariatService',
            );
            throw new BadRequestException(
              'Some employees not found or do not belong to the specified subsidiary',
            );
          }

          const participantData = data.participantIds.map((employeeId) => ({
            meetingId: id,
            employeeId,
          }));

          await tx.meetingParticipant.createMany({
            data: participantData,
            skipDuplicates: true,
          });
        }
      }

      return updated;
    });

    this.logger.log(`Meeting ${id} updated successfully`, 'SecretariatService');
    return updatedMeeting;
  }

  async deleteMeeting(
    id: string,
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si la réunion existe
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { subsidiary: true },
    });
    if (!meeting) {
      this.logger.error(
        `Meeting with ID ${id} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Meeting not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to delete meeting ${id}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized to delete this meeting',
      );
    }
    const ctx = { subsidiaryId: currentUser.subsidiaryId, hasGlobalScope: currentUser.role === UserRole.ADMIN };
    assertSubsidiaryAccess(meeting.subsidiaryId, ctx);

    // Supprimer la réunion (cascade supprime les participants)
    await this.prisma.meeting.delete({ where: { id } });

    this.logger.log(`Meeting ${id} deleted successfully`, 'SecretariatService');
    return { message: 'Meeting deleted successfully' };
  }

  async getAllMeetings(
    ctx: SubsidiaryScopeContext,
    paginationQuery: PaginationQueryDto = {},
  ) {
    let where: Prisma.MeetingWhereInput = {};

    if (paginationQuery.search) {
      where.title = { contains: paginationQuery.search, mode: 'insensitive' };
    }

    where = withSubsidiaryScope(where, ctx);

    const result = await paginate(
      this.prisma.meeting,
      {
        where,
        include: {
          subsidiary: true,
          creator: { select: { id: true, userName: true } },
          participants: {
            include: { employee: true },
          },
        },
        orderBy: { meetingDateTime: 'desc' },
      },
      paginationQuery,
    );

    this.logger.log(
      `Retrieved ${result.data.length} meetings`,
      'SecretariatService',
    );
    return result;
  }

  async searchMeetings(
    query: { title?: string; meetingDateTime?: Date } & PaginationQueryDto,
    ctx: SubsidiaryScopeContext,
  ) {
    let where: any = {};

    if (query.title) {
      where.title = { contains: query.title, mode: 'insensitive' };
    }
    if (query.meetingDateTime) {
      where.meetingDateTime = query.meetingDateTime;
    }

    where = withSubsidiaryScope(where, ctx);

    const result = await paginate(
      this.prisma.meeting,
      {
        where,
        include: {
          subsidiary: true,
          creator: { select: { id: true, userName: true } },
          participants: {
            include: { employee: true },
          },
        },
        orderBy: { meetingDateTime: 'desc' },
      },
      query,
    );

    this.logger.log(
      `Found ${result.data.length} meetings matching query`,
      'SecretariatService',
    );
    return result;
  }

  // Méthodes supplémentaires pour gérer les participants individuellement

  async addParticipantToMeeting(
    meetingId: string,
    employeeId: string,
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si la réunion existe et autorisations (similaire à update)
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { subsidiary: true },
    });
    if (!meeting) {
      this.logger.error(
        `Meeting with ID ${meetingId} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Meeting not found');
    }

    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new ForbiddenException(
        'Not authorized to add participants to this meeting',
      );
    }
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.subsidiaryId !== meeting.subsidiaryId
    ) {
      throw new ForbiddenException(
        'Cannot add participants to a meeting from another subsidiary',
      );
    }

    // Vérifier l'employé
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee || employee.subsidiaryId !== meeting.subsidiaryId) {
      this.logger.error(
        `Employee ${employeeId} not found or not from subsidiary ${meeting.subsidiaryId}`,
        'SecretariatService',
      );
      throw new BadRequestException(
        "Employee not found or does not belong to the meeting's subsidiary",
      );
    }

    // Ajouter le participant
    try {
      const participant = await this.prisma.meetingParticipant.create({
        data: { meetingId, employeeId },
        include: { employee: true, meeting: true },
      });
      this.logger.log(
        `Participant ${employeeId} added to meeting ${meetingId}`,
        'SecretariatService',
      );
      return participant;
    } catch (error) {
      if (error.code === 'P2002') {
        // Violation unique constraint
        this.logger.warn(
          `Employee ${employeeId} already participant in meeting ${meetingId}`,
          'SecretariatService',
        );
        throw new BadRequestException(
          'Employee is already a participant in this meeting',
        );
      }
      throw error;
    }
  }

  async removeParticipantFromMeeting(
    meetingId: string,
    employeeId: string,
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si la réunion existe et autorisations (similaire)
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { subsidiary: true },
    });
    if (!meeting) {
      this.logger.error(
        `Meeting with ID ${meetingId} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Meeting not found');
    }

    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new ForbiddenException(
        'Not authorized to remove participants from this meeting',
      );
    }
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.subsidiaryId !== meeting.subsidiaryId
    ) {
      throw new ForbiddenException(
        'Cannot remove participants from a meeting from another subsidiary',
      );
    }

    // Supprimer le participant
    await this.prisma.meetingParticipant.delete({
      where: {
        meetingId_employeeId: { meetingId, employeeId },
      },
    });

    this.logger.log(
      `Participant ${employeeId} removed from meeting ${meetingId}`,
      'SecretariatService',
    );
    return { message: 'Participant removed successfully' };
  }

  // CRUD for SecretariatTask

  async createSecretariatTask(
    dto: CreateSecretariatTaskDto,
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Déterminer le subsidiaryId: utiliser celui du DTO si fourni, sinon celui de l'utilisateur
    const subsidiaryId = dto.subsidiaryId || currentUser.subsidiaryId;

    // Vérifier les autorisations (SECRETARY ou ADMIN)
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to create a secretariat task`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized to create a secretariat task',
      );
    }

    // Vérifier si la filiale existe et appartient à l'utilisateur
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: subsidiaryId },
    });
    if (!subsidiary) {
      this.logger.error(
        `Subsidiary with ID ${subsidiaryId} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Subsidiary not found');
    }
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.subsidiaryId !== subsidiaryId
    ) {
      this.logger.error(
        `User ${currentUser.id} cannot create task for subsidiary ${subsidiaryId}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Cannot create a task for another subsidiary',
      );
    }

    // Vérifier si l'assigné existe (si fourni)
    if (dto.assignedToId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.assignedToId },
      });
      if (!employee) {
        this.logger.error(
          `Employee with ID ${dto.assignedToId} not found`,
          'SecretariatService',
        );
        throw new NotFoundException('Assigned employee not found');
      }
    }

    // Créer la tâche
    const task = await this.prisma.secretariatTask.create({
      data: {
        id: generateId(ID_PREFIXES.SECRETARIATASK),
        ...dto,
        subsidiaryId: subsidiaryId,
        dueDate: new Date(dto.dueDate),
        createdBy: currentUser.id,
      },
      include: { subsidiary: true, assignedTo: true, creator: { select: { id: true, userName: true } } },
    });

    this.logger.log(
      `Secretariat task ${task.title} created successfully`,
      'SecretariatService',
    );
    return task;
  }

  async updateSecretariatTask(
    id: string,
    dto: UpdateSecretariatTaskDto,
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si la tâche existe
    const task = await this.prisma.secretariatTask.findUnique({
      where: { id },
    });
    if (!task) {
      this.logger.error(
        `Secretariat task with ID ${id} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Secretariat task not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to update secretariat task ${id}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized to update this secretariat task',
      );
    }
    const ctx = { subsidiaryId: currentUser.subsidiaryId, hasGlobalScope: currentUser.role === UserRole.ADMIN };
    assertSubsidiaryAccess(task.subsidiaryId, ctx);

    // Vérifier si des données de mise à jour sont fournies
    if (!dto || Object.keys(dto).length === 0) {
      return task;
    }

    // Vérifier si le nouvel assigné existe (si fourni)
    if (dto.assignedToId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.assignedToId },
      });
      if (!employee) {
        this.logger.error(
          `Employee with ID ${dto.assignedToId} not found`,
          'SecretariatService',
        );
        throw new NotFoundException('Assigned employee not found');
      }
    }

    // Mettre à jour la tâche
    const updatedTask = await this.prisma.secretariatTask.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }), // Convertir en objet Date si fourni
      },
      include: { subsidiary: true, assignedTo: true },
    });

    this.logger.log(
      `Secretariat task ${id} updated successfully`,
      'SecretariatService',
    );
    return updatedTask;
  }

  async deleteSecretariatTask(
    id: string,
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si la tâche existe
    const task = await this.prisma.secretariatTask.findUnique({
      where: { id },
    });
    if (!task) {
      this.logger.error(
        `Secretariat task with ID ${id} not found`,
        'SecretariatService',
      );
      throw new NotFoundException('Secretariat task not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to delete secretariat task ${id}`,
        'SecretariatService',
      );
      throw new ForbiddenException(
        'Not authorized to delete this secretariat task',
      );
    }
    const ctx = { subsidiaryId: currentUser.subsidiaryId, hasGlobalScope: currentUser.role === UserRole.ADMIN };
    assertSubsidiaryAccess(task.subsidiaryId, ctx);

    // Supprimer la tâche
    await this.prisma.secretariatTask.delete({ where: { id } });

    this.logger.log(
      `Secretariat task ${id} deleted successfully`,
      'SecretariatService',
    );
    return { message: 'Secretariat task deleted successfully' };
  }

  async getAllSecretariatTasks(
    ctx: SubsidiaryScopeContext,
    paginationQuery: PaginationQueryDto = {},
  ) {
    let where: Prisma.SecretariatTaskWhereInput = {};

    if (paginationQuery.search) {
      where.title = { contains: paginationQuery.search, mode: 'insensitive' };
    }

    where = withSubsidiaryScope(where, ctx);

    const result = await paginate(
      this.prisma.secretariatTask,
      {
        where,
        include: { subsidiary: true, assignedTo: true, creator: { select: { id: true, userName: true } } },
        orderBy: { dueDate: 'asc' },
      },
      paginationQuery,
    );

    this.logger.log(
      `Retrieved ${result.data.length} secretariat tasks`,
      'SecretariatService',
    );
    return result;
  }

  async searchSecretariatTasks(
    query: {
      title?: string;
      status?: SecretariatTaskStatus;
      dueDate?: Date;
    } & PaginationQueryDto,
    ctx: SubsidiaryScopeContext,
  ) {
    let where: any = {};

    if (query.title) {
      where.title = { contains: query.title, mode: 'insensitive' };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.dueDate) {
      where.dueDate = query.dueDate;
    }

    where = withSubsidiaryScope(where, ctx);

    const result = await paginate(
      this.prisma.secretariatTask,
      {
        where,
        include: { subsidiary: true, assignedTo: true, creator: { select: { id: true, userName: true } } },
        orderBy: { dueDate: 'asc' },
      },
      query,
    );

    this.logger.log(
      `Found ${result.data.length} secretariat tasks matching query`,
      'SecretariatService',
    );
    return result;
  }
}
