import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée ou retourne l'exercice fiscal de l'année civile courante.
   * Appelé automatiquement lors de la première journalisation de l'année.
   */
  async getOrCreateCurrentFiscalYear(subsidiaryId: string, userId: string) {
    const year = new Date().getFullYear();
    const name = `Exercice ${year}`;

    const existing = await this.prisma.fiscalYear.findUnique({
      where: { subsidiaryId_name: { subsidiaryId, name } },
    });
    if (existing) return existing;

    return this.prisma.fiscalYear.create({
      data: {
        id: generateId(ID_PREFIXES.ACCOUNTINGPERIOD),
        name,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
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
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { subsidiaryId, isActive: true, isClosed: false },
      orderBy: { startDate: 'desc' },
    });
    return fy;
  }

  async close(id: string, user: JwtUser) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    if (!fy) throw new NotFoundException(`Exercice introuvable.`);
    if (fy.isClosed)
      throw new BadRequestException(`Cet exercice est déjà clôturé.`);

    // Vérifier qu'il n'y a plus d'écritures en DRAFT
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
}
