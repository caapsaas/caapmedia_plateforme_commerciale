import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JournalType } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

// Les 5 journaux SYSCOHADA — référentiel global, partagé par toutes les filiales.
// La trésorerie est scindée en Banque/Caisse (pas un seul journal "Trésorerie")
// pour rester alignée sur la pratique OHADA standard.
export const DEFAULT_JOURNALS = [
  { code: 'JV', name: 'Journal des Ventes', journalType: JournalType.VENTES },
  { code: 'JA', name: 'Journal des Achats', journalType: JournalType.ACHATS },
  { code: 'JB', name: 'Journal de Banque', journalType: JournalType.BANQUE },
  { code: 'JC', name: 'Journal de Caisse', journalType: JournalType.CAISSE },
  {
    code: 'JOD',
    name: 'Journal des Opérations Diverses',
    journalType: JournalType.OD,
  },
];

@Injectable()
export class JournalsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Initialise les 5 journaux SYSCOHADA. Idempotent. */
  async seedDefaultJournals(): Promise<void> {
    for (const j of DEFAULT_JOURNALS) {
      await this.prisma.accountingJournal.upsert({
        where: { code: j.code },
        create: { id: generateId(ID_PREFIXES.ACCOUNTINGJOURNAL), ...j },
        update: { name: j.name, journalType: j.journalType },
      });
    }
  }

  async findAll() {
    return this.prisma.accountingJournal.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findByCode(code: string) {
    const journal = await this.prisma.accountingJournal.findUnique({
      where: { code },
    });
    if (!journal) throw new NotFoundException(`Journal "${code}" introuvable.`);
    return journal;
  }
}
