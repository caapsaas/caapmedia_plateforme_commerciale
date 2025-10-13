import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../src/common/utils/prisma/prisma.service';
import { LoggerService } from '../../src/common/utils/logger/logger.service';
import { UserRole, DocumentCategory, DocumentStatus, SecretariatTaskStatus } from '@prisma/client';

@Injectable()
export class SecretariatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // CRUD for CompanyDocument

  async createCompanyDocument(
    data: {
      documentName: string;
      category: DocumentCategory;
      status: DocumentStatus;
      fileUrl: string;
      subsidiaryId: string;
    },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier les autorisations (SECRETARY ou ADMIN)
        const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(`User ${currentUser.id} is not authorized to create a company document`, 'SecretariatService');
      throw new ForbiddenException('You are not authorized to create a company document');
    }

    // Vérifier si la filiale existe et appartient au user
    const subsidiary = await this.prisma.subsidiary.findUnique({ where: { id: data.subsidiaryId } });
    if (!subsidiary) {
      this.logger.error(`Subsidiary with ID ${data.subsidiaryId} not found`, 'SecretariatService');
      throw new NotFoundException('Subsidiary not found');
    }
    if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== data.subsidiaryId) {
      this.logger.error(`User ${currentUser.id} cannot create document for subsidiary ${data.subsidiaryId}`, 'SecretariatService');
      throw new ForbiddenException('You cannot create a document for another subsidiary');
    }

    // Créer le document
    const document = await this.prisma.companyDocument.create({
      data,
    });

    this.logger.log(`Company document ${document.documentName} created successfully`, 'SecretariatService');
    return document;
  }

  async updateCompanyDocument(
    id: string,
    data: {
      documentName?: string;
      category?: DocumentCategory;
      status?: DocumentStatus;
      fileUrl?: string;
    },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si le document existe
    const document = await this.prisma.companyDocument.findUnique({ where: { id } });
    if (!document) {
      this.logger.error(`Company document with ID ${id} not found`, 'SecretariatService');
      throw new NotFoundException('Company document not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(`User ${currentUser.id} is not authorized to update company document ${id}`, 'SecretariatService');
      throw new ForbiddenException('You are not authorized to update this company document');
    }
    if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== document.subsidiaryId) {
      this.logger.error(`User ${currentUser.id} cannot update document from subsidiary ${document.subsidiaryId}`, 'SecretariatService');
      throw new ForbiddenException('You cannot update a document from another subsidiary');
    }

    // Vérifier si des données de mise à jour sont fournies
    if (!data || Object.keys(data).length === 0) {
      return document;
    }

    // Mettre à jour le document
    const updatedDocument = await this.prisma.companyDocument.update({
      where: { id },
      data,
    });

    this.logger.log(`Company document ${id} updated successfully`, 'SecretariatService');
    return updatedDocument;
  }

  async deleteCompanyDocument(id: string, currentUser: { id: string; role: UserRole; subsidiaryId: string }) {
    // Vérifier si le document existe
    const document = await this.prisma.companyDocument.findUnique({ where: { id } });
    if (!document) {
      this.logger.error(`Company document with ID ${id} not found`, 'SecretariatService');
      throw new NotFoundException('Company document not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(`User ${currentUser.id} is not authorized to delete company document ${id}`, 'SecretariatService');
      throw new ForbiddenException('You are not authorized to delete this company document');
    }
    if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== document.subsidiaryId) {
      this.logger.error(`User ${currentUser.id} cannot delete document from subsidiary ${document.subsidiaryId}`, 'SecretariatService');
      throw new ForbiddenException('You cannot delete a document from another subsidiary');
    }

    // Supprimer le document
    await this.prisma.companyDocument.delete({ where: { id } });

    this.logger.log(`Company document ${id} deleted successfully`, 'SecretariatService');
    return { message: 'Company document deleted successfully' };
  }

  async getAllCompanyDocuments(currentUser: { id: string; role: UserRole; subsidiaryId: string }) {
    // Les admins peuvent voir tous les documents, les autres sont limités à leur filiale
    const where = currentUser.role === UserRole.ADMIN ? {} : { subsidiaryId: currentUser.subsidiaryId };

    const documents = await this.prisma.companyDocument.findMany({
      where,
      include: { subsidiary: true },
      orderBy: { uploadDate: 'desc' },
    });

    this.logger.log(`Retrieved ${documents.length} company documents`, 'SecretariatService');
    return documents;
  }

  async searchCompanyDocuments(
    query: { documentName?: string; category?: DocumentCategory; status?: DocumentStatus },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Construire les conditions de recherche
    const where: any = currentUser.role === UserRole.ADMIN ? {} : { subsidiaryId: currentUser.subsidiaryId };
    if (query.documentName) {
      where.documentName = { contains: query.documentName, mode: 'insensitive' };
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.status) {
      where.status = query.status;
    }

    const documents = await this.prisma.companyDocument.findMany({
      where,
      include: { subsidiary: true },
      orderBy: { uploadDate: 'desc' },
    });

    this.logger.log(`Found ${documents.length} company documents matching query`, 'SecretariatService');
    return documents;
  }

  // CRUD for Meeting

async createMeeting(
  data: {
    title: string;
    meetingDate: Date;
    meetingTime: Date;
    meetingLocation?: string;
    agenda?: string;
    minutes?: string;
    subsidiaryId: string;
    participantIds?: string[];  // Ajout : Liste optionnelle d'IDs employés (UUIDs)
  },
  currentUser: { id: string; role: UserRole; subsidiaryId: string },
) {
  // Vérifier les autorisations (SECRETARY ou ADMIN)
  const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
  if (!allowedRoles.includes(currentUser.role)) {
    this.logger.error(`User ${currentUser.id} is not authorized to create a meeting`, 'SecretariatService');
    throw new ForbiddenException('You are not authorized to create a meeting');
  }

  // Vérifier si la filiale existe et appartient au user
  const subsidiary = await this.prisma.subsidiary.findUnique({ where: { id: data.subsidiaryId } });
  if (!subsidiary) {
    this.logger.error(`Subsidiary with ID ${data.subsidiaryId} not found`, 'SecretariatService');
    throw new NotFoundException('Subsidiary not found');
  }
  if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== data.subsidiaryId) {
    this.logger.error(`User ${currentUser.id} cannot create meeting for subsidiary ${data.subsidiaryId}`, 'SecretariatService');
    throw new ForbiddenException('You cannot create a meeting for another subsidiary');
  }

  // Créer la réunion avec gestion des participants en transaction
  const meeting = await this.prisma.$transaction(async (tx) => {
    // Créer la réunion de base
    const createdMeeting = await tx.meeting.create({
      data: {
        title: data.title,
        meetingDate: data.meetingDate,
        meetingTime: data.meetingTime,
        meetingLocation: data.meetingLocation,
        agenda: data.agenda,
        minutes: data.minutes,
        subsidiaryId: data.subsidiaryId,
      },
    });

    // Ajouter les participants si fournis
    if (data.participantIds && data.participantIds.length > 0) {
      // Vérifier que les employés existent et appartiennent à la même filiale
      const employees = await tx.employee.findMany({
        where: {
          id: { in: data.participantIds },
          subsidiaryId: data.subsidiaryId,  // Restriction à la filiale du meeting
        },
      });

      if (employees.length !== data.participantIds.length) {
        this.logger.error(`Some employees not found or not from subsidiary ${data.subsidiaryId}`, 'SecretariatService');
        throw new BadRequestException('Some employees not found or do not belong to the specified subsidiary');
      }

      // Créer les liens participants
      const participantData = data.participantIds.map(employeeId => ({
        meetingId: createdMeeting.id,
        employeeId,
      }));

      await tx.meetingParticipant.createMany({
        data: participantData,
        skipDuplicates: true,  // Ignore doublons via @@unique
      });
    }

    return createdMeeting;
  });

  this.logger.log(`Meeting ${meeting.title} created successfully`, 'SecretariatService');
  return meeting;
}

async updateMeeting(
  id: string,
  data: {
    title?: string;
    meetingDate?: Date;
    meetingTime?: Date;
    meetingLocation?: string;
    agenda?: string;
    minutes?: string;
    participantIds?: string[];  // Ajout : Liste optionnelle pour mettre à jour les participants
  },
  currentUser: { id: string; role: UserRole; subsidiaryId: string },
) {
  // Vérifier si la réunion existe
  const meeting = await this.prisma.meeting.findUnique({ 
    where: { id },
    include: { subsidiary: true },  // Inclure pour vérification filiale
  });
  if (!meeting) {
    this.logger.error(`Meeting with ID ${id} not found`, 'SecretariatService');
    throw new NotFoundException('Meeting not found');
  }

  // Vérifier les autorisations
  const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
  if (!allowedRoles.includes(currentUser.role)) {
    this.logger.error(`User ${currentUser.id} is not authorized to update meeting ${id}`, 'SecretariatService');
    throw new ForbiddenException('You are not authorized to update this meeting');
  }
  if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== meeting.subsidiaryId) {
    this.logger.error(`User ${currentUser.id} cannot update meeting from subsidiary ${meeting.subsidiaryId}`, 'SecretariatService');
    throw new ForbiddenException('You cannot update a meeting from another subsidiary');
  }

  // Vérifier si des données de mise à jour sont fournies
  if (!data || Object.keys(data).length === 0) {
    return meeting;
  }

  // Mettre à jour la réunion avec gestion des participants en transaction
  const updatedMeeting = await this.prisma.$transaction(async (tx) => {
    // Mettre à jour les champs de base si fournis
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.meetingDate) updateData.meetingDate = data.meetingDate;
    if (data.meetingTime) updateData.meetingTime = data.meetingTime;
    if (data.meetingLocation !== undefined) updateData.meetingLocation = data.meetingLocation;
    if (data.agenda !== undefined) updateData.agenda = data.agenda;
    if (data.minutes !== undefined) updateData.minutes = data.minutes;

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
          this.logger.error(`Some employees not found or not from subsidiary ${meeting.subsidiaryId}`, 'SecretariatService');
          throw new BadRequestException('Some employees not found or do not belong to the specified subsidiary');
        }

        const participantData = data.participantIds.map(employeeId => ({
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

async deleteMeeting(id: string, currentUser: { id: string; role: UserRole; subsidiaryId: string }) {
  // Vérifier si la réunion existe
  const meeting = await this.prisma.meeting.findUnique({ 
    where: { id },
    include: { subsidiary: true },
  });
  if (!meeting) {
    this.logger.error(`Meeting with ID ${id} not found`, 'SecretariatService');
    throw new NotFoundException('Meeting not found');
  }

  // Vérifier les autorisations
  const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
  if (!allowedRoles.includes(currentUser.role)) {
    this.logger.error(`User ${currentUser.id} is not authorized to delete meeting ${id}`, 'SecretariatService');
    throw new ForbiddenException('You are not authorized to delete this meeting');
  }
  if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== meeting.subsidiaryId) {
    this.logger.error(`User ${currentUser.id} cannot delete meeting from subsidiary ${meeting.subsidiaryId}`, 'SecretariatService');
    throw new ForbiddenException('You cannot delete a meeting from another subsidiary');
  }

  // Supprimer la réunion (cascade supprime les participants)
  await this.prisma.meeting.delete({ where: { id } });

  this.logger.log(`Meeting ${id} deleted successfully`, 'SecretariatService');
  return { message: 'Meeting deleted successfully' };
}

async getAllMeetings(currentUser: { id: string; role: UserRole; subsidiaryId: string }) {
  // Les admins peuvent voir toutes les réunions, les autres sont limités à leur filiale
  const where = currentUser.role === UserRole.ADMIN ? {} : { subsidiaryId: currentUser.subsidiaryId };

  const meetings = await this.prisma.meeting.findMany({
    where,
    include: { 
      subsidiary: true, 
      participants: { 
        include: { employee: true }  // Ajout : Inclure les détails des employés dans les participants
      } 
    },
    orderBy: { meetingDate: 'desc' },
  });

  this.logger.log(`Retrieved ${meetings.length} meetings`, 'SecretariatService');
  return meetings;
}

async searchMeetings(
  query: { title?: string; meetingDate?: Date },
  currentUser: { id: string; role: UserRole; subsidiaryId: string },
) {
  // Construire les conditions de recherche
  const where: any = currentUser.role === UserRole.ADMIN ? {} : { subsidiaryId: currentUser.subsidiaryId };
  if (query.title) {
    where.title = { contains: query.title, mode: 'insensitive' };
  }
  if (query.meetingDate) {
    where.meetingDate = query.meetingDate;
  }

  const meetings = await this.prisma.meeting.findMany({
    where,
    include: { 
      subsidiary: true, 
      participants: { 
        include: { employee: true }  // Ajout : Inclure les détails des employés dans les participants
      } 
    },
    orderBy: { meetingDate: 'desc' },
  });

  this.logger.log(`Found ${meetings.length} meetings matching query`, 'SecretariatService');
  return meetings;
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
    this.logger.error(`Meeting with ID ${meetingId} not found`, 'SecretariatService');
    throw new NotFoundException('Meeting not found');
  }

  const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
  if (!allowedRoles.includes(currentUser.role)) {
    throw new ForbiddenException('You are not authorized to add participants to this meeting');
  }
  if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== meeting.subsidiaryId) {
    throw new ForbiddenException('You cannot add participants to a meeting from another subsidiary');
  }

  // Vérifier l'employé
  const employee = await this.prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee || employee.subsidiaryId !== meeting.subsidiaryId) {
    this.logger.error(`Employee ${employeeId} not found or not from subsidiary ${meeting.subsidiaryId}`, 'SecretariatService');
    throw new BadRequestException('Employee not found or does not belong to the meeting\'s subsidiary');
  }

  // Ajouter le participant
  try {
    const participant = await this.prisma.meetingParticipant.create({
      data: { meetingId, employeeId },
      include: { employee: true, meeting: true },
    });
    this.logger.log(`Participant ${employeeId} added to meeting ${meetingId}`, 'SecretariatService');
    return participant;
  } catch (error) {
    if (error.code === 'P2002') {  // Violation unique constraint
      this.logger.warn(`Employee ${employeeId} already participant in meeting ${meetingId}`, 'SecretariatService');
      throw new BadRequestException('Employee is already a participant in this meeting');
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
    this.logger.error(`Meeting with ID ${meetingId} not found`, 'SecretariatService');
    throw new NotFoundException('Meeting not found');
  }

  const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
  if (!allowedRoles.includes(currentUser.role)) {
    throw new ForbiddenException('You are not authorized to remove participants from this meeting');
  }
  if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== meeting.subsidiaryId) {
    throw new ForbiddenException('You cannot remove participants from a meeting from another subsidiary');
  }

  // Supprimer le participant
  await this.prisma.meetingParticipant.delete({
    where: {
      meetingId_employeeId: { meetingId, employeeId },
    },
  });

  this.logger.log(`Participant ${employeeId} removed from meeting ${meetingId}`, 'SecretariatService');
  return { message: 'Participant removed successfully' };
}

  // CRUD for SecretariatTask

  async createSecretariatTask(
    data: {
      title: string;
      description: string;
      dueDate: Date;
      status: SecretariatTaskStatus;
      assignedToId?: string;
      subsidiaryId: string;
    },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier les autorisations (SECRETARY ou ADMIN)
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(`User ${currentUser.id} is not authorized to create a secretariat task`, 'SecretariatService');
      throw new ForbiddenException('You are not authorized to create a secretariat task');
    }

    // Vérifier si la filiale existe et appartient au user
    const subsidiary = await this.prisma.subsidiary.findUnique({ where: { id: data.subsidiaryId } });
    if (!subsidiary) {
      this.logger.error(`Subsidiary with ID ${data.subsidiaryId} not found`, 'SecretariatService');
      throw new NotFoundException('Subsidiary not found');
    }
    if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== data.subsidiaryId) {
      this.logger.error(`User ${currentUser.id} cannot create task for subsidiary ${data.subsidiaryId}`, 'SecretariatService');
      throw new ForbiddenException('You cannot create a task for another subsidiary');
    }

    // Vérifier si l'assigné existe (si fourni)
    if (data.assignedToId) {
      const employee = await this.prisma.employee.findUnique({ where: { id: data.assignedToId } });
      if (!employee) {
        this.logger.error(`Employee with ID ${data.assignedToId} not found`, 'SecretariatService');
        throw new NotFoundException('Assigned employee not found');
      }
    }

    // Créer la tâche
    const task = await this.prisma.secretariatTask.create({
      data,
      include: { subsidiary: true, assignedTo: true },
    });

    this.logger.log(`Secretariat task ${task.title} created successfully`, 'SecretariatService');
    return task;
  }

  async updateSecretariatTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: Date;
      status?: SecretariatTaskStatus;
      assignedToId?: string;
    },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si la tâche existe
    const task = await this.prisma.secretariatTask.findUnique({ where: { id } });
    if (!task) {
      this.logger.error(`Secretariat task with ID ${id} not found`, 'SecretariatService');
      throw new NotFoundException('Secretariat task not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(`User ${currentUser.id} is not authorized to update secretariat task ${id}`, 'SecretariatService');
      throw new ForbiddenException('You are not authorized to update this secretariat task');
    }
    if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== task.subsidiaryId) {
      this.logger.error(`User ${currentUser.id} cannot update task from subsidiary ${task.subsidiaryId}`, 'SecretariatService');
      throw new ForbiddenException('You cannot update a task from another subsidiary');
    }

    // Vérifier si des données de mise à jour sont fournies
    if (!data || Object.keys(data).length === 0) {
      return task;
    }

    // Vérifier si le nouvel assigné existe (si fourni)
    if (data.assignedToId) {
      const employee = await this.prisma.employee.findUnique({ where: { id: data.assignedToId } });
      if (!employee) {
        this.logger.error(`Employee with ID ${data.assignedToId} not found`, 'SecretariatService');
        throw new NotFoundException('Assigned employee not found');
      }
    }

    // Mettre à jour la tâche
    const updatedTask = await this.prisma.secretariatTask.update({
      where: { id },
      data,
      include: { subsidiary: true, assignedTo: true },
    });

    this.logger.log(`Secretariat task ${id} updated successfully`, 'SecretariatService');
    return updatedTask;
  }

  async deleteSecretariatTask(id: string, currentUser: { id: string; role: UserRole; subsidiaryId: string }) {
    // Vérifier si la tâche existe
    const task = await this.prisma.secretariatTask.findUnique({ where: { id } });
    if (!task) {
      this.logger.error(`Secretariat task with ID ${id} not found`, 'SecretariatService');
      throw new NotFoundException('Secretariat task not found');
    }

    // Vérifier les autorisations
    const allowedRoles: UserRole[] = [UserRole.SECRETARY, UserRole.ADMIN];
    if (!allowedRoles.includes(currentUser.role)) {
      this.logger.error(`User ${currentUser.id} is not authorized to delete secretariat task ${id}`, 'SecretariatService');
      throw new ForbiddenException('You are not authorized to delete this secretariat task');
    }
    if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== task.subsidiaryId) {
      this.logger.error(`User ${currentUser.id} cannot delete task from subsidiary ${task.subsidiaryId}`, 'SecretariatService');
      throw new ForbiddenException('You cannot delete a task from another subsidiary');
    }

    // Supprimer la tâche
    await this.prisma.secretariatTask.delete({ where: { id } });

    this.logger.log(`Secretariat task ${id} deleted successfully`, 'SecretariatService');
    return { message: 'Secretariat task deleted successfully' };
  }

  async getAllSecretariatTasks(currentUser: { id: string; role: UserRole; subsidiaryId: string }) {
    // Les admins peuvent voir toutes les tâches, les autres sont limités à leur filiale
    const where = currentUser.role === UserRole.ADMIN ? {} : { subsidiaryId: currentUser.subsidiaryId };

    const tasks = await this.prisma.secretariatTask.findMany({
      where,
      include: { subsidiary: true, assignedTo: true },
      orderBy: { dueDate: 'asc' },
    });

    this.logger.log(`Retrieved ${tasks.length} secretariat tasks`, 'SecretariatService');
    return tasks;
  }

  async searchSecretariatTasks(
    query: { title?: string; status?: SecretariatTaskStatus; dueDate?: Date },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Construire les conditions de recherche
    const where: any = currentUser.role === UserRole.ADMIN ? {} : { subsidiaryId: currentUser.subsidiaryId };
    if (query.title) {
      where.title = { contains: query.title, mode: 'insensitive' };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.dueDate) {
      where.dueDate = query.dueDate;
    }

    const tasks = await this.prisma.secretariatTask.findMany({
      where,
      include: { subsidiary: true, assignedTo: true },
      orderBy: { dueDate: 'asc' },
    });

    this.logger.log(`Found ${tasks.length} secretariat tasks matching query`, 'SecretariatService');
    return tasks;
  }
}