import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
import { UserRole } from '@prisma/client';
import { generateId } from '../../utils/generate-id.util';
import { ID_PREFIXES } from '../../constants/id-prefixes.const';

@Injectable()
export class SubsidiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async createSubsidiary(
    data: {
      subsidiaryName: string;
      logoSvg: string;
      address: string;
      phone: string;
      email: string;
      ifu: string;
      rccm: string;
      bankName: string;
      accountNumber: string;
      swiftCode: string;
      shareCapital: number;
    },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier les autorisations (seul ADMIN peut créer une filiale)
    if (currentUser.role !== UserRole.ADMIN) {
      this.logger.error(`User ${currentUser.id} is not authorized to create a subsidiary`, 'SubsidiaryService');
      throw new ForbiddenException('You are not authorized to create a subsidiary');
    }

    // Vérifier si l'email est déjà utilisé
    const existingSubsidiary = await this.prisma.subsidiary.findUnique({ where: { email: data.email } });
    if (existingSubsidiary) {
      this.logger.error(`Subsidiary with email ${data.email} already exists`, 'SubsidiaryService');
      throw new ConflictException('Email already in use');
    }

    // Créer la filiale
    const subsidiary = await this.prisma.subsidiary.create({
      data: {
        id: generateId(ID_PREFIXES.SUBSIDIARY),
        ...data,
        shareCapital: Number(data.shareCapital),
      },
    });

    this.logger.log(`Subsidiary ${subsidiary.subsidiaryName} created successfully`, 'SubsidiaryService');
    return {
      id: subsidiary.id,
      subsidiaryName: subsidiary.subsidiaryName,
      email: subsidiary.email,
      address: subsidiary.address,
      phone: subsidiary.phone,
      ifu: subsidiary.ifu,
      rccm: subsidiary.rccm,
      bankName: subsidiary.bankName,
      accountNumber: subsidiary.accountNumber,
      swiftCode: subsidiary.swiftCode,
      shareCapital: subsidiary.shareCapital,
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
    },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Vérifier si la filiale existe
    const subsidiary = await this.prisma.subsidiary.findUnique({ where: { id } });
    if (!subsidiary) {
      this.logger.error(`Subsidiary with ID ${id} not found`, 'SubsidiaryService');
      throw new NotFoundException('Subsidiary not found');
    }

    // Vérifier les autorisations
    if (currentUser.role !== UserRole.ADMIN && currentUser.subsidiaryId !== id) {
      this.logger.error(`User ${currentUser.id} is not authorized to update subsidiary ${id}`, 'SubsidiaryService');
      throw new ForbiddenException('You are not authorized to update this subsidiary');
    }

    // Vérifier si le nouvel email est déjà utilisé (si fourni)
    if (data.email && data.email !== subsidiary.email) {
      const existingSubsidiary = await this.prisma.subsidiary.findUnique({ where: { email: data.email } });
      if (existingSubsidiary) {
        this.logger.error(`Email ${data.email} is already in use`, 'SubsidiaryService');
        throw new ConflictException('Email already in use');
      }
    }

    // Mettre à jour la filiale
    const updatedSubsidiary = await this.prisma.subsidiary.update({
      where: { id },
      data: {
        ...data,
        shareCapital: data.shareCapital ? Number(data.shareCapital) : undefined,
      },
    });

    this.logger.log(`Subsidiary ${id} updated successfully`, 'SubsidiaryService');
    return {
      id: updatedSubsidiary.id,
      subsidiaryName: updatedSubsidiary.subsidiaryName,
      email: updatedSubsidiary.email,
      address: updatedSubsidiary.address,
      phone: updatedSubsidiary.phone,
      ifu: updatedSubsidiary.ifu,
      rccm: updatedSubsidiary.rccm,
      bankName: updatedSubsidiary.bankName,
      accountNumber: updatedSubsidiary.accountNumber,
      swiftCode: updatedSubsidiary.swiftCode,
      shareCapital: updatedSubsidiary.shareCapital,
    };
  }

  async deleteSubsidiary(id: string, currentUser: { id: string; role: UserRole; subsidiaryId: string }) {
    // Vérifier si la filiale existe
    const subsidiary = await this.prisma.subsidiary.findUnique({ where: { id } });
    if (!subsidiary) {
      this.logger.error(`Subsidiary with ID ${id} not found`, 'SubsidiaryService');
      throw new NotFoundException('Subsidiary not found');
    }

    // Vérifier les autorisations (seul ADMIN peut supprimer)
    if (currentUser.role !== UserRole.ADMIN) {
      this.logger.error(`User ${currentUser.id} is not authorized to delete subsidiary ${id}`, 'SubsidiaryService');
      throw new ForbiddenException('You are not authorized to delete this subsidiary');
    }

    // Supprimer la filiale
    await this.prisma.subsidiary.delete({ where: { id } });

    this.logger.log(`Subsidiary ${id} deleted successfully`, 'SubsidiaryService');
    return { message: 'Subsidiary deleted successfully' };
  }

  async getAllSubsidiaries(currentUser: { id: string; role: UserRole; subsidiaryId: string }) {
    // Les admins peuvent voir toutes les filiales, les autres sont limités à leur filiale
    const where = currentUser.role === UserRole.ADMIN ? {} : { id: currentUser.subsidiaryId };

    const subsidiaries = await this.prisma.subsidiary.findMany({
      where,
      orderBy: { subsidiaryName: 'asc' },
    });

    this.logger.log(`Retrieved ${subsidiaries.length} subsidiaries`, 'SubsidiaryService');
    return subsidiaries.map((subsidiary) => ({
      id: subsidiary.id,
      subsidiaryName: subsidiary.subsidiaryName,
      email: subsidiary.email,
      address: subsidiary.address,
      phone: subsidiary.phone,
      ifu: subsidiary.ifu,
      rccm: subsidiary.rccm,
      bankName: subsidiary.bankName,
      accountNumber: subsidiary.accountNumber,
      swiftCode: subsidiary.swiftCode,
      shareCapital: subsidiary.shareCapital,
    }));
  }

  async searchSubsidiaries(
    query: { subsidiaryName?: string; email?: string },
    currentUser: { id: string; role: UserRole; subsidiaryId: string },
  ) {
    // Construire les conditions de recherche
    const where: any = currentUser.role === UserRole.ADMIN ? {} : { id: currentUser.subsidiaryId };
    if (query.subsidiaryName) {
      where.subsidiaryName = { contains: query.subsidiaryName, mode: 'insensitive' };
    }
    if (query.email) {
      where.email = { contains: query.email, mode: 'insensitive' };
    }

    const subsidiaries = await this.prisma.subsidiary.findMany({
      where,
      orderBy: { subsidiaryName: 'asc' },
    });

    this.logger.log(`Found ${subsidiaries.length} subsidiaries matching query`, 'SubsidiaryService');
    return subsidiaries.map((subsidiary) => ({
      id: subsidiary.id,
      subsidiaryName: subsidiary.subsidiaryName,
      email: subsidiary.email,
      address: subsidiary.address,
      phone: subsidiary.phone,
      ifu: subsidiary.ifu,
      rccm: subsidiary.rccm,
      bankName: subsidiary.bankName,
      accountNumber: subsidiary.accountNumber,
      swiftCode: subsidiary.swiftCode,
      shareCapital: subsidiary.shareCapital,
    }));
  }
}