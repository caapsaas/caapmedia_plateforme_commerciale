import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
import { FileUploadService } from '../../utils/file-upload.service';
import { Prisma, UserRole } from '@prisma/client';
import { generateId } from '../../utils/generate-id.util';
import { ID_PREFIXES } from '../../constants/id-prefixes.const';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';
import { paginate } from '../../pagination/pagination';

@Injectable()
export class SubsidiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  private hasAdminPrivileges(currentUser?: {
    role?: UserRole;
    roles?: UserRole[];
  }): boolean {
    const callerRoles = currentUser?.roles?.length
      ? currentUser.roles
      : currentUser?.role
        ? [currentUser.role]
        : [];
    return (
      callerRoles.includes(UserRole.ADMIN) ||
      callerRoles.includes(UserRole.SUPER_ADMIN)
    );
  }

  private hasSuperAdminPrivileges(currentUser?: {
    role?: UserRole;
    roles?: UserRole[];
  }): boolean {
    const callerRoles = currentUser?.roles?.length
      ? currentUser.roles
      : currentUser?.role
        ? [currentUser.role]
        : [];
    return callerRoles.includes(UserRole.SUPER_ADMIN);
  }

  async createSubsidiary(
    data: {
      subsidiaryName: string;
      logoSvg?: string;
      address: string;
      phone: string;
      email: string;
      ifu: string;
      rccm: string;
      bankName: string;
      accountNumber: string;
      swiftCode: string;
      shareCapital: number;
      taxRate?: number;
      isHeadquarter?: boolean;
    },
    currentUser: { id: string; role?: UserRole; roles?: UserRole[]; subsidiaryId: string },
  ) {
    // Vérifier les autorisations (seul ADMIN ou SUPER_ADMIN peut créer une filiale)
    if (!this.hasSuperAdminPrivileges(currentUser)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to create a subsidiary`,
        'SubsidiaryService',
      );
      throw new ForbiddenException(
        'You are not authorized to create a subsidiary',
      );
    }

    // Vérifier si l'email est déjà utilisé
    const existingSubsidiary = await this.prisma.subsidiary.findUnique({
      where: { email: data.email },
    });
    if (existingSubsidiary) {
      this.logger.error(
        `Subsidiary with email ${data.email} already exists`,
        'SubsidiaryService',
      );
      throw new ConflictException('Email already in use');
    }

    // Créer la filiale
    const subsidiary = await this.prisma.subsidiary.create({
      data: {
        id: generateId(ID_PREFIXES.SUBSIDIARY),
        subsidiaryName: data.subsidiaryName,
        logoSvg: data.logoSvg || '',
        address: data.address,
        phone: data.phone,
        email: data.email,
        ifu: data.ifu,
        rccm: data.rccm,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        swiftCode: data.swiftCode,
        shareCapital: Number(data.shareCapital),
        taxRate: data.taxRate !== undefined ? data.taxRate : 0.3,
        isHeadquarter: data.isHeadquarter ?? false,
      },
    });

    this.logger.log(
      `Subsidiary ${subsidiary.subsidiaryName} created successfully`,
      'SubsidiaryService',
    );
    return {
      id: subsidiary.id,
      subsidiaryName: subsidiary.subsidiaryName,
      name: subsidiary.subsidiaryName,
      logoSvg: subsidiary.logoSvg,
      email: subsidiary.email,
      address: subsidiary.address,
      phone: subsidiary.phone,
      ifu: subsidiary.ifu,
      rccm: subsidiary.rccm,
      bankName: subsidiary.bankName,
      accountNumber: subsidiary.accountNumber,
      swiftCode: subsidiary.swiftCode,
      shareCapital: Number(subsidiary.shareCapital),
      taxRate: subsidiary.taxRate.toNumber(),
      isHeadquarter: subsidiary.isHeadquarter,
    };
  }

  async updateSubsidiary(
    id: string,
    data: {
      subsidiaryName?: string;
      logoSvg?: string;
      address?: string;
      phone?: string;
      email?: string;
      ifu?: string;
      rccm?: string;
      bankName?: string;
      accountNumber?: string;
      swiftCode?: string;
      shareCapital?: number;
      taxRate?: number;
      isHeadquarter?: boolean;
    },
    currentUser: { id: string; role?: UserRole; roles?: UserRole[]; subsidiaryId: string },
  ) {
    // Vérifier si la filiale existe
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id },
    });
    if (!subsidiary) {
      this.logger.error(
        `Subsidiary with ID ${id} not found`,
        'SubsidiaryService',
      );
      throw new NotFoundException('Subsidiary not found');
    }

    // Vérifier les autorisations
    if (!this.hasSuperAdminPrivileges(currentUser)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to update subsidiary ${id}`,
        'SubsidiaryService',
      );
      throw new ForbiddenException(
        'You are not authorized to update this subsidiary',
      );
    }

    // Vérifier si le nouvel email est déjà utilisé (si fourni)
    if (data.email && data.email !== subsidiary.email) {
      const existingSubsidiary = await this.prisma.subsidiary.findUnique({
        where: { email: data.email },
      });
      if (existingSubsidiary) {
        this.logger.error(
          `Email ${data.email} is already in use`,
          'SubsidiaryService',
        );
        throw new ConflictException('Email already in use');
      }
    }

    // Mettre à jour la filiale
    const updatedSubsidiary = await this.prisma.subsidiary.update({
      where: { id },
      data: {
        ...data,
        shareCapital: data.shareCapital !== undefined ? Number(data.shareCapital) : undefined,
      },
    });

    this.logger.log(
      `Subsidiary ${id} updated successfully`,
      'SubsidiaryService',
    );
    return {
      id: updatedSubsidiary.id,
      subsidiaryName: updatedSubsidiary.subsidiaryName,
      name: updatedSubsidiary.subsidiaryName,
      logoSvg: updatedSubsidiary.logoSvg,
      email: updatedSubsidiary.email,
      address: updatedSubsidiary.address,
      phone: updatedSubsidiary.phone,
      ifu: updatedSubsidiary.ifu,
      rccm: updatedSubsidiary.rccm,
      bankName: updatedSubsidiary.bankName,
      accountNumber: updatedSubsidiary.accountNumber,
      swiftCode: updatedSubsidiary.swiftCode,
      shareCapital: Number(updatedSubsidiary.shareCapital),
      taxRate: updatedSubsidiary.taxRate.toNumber(),
      isHeadquarter: updatedSubsidiary.isHeadquarter,
    };
  }

  async uploadLogo(
    id: string,
    file: Express.Multer.File,
    currentUser: { id: string; role?: UserRole; roles?: UserRole[]; subsidiaryId: string },
  ) {
    const subsidiary = await this.prisma.subsidiary.findUnique({ where: { id } });
    if (!subsidiary) {
      throw new NotFoundException('Subsidiary not found');
    }

    if (!this.hasSuperAdminPrivileges(currentUser)) {
      throw new ForbiddenException('You are not authorized to update this subsidiary logo');
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('Aucun fichier fourni pour le logo');
    }

    const { url } = await this.fileUploadService.uploadFile(file.buffer, file.originalname, {
      subfolder: 'subsidiaries',
      maxSizeMb: 5,
      allowedMimes: [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/svg+xml',
        'image/webp',
      ],
    });

    const updated = await this.prisma.subsidiary.update({
      where: { id },
      data: { logoSvg: url },
    });

    return {
      id: updated.id,
      subsidiaryName: updated.subsidiaryName,
      name: updated.subsidiaryName,
      logoSvg: updated.logoSvg,
    };
  }

  async deleteSubsidiary(
    id: string,
    currentUser: { id: string; role?: UserRole; roles?: UserRole[]; subsidiaryId: string },
  ) {
    // Vérifier si la filiale existe
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id },
    });
    if (!subsidiary) {
      this.logger.error(
        `Subsidiary with ID ${id} not found`,
        'SubsidiaryService',
      );
      throw new NotFoundException('Subsidiary not found');
    }

    // Vérifier les autorisations (seul ADMIN ou SUPER_ADMIN peut supprimer)
    if (!this.hasSuperAdminPrivileges(currentUser)) {
      this.logger.error(
        `User ${currentUser.id} is not authorized to delete subsidiary ${id}`,
        'SubsidiaryService',
      );
      throw new ForbiddenException(
        'You are not authorized to delete this subsidiary',
      );
    }

    // Vérifier si des utilisateurs sont rattachés à cette filiale
    const userCount = await this.prisma.user.count({ where: { subsidiaryId: id } });
    if (userCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la filiale car ${userCount} utilisateur(s) lui sont actuellement rattaché(s). Veuillez d'abord réassigner ou supprimer ces utilisateurs.`,
      );
    }

    // Supprimer la filiale
    try {
      await this.prisma.subsidiary.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Impossible de supprimer cette filiale car des données associées (commandes, stocks, etc.) existent encore.',
        );
      }
      throw error;
    }

    this.logger.log(
      `Subsidiary ${id} deleted successfully`,
      'SubsidiaryService',
    );
    return { message: 'Subsidiary deleted successfully' };
  }

  async getAllSubsidiaries(
    currentUser: {
      id: string;
      role?: UserRole;
      roles?: UserRole[];
      subsidiaryId: string;
    },
    paginationQuery: PaginationQueryDto = {},
  ) {
    const isGlobalScope = this.hasAdminPrivileges(currentUser);
    const where: any = isGlobalScope ? {} : { id: currentUser.subsidiaryId };

    if (paginationQuery.search && paginationQuery.search.trim() !== '') {
      const term = paginationQuery.search.trim();
      where.OR = [
        { subsidiaryName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { address: { contains: term, mode: 'insensitive' } },
      ];
    }

    const result = await paginate(
      this.prisma.subsidiary,
      { where, orderBy: { subsidiaryName: 'asc' } },
      paginationQuery,
    );

    this.logger.log(
      `Retrieved ${result.data.length} subsidiaries`,
      'SubsidiaryService',
    );
    return {
      ...result,
      data: result.data.map((subsidiary) => ({
        id: subsidiary.id,
        subsidiaryName: subsidiary.subsidiaryName,
        name: subsidiary.subsidiaryName,
        logoSvg: subsidiary.logoSvg,
        email: subsidiary.email,
        address: subsidiary.address,
        phone: subsidiary.phone,
        ifu: subsidiary.ifu,
        rccm: subsidiary.rccm,
        bankName: subsidiary.bankName,
        accountNumber: subsidiary.accountNumber,
        swiftCode: subsidiary.swiftCode,
        shareCapital: Number(subsidiary.shareCapital),
        taxRate: subsidiary.taxRate.toNumber(),
        isHeadquarter: subsidiary.isHeadquarter,
      })),
    };
  }

  async searchSubsidiaries(
    query: { subsidiaryName?: string; email?: string } & PaginationQueryDto,
    currentUser: { id: string; role?: UserRole; roles?: UserRole[]; subsidiaryId: string },
  ) {
    const isGlobalScope = this.hasAdminPrivileges(currentUser);
    const where: any = isGlobalScope ? {} : { id: currentUser.subsidiaryId };
    if (query.subsidiaryName) {
      where.subsidiaryName = {
        contains: query.subsidiaryName,
        mode: 'insensitive',
      };
    }
    if (query.email) {
      where.email = { contains: query.email, mode: 'insensitive' };
    }
    if (query.search && query.search.trim() !== '') {
      const term = query.search.trim();
      where.OR = [
        { subsidiaryName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const result = await paginate(
      this.prisma.subsidiary,
      { where, orderBy: { subsidiaryName: 'asc' } },
      query,
    );

    this.logger.log(
      `Found ${result.data.length} subsidiaries matching query`,
      'SubsidiaryService',
    );
    return {
      ...result,
      data: result.data.map((subsidiary) => ({
        id: subsidiary.id,
        subsidiaryName: subsidiary.subsidiaryName,
        name: subsidiary.subsidiaryName,
        logoSvg: subsidiary.logoSvg,
        email: subsidiary.email,
        address: subsidiary.address,
        phone: subsidiary.phone,
        ifu: subsidiary.ifu,
        rccm: subsidiary.rccm,
        bankName: subsidiary.bankName,
        accountNumber: subsidiary.accountNumber,
        swiftCode: subsidiary.swiftCode,
        shareCapital: Number(subsidiary.shareCapital),
        taxRate: subsidiary.taxRate.toNumber(),
        isHeadquarter: subsidiary.isHeadquarter,
      })),
    };
  }
}
