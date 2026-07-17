import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JournalType } from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

// Les 4 journaux SYSCOHADA obligatoires
export const DEFAULT_JOURNALS = [
  { code: 'JV', name: 'Journal des Ventes', journalType: JournalType.VENTES },
  { code: 'JA', name: 'Journal des Achats', journalType: JournalType.ACHATS },
  {
    code: 'JB',
    name: 'Journal de Trésorerie / Banque',
    journalType: JournalType.TRESORERIE,
  },
  {
    code: 'JOD',
    name: 'Journal des Opérations Diverses',
    journalType: JournalType.OD,
  },
];

@Injectable()
export class JournalsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialise les 4 journaux SYSCOHADA pour une filiale.
   * Idempotent : ignore ceux qui existent déjà.
   */
  async seedDefaultJournals(subsidiaryId: string): Promise<void> {
    for (const j of DEFAULT_JOURNALS) {
      await this.prisma.accountingJournal.upsert({
        where: { subsidiaryId_code: { subsidiaryId, code: j.code } },
        create: { ...j, subsidiaryId },
        update: {},
      });
    }
  }

  async findAll(user: JwtUser) {
    return this.prisma.accountingJournal.findMany({
      where: { subsidiaryId: user.subsidiaryId, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findByCode(code: string, subsidiaryId: string) {
    const journal = await this.prisma.accountingJournal.findUnique({
      where: { subsidiaryId_code: { subsidiaryId, code } },
    });
    if (!journal)
      throw new NotFoundException(
        `Journal "${code}" introuvable pour cette filiale.`,
      );
    return journal;
  }
}
