import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JournalEntryStatus, Prisma } from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from 'src/common/utils/subsidiary-scope';
import { ACCOUNTING_GLOBAL_SCOPE_ROLES } from '../shared/accounting-scope-roles.const';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { paginate } from 'src/common/pagination/pagination';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

export interface CreateJournalEntryDto {
  entryDate: string;
  description: string;
  journalId: string;
  fiscalYearId?: string;
  lines: Array<{
    accountId: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
  }>;
}

/** Ligne d'une écriture automatique, résolue par NUMÉRO de compte (pas par id) —
 * le générateur qui appelle createAutomaticEntry ne connaît que le plan comptable
 * fonctionnellement, jamais les ids internes. */
export interface AutomaticEntryLineInput {
  accountNumber: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
}

export interface CreateAutomaticEntryDto {
  date: Date;
  /** Référence métier STABLE (jamais Date.now()/uuid aléatoire) : anti-doublon si
   * la génération est rejouée (retry réseau, double appel). */
  reference: string;
  description: string;
  journalCode: string;
  subsidiaryId: string;
  sourceType?: string;
  sourceId?: string;
  lines: AutomaticEntryLineInput[];
}

const BALANCE_TOLERANCE = 0.01;

@Injectable()
export class EntriesService {
  constructor(private readonly prisma: PrismaService) {}

  // =================================================================== //
  //                          LECTURE                                    //
  // =================================================================== //

  async findAll(
    user: JwtUser,
    fiscalYearId?: string,
    status?: JournalEntryStatus,
    startDate?: string,
    endDate?: string,
    subsidiaryIdFilter?: string,
    paginationQuery: PaginationQueryDto = {},
  ) {
    const ctx = resolveScopeContext(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
    const where = withSubsidiaryScope(
      {
        ...(fiscalYearId ? { fiscalYearId } : {}),
        ...(status ? { status } : {}),
        ...(startDate || endDate
          ? {
              entryDate: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
        ...(paginationQuery.search
          ? {
              description: {
                contains: paginationQuery.search,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      ctx,
      subsidiaryIdFilter,
    );

    return paginate(
      this.prisma.journalEntry,
      {
        where,
        orderBy: { entryDate: 'desc' },
        include: {
          journal: { select: { code: true, name: true } },
          lines: {
            include: {
              account: { select: { accountNumber: true, accountName: true } },
            },
          },
        },
      },
      paginationQuery,
    );
  }

  async findOne(id: string, user: JwtUser) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
      include: {
        journal: { select: { code: true, name: true } },
        lines: {
          include: {
            account: { select: { accountNumber: true, accountName: true } },
          },
        },
        fiscalYear: { select: { name: true } },
        reversalOfEntry: { select: { id: true, entryNumber: true } },
        reversedByEntries: { select: { id: true, entryNumber: true } },
      },
    });

    if (!entry)
      throw new NotFoundException(`Écriture comptable "${id}" introuvable.`);
    return entry;
  }

  // =================================================================== //
  //                          ÉCRITURE MANUELLE                          //
  // =================================================================== //

  /**
   * Crée une écriture comptable en partie double, en statut DRAFT.
   * Vérifie l'équilibre débit = crédit et que la période cible n'est pas clôturée.
   */
  async create(dto: CreateJournalEntryDto, user: JwtUser) {
    this.validateBalance(dto.lines);

    const journal = await this.prisma.accountingJournal.findUnique({
      where: { id: dto.journalId },
    });
    if (!journal) throw new NotFoundException('Journal introuvable.');

    const entryDate = new Date(dto.entryDate);
    const fiscalYearId = await this.resolveFiscalYearId(
      user.subsidiaryId,
      entryDate,
      dto.fiscalYearId,
    );

    return this.prisma.journalEntry.create({
      data: {
        id: generateId(ID_PREFIXES.JOURNALENTRY),
        entryNumber: generateId(ID_PREFIXES.JOURNALENTRY),
        entryDate,
        description: dto.description,
        status: JournalEntryStatus.DRAFT,
        journalId: dto.journalId,
        ...(fiscalYearId ? { fiscalYearId } : {}),
        subsidiaryId: user.subsidiaryId,
        createdBy: user.id,
        lines: {
          create: dto.lines.map((line) => ({
            id: generateId(ID_PREFIXES.JOURNALENTRYLINE),
            accountId: line.accountId,
            description: line.description,
            debitAmount: new Prisma.Decimal(line.debitAmount),
            creditAmount: new Prisma.Decimal(line.creditAmount),
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  /**
   * Valide définitivement une écriture DRAFT : passe à POSTED et attribue le
   * numéro de pièce légal (séquentiel, continu par journal/filiale/exercice —
   * jamais attribué avant, pour ne laisser aucun trou dans la séquence en cas
   * d'écriture jamais validée).
   */
  async post(id: string, user: JwtUser) {
    const entry = await this.findOne(id, user);

    if (entry.status === JournalEntryStatus.POSTED) {
      throw new BadRequestException('Cette écriture est déjà validée.');
    }
    if (entry.status === JournalEntryStatus.CANCELLED) {
      throw new BadRequestException(
        'Impossible de valider une écriture annulée.',
      );
    }

    this.validateBalance(entry.lines);

    return this.prisma.$transaction(async (tx) => {
      const sequentialNumber = await this.assignSequentialNumber(
        tx,
        entry.journalId,
        entry.subsidiaryId,
        entry.entryDate,
      );
      return tx.journalEntry.update({
        where: { id },
        data: { status: JournalEntryStatus.POSTED, sequentialNumber },
      });
    });
  }

  /**
   * Annule une écriture encore en DRAFT (jamais opposable, donc jamais
   * comptabilisée) — suppression logique directe, sans contre-passation.
   * Une écriture déjà POSTED doit passer par `reverse()`.
   */
  async cancel(id: string, user: JwtUser) {
    const entry = await this.findOne(id, user);

    if (entry.status === JournalEntryStatus.POSTED) {
      throw new BadRequestException(
        "Cette écriture est déjà validée : utilisez l'extourne (reverse) plutôt que l'annulation.",
      );
    }
    if (entry.status === JournalEntryStatus.CANCELLED) {
      throw new BadRequestException('Cette écriture est déjà annulée.');
    }

    return this.prisma.journalEntry.update({
      where: { id },
      data: { status: JournalEntryStatus.CANCELLED },
    });
  }

  /**
   * Extourne (contre-passation) d'une écriture validée : principe
   * d'intangibilité OHADA — une écriture validée ne se modifie ni ne se
   * supprime jamais. Pour la corriger, on crée une NOUVELLE écriture qui en
   * inverse exactement les lignes (débit ↔ crédit), validée immédiatement et
   * liée à l'originale via `reversalOfEntryId`. L'écriture d'origine reste
   * strictement inchangée (contrairement à l'ancien `cancel()` qui la
   * marquait à tort CANCELLED).
   */
  async reverse(id: string, user: JwtUser) {
    const original = await this.findOne(id, user);

    if (original.status !== JournalEntryStatus.POSTED) {
      throw new BadRequestException(
        'Seule une écriture validée peut être extournée.',
      );
    }

    const alreadyReversed = await this.prisma.journalEntry.findFirst({
      where: { reversalOfEntryId: id },
    });
    if (alreadyReversed) {
      throw new BadRequestException(
        `Cette écriture a déjà été extournée (voir ${alreadyReversed.sequentialNumber || alreadyReversed.entryNumber}).`,
      );
    }

    const reversalDate = new Date();
    // `description` est un champ requis (non-nullable) sur JournalEntryLine —
    // toujours fournir une valeur définie, jamais `undefined` (Prisma rejette
    // l'écriture avec une erreur trompeuse sans rapport si on omet un champ requis).
    const invertedLines = original.lines.map((line) => ({
      accountId: line.accountId,
      description: line.description
        ? `Extourne — ${line.description}`
        : 'Extourne',
      debitAmount: Number(line.creditAmount),
      creditAmount: Number(line.debitAmount),
    }));

    return this.prisma.$transaction(async (tx) => {
      const sequentialNumber = await this.assignSequentialNumber(
        tx,
        original.journalId,
        original.subsidiaryId,
        reversalDate,
      );

      return tx.journalEntry.create({
        data: {
          id: generateId(ID_PREFIXES.JOURNALENTRY),
          entryNumber: `EXT-${original.entryNumber}`,
          entryDate: reversalDate,
          description: `Extourne de "${original.description}" (${original.sequentialNumber || original.entryNumber})`,
          status: JournalEntryStatus.POSTED,
          journalId: original.journalId,
          fiscalYearId: original.fiscalYearId,
          subsidiaryId: original.subsidiaryId,
          createdBy: user.id,
          reversalOfEntryId: id,
          sequentialNumber,
          lines: {
            create: invertedLines.map((line) => ({
              id: generateId(ID_PREFIXES.JOURNALENTRYLINE),
              accountId: line.accountId,
              description: line.description,
              debitAmount: new Prisma.Decimal(line.debitAmount),
              creditAmount: new Prisma.Decimal(line.creditAmount),
            })),
          },
        },
        include: { lines: true },
      });
    });
  }

  // =================================================================== //
  //                    GÉNÉRATION AUTOMATIQUE (point d'entrée unique)   //
  // =================================================================== //

  /**
   * Point d'entrée UNIQUE pour toute écriture générée automatiquement depuis
   * un domaine métier (ventes, achats, trésorerie, paie...). Aucun autre code
   * du projet ne doit appeler `prisma.journalEntry.create` directement — voir
   * Doc/module-comptabilite-plan-implementation.md §2.2/§2.7.
   *
   * - Anti-doublon : si une écriture avec la même `reference` existe déjà
   *   dans ce journal/cette filiale, elle est retournée telle quelle (aucun
   *   doublon créé), pour supporter les retries sans risque.
   * - Résolution batch des comptes (1 requête, pas 1 par ligne).
   * - Créée directement en statut POSTED (jamais DRAFT) : une écriture
   *   automatique reflète un fait déjà survenu (paiement, vente livrée...),
   *   il n'y a rien à "brouillonner".
   */
  async createAutomaticEntry(dto: CreateAutomaticEntryDto) {
    const journal = await this.prisma.accountingJournal.findUnique({
      where: { code: dto.journalCode },
    });
    if (!journal)
      throw new NotFoundException(`Journal "${dto.journalCode}" introuvable.`);

    const existing = await this.prisma.journalEntry.findFirst({
      where: {
        entryNumber: dto.reference,
        journalId: journal.id,
        subsidiaryId: dto.subsidiaryId,
      },
    });
    if (existing) return existing;

    const accountNumbers = [...new Set(dto.lines.map((l) => l.accountNumber))];
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { accountNumber: { in: accountNumbers } },
    });
    const accountByNumber = new Map(accounts.map((a) => [a.accountNumber, a]));

    const lines = dto.lines.map((line) => {
      const account = accountByNumber.get(line.accountNumber);
      if (!account)
        throw new BadRequestException(
          `Compte "${line.accountNumber}" introuvable dans le plan comptable.`,
        );
      if (!account.isActive)
        throw new BadRequestException(
          `Le compte "${line.accountNumber}" est désactivé.`,
        );
      return {
        accountId: account.id,
        description: line.description ?? dto.description,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
      };
    });

    this.validateBalance(lines);

    const fiscalYearId = await this.resolveFiscalYearId(
      dto.subsidiaryId,
      dto.date,
    );

    return this.prisma.$transaction(async (tx) => {
      const sequentialNumber = await this.assignSequentialNumber(
        tx,
        journal.id,
        dto.subsidiaryId,
        dto.date,
      );

      return tx.journalEntry.create({
        data: {
          id: generateId(ID_PREFIXES.JOURNALENTRY),
          entryNumber: dto.reference,
          entryDate: dto.date,
          description: dto.description,
          status: JournalEntryStatus.POSTED,
          journalId: journal.id,
          ...(fiscalYearId ? { fiscalYearId } : {}),
          subsidiaryId: dto.subsidiaryId,
          // Pas de createdBy : une écriture automatique n'a pas d'auteur humain.
          sourceType: dto.sourceType,
          sourceId: dto.sourceId,
          sequentialNumber,
          lines: {
            create: lines.map((line) => ({
              id: generateId(ID_PREFIXES.JOURNALENTRYLINE),
              accountId: line.accountId,
              description: line.description,
              debitAmount: new Prisma.Decimal(line.debitAmount),
              creditAmount: new Prisma.Decimal(line.creditAmount),
            })),
          },
        },
        include: { lines: true },
      });
    });
  }

  // =================================================================== //
  //                          INTERNES                                   //
  // =================================================================== //

  private validateBalance(
    lines: Array<{
      debitAmount: number | Prisma.Decimal;
      creditAmount: number | Prisma.Decimal;
    }>,
  ) {
    const totalDebit = lines.reduce((s, l) => s + Number(l.debitAmount), 0);
    const totalCredit = lines.reduce((s, l) => s + Number(l.creditAmount), 0);

    if (Math.abs(totalDebit - totalCredit) > BALANCE_TOLERANCE) {
      throw new BadRequestException(
        `L'écriture n'est pas équilibrée (Débit: ${totalDebit}, Crédit: ${totalCredit}).`,
      );
    }
  }

  /**
   * Résout l'exercice fiscal couvrant `date` pour cette filiale, et rejette
   * si celui-ci existe et est clôturé. Retourne `undefined` si aucun exercice
   * ne couvre cette date (pas bloquant : cohérent avec `create()` où
   * `fiscalYearId` reste optionnel).
   */
  private async resolveFiscalYearId(
    subsidiaryId: string,
    date: Date,
    explicitFiscalYearId?: string,
  ): Promise<string | undefined> {
    if (explicitFiscalYearId) {
      const fy = await this.prisma.fiscalYear.findFirst({
        where: { id: explicitFiscalYearId, subsidiaryId },
      });
      if (!fy) throw new NotFoundException('Exercice fiscal introuvable.');
      if (fy.isClosed)
        throw new BadRequestException('Cet exercice fiscal est clôturé.');
      return fy.id;
    }

    const period = await this.prisma.fiscalYear.findFirst({
      where: { subsidiaryId, startDate: { lte: date }, endDate: { gte: date } },
    });
    if (!period) return undefined;
    if (period.isClosed) {
      throw new BadRequestException(
        `Impossible de créer une écriture : l'exercice du ${period.startDate.toLocaleDateString('fr-FR')} au ${period.endDate.toLocaleDateString('fr-FR')} est clôturé.`,
      );
    }
    return period.id;
  }

  /**
   * Attribue le numéro de pièce légal, séquentiel et continu par journal /
   * filiale / exercice (obligation OHADA, AUDCIF art. 19-21). L'incrémentation
   * (`upsert` avec `increment`) est une seule opération UPDATE atomique côté
   * Postgres : deux validations concurrentes sur le même journal/filiale/
   * exercice ne peuvent jamais obtenir le même numéro.
   */
  private async assignSequentialNumber(
    tx: Prisma.TransactionClient,
    journalId: string,
    subsidiaryId: string,
    date: Date,
  ): Promise<string> {
    const journal = await tx.accountingJournal.findUniqueOrThrow({
      where: { id: journalId },
    });
    const year = date.getFullYear();

    const sequence = await tx.accountingJournalSequence.upsert({
      where: { journalId_subsidiaryId_year: { journalId, subsidiaryId, year } },
      create: {
        id: generateId(ID_PREFIXES.ACCOUNTINGJOURNALSEQUENCE),
        journalId,
        subsidiaryId,
        year,
        lastNumber: 1,
      },
      update: { lastNumber: { increment: 1 } },
    });

    return `${journal.code}-${year}-${String(sequence.lastNumber).padStart(6, '0')}`;
  }
}
