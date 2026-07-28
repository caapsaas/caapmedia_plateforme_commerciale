import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

export interface CreateFiscalYearDto {
  name: string;
  startDate: string;
  endDate: string;
}

@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée ou retourne l'exercice fiscal de l'année civile courante.
   * Appelé automatiquement lors de la première journalisation de l'année.
   */
  async getOrCreateCurrentFiscalYear(subsidiaryId: string) {
    const year = new Date().getFullYear();
    const name = `Exercice ${year}`;

    const existing = await this.prisma.fiscalYear.findUnique({
      where: { subsidiaryId_name: { subsidiaryId, name } },
    });
    if (existing) return existing;

    return this.create(
      { name, startDate: `${year}-01-01`, endDate: `${year}-12-31` },
      subsidiaryId,
    );
  }

  async create(dto: CreateFiscalYearDto, subsidiaryId: string) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin.',
      );
    }

    const overlapping = await this.prisma.fiscalYear.findFirst({
      where: {
        subsidiaryId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlapping) {
      throw new BadRequestException(
        `Cet exercice chevauche un exercice existant (${overlapping.name}, ${overlapping.startDate.toLocaleDateString('fr-FR')} - ${overlapping.endDate.toLocaleDateString('fr-FR')}).`,
      );
    }

    return this.prisma.fiscalYear.create({
      data: {
        id: generateId(ID_PREFIXES.FISCALYEAR),
        name: dto.name,
        startDate,
        endDate,
        isActive: true,
        isClosed: false,
        subsidiaryId,
      },
    });
  }

  async findAll(user: JwtUser) {
    return this.prisma.fiscalYear.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findActive(subsidiaryId: string) {
    return this.prisma.fiscalYear.findFirst({
      where: { subsidiaryId, isActive: true, isClosed: false },
      orderBy: { startDate: 'desc' },
    });
  }

  async close(id: string, user: JwtUser) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    if (!fy) throw new NotFoundException('Exercice introuvable.');
    if (fy.isClosed)
      throw new BadRequestException('Cet exercice est déjà clôturé.');

    const drafts = await this.prisma.journalEntry.count({
      where: { fiscalYearId: id, status: 'DRAFT' },
    });
    if (drafts > 0) {
      throw new BadRequestException(
        `Impossible de clôturer : ${drafts} écriture(s) encore en brouillon.`,
      );
    }

    return this.prisma.fiscalYear.update({
      where: { id },
      data: { isClosed: true, isActive: false },
    });
  }

  /** Réouverture d'un exercice clôturé — nécessaire si une correction (extourne)
   * doit y être rattachée après coup. */
  async reopen(id: string, user: JwtUser) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    if (!fy) throw new NotFoundException('Exercice introuvable.');
    if (!fy.isClosed)
      throw new BadRequestException('Cet exercice est déjà ouvert.');

    return this.prisma.fiscalYear.update({
      where: { id },
      data: { isClosed: false, isActive: true },
    });
  }
}
