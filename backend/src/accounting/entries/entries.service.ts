import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JournalEntryStatus, Prisma } from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
export interface CreateJournalEntryDto {
  entryDate: string;
  description: string;
  fiscalYearId: string;
  lines: Array<{
    accountId: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
  }>;
}

@Injectable()
export class EntriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une écriture comptable en partie double.
   * Vérifie l'équilibre débit = crédit avant de persister.
   */
  async create(dto: CreateJournalEntryDto, user: JwtUser) {
    const totalDebit = dto.lines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCredit = dto.lines.reduce((s, l) => s + l.creditAmount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException(
        `Écriture déséquilibrée : débit ${totalDebit} ≠ crédit ${totalCredit}.`,
      );
    }

    const fiscalYear = await this.prisma.fiscalYear.findFirst({
      where: { id: dto.fiscalYearId, subsidiaryId: user.subsidiaryId, isClosed: false },
    });

    if (!fiscalYear) {
      throw new NotFoundException(`Exercice fiscal introuvable ou clôturé.`);
    }

    const entryNumber = await this.generateEntryNumber(user.subsidiaryId);

    return this.prisma.journalEntry.create({
      data: {
        id: generateId(ID_PREFIXES.JOURNALENTRY),
        entryNumber,
        entryDate: new Date(dto.entryDate),
        description: dto.description,
        status: JournalEntryStatus.DRAFT,
        totalAmount: new Prisma.Decimal(totalDebit),
        fiscalYearId: dto.fiscalYearId,
        subsidiaryId: user.subsidiaryId,
        createdBy: user.id,
        lines: {
          create: dto.lines.map((line) => ({
            accountId: line.accountId,
            description: line.description,
            debitAmount: new Prisma.Decimal(line.debitAmount),
            creditAmount: new Prisma.Decimal(line.creditAmount),
            balance: new Prisma.Decimal(line.debitAmount - line.creditAmount),
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  async findAll(user: JwtUser, fiscalYearId?: string, status?: JournalEntryStatus) {
    return this.prisma.journalEntry.findMany({
      where: {
        subsidiaryId: user.subsidiaryId,
        ...(fiscalYearId ? { fiscalYearId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { entryDate: 'desc' },
      include: {
        lines: { include: { account: { select: { accountNumber: true, accountName: true } } } },
      },
    });
  }

  async findOne(id: string, user: JwtUser) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
      include: {
        lines: { include: { account: { select: { accountNumber: true, accountName: true } } } },
        fiscalYear: { select: { name: true } },
      },
    });

    if (!entry) throw new NotFoundException(`Écriture comptable "${id}" introuvable.`);
    return entry;
  }

  /**
   * Valide une écriture (passe de DRAFT à POSTED).
   * Une écriture validée ne peut plus être modifiée — elle doit être annulée par contre-passation.
   */
  async post(id: string, user: JwtUser) {
    const entry = await this.findOne(id, user);

    if (entry.status === JournalEntryStatus.POSTED) {
      throw new BadRequestException('Cette écriture est déjà validée.');
    }
    if (entry.status === JournalEntryStatus.CANCELLED) {
      throw new BadRequestException('Impossible de valider une écriture annulée.');
    }

    return this.prisma.journalEntry.update({
      where: { id },
      data: { status: JournalEntryStatus.POSTED },
    });
  }

  /**
   * Annule une écriture par contre-passation (crée une écriture inversée).
   * Interdit la suppression physique des écritures validées.
   */
  async cancel(id: string, user: JwtUser) {
    const entry = await this.findOne(id, user);

    if (entry.status === JournalEntryStatus.CANCELLED) {
      throw new BadRequestException('Cette écriture est déjà annulée.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Marquer l'écriture originale comme annulée
      await tx.journalEntry.update({ where: { id }, data: { status: JournalEntryStatus.CANCELLED } });

      if (entry.status === JournalEntryStatus.POSTED) {
        // Créer l'écriture de contre-passation (lignes inversées)
        const entryNumber = await this.generateEntryNumber(user.subsidiaryId);
        await tx.journalEntry.create({
          data: {
        id: generateId(ID_PREFIXES.JOURNALENTRY),
            entryNumber,
            entryDate: new Date(),
            description: `Contre-passation de ${entry.entryNumber} : ${entry.description}`,
            status: JournalEntryStatus.POSTED,
            totalAmount: entry.totalAmount,
            fiscalYearId: entry.fiscalYearId,
            subsidiaryId: user.subsidiaryId,
            createdBy: user.id,
            lines: {
              create: entry.lines.map((line) => ({
                accountId: line.accountId,
                description: line.description,
                debitAmount: line.creditAmount,   // inversé
                creditAmount: line.debitAmount,   // inversé
                balance: new Prisma.Decimal(Number(line.creditAmount) - Number(line.debitAmount)),
              })),
            },
          },
        });
      }
    });
  }

  private async generateEntryNumber(subsidiaryId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.journalEntry.count({
      where: { subsidiaryId },
    });
    return `JE-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
