import { Injectable } from '@nestjs/common';
import { JournalEntryStatus } from '@prisma/client';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

export type BalanceSide = 'DEBIT' | 'CREDIT';

/**
 * Calcul de solde de compte(s) — service partagé pour éviter de dupliquer
 * cette logique dans chaque rapport (Balance, Grand Livre, Bilan/CdR à venir
 * en Phase 6). Ne considère que les écritures `POSTED` (une écriture DRAFT
 * n'a pas d'existence comptable).
 */
@Injectable()
export class AccountingBalanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Solde d'un ensemble de comptes (par numéro exact) sur `]startDate, endDate]`
   * — `startDate: null` = depuis l'origine. `subsidiaryId: undefined` = vue
   * consolidée (toutes filiales), à réserver aux appelants ayant déjà validé
   * le scope multi-filiale (`resolveEffectiveSubsidiaryId`).
   */
  async getAccountBalance(
    accountNumbers: string[],
    startDate: Date | null,
    endDate: Date,
    side: BalanceSide,
    subsidiaryId?: string,
  ): Promise<number> {
    if (accountNumbers.length === 0) return 0;

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        account: { accountNumber: { in: accountNumbers } },
        journalEntry: {
          status: JournalEntryStatus.POSTED,
          entryDate: {
            ...(startDate ? { gte: startDate } : {}),
            lte: endDate,
          },
          ...(subsidiaryId ? { subsidiaryId } : {}),
        },
      },
      select: { debitAmount: true, creditAmount: true },
    });

    const totalDebit = lines.reduce((s, l) => s + Number(l.debitAmount), 0);
    const totalCredit = lines.reduce((s, l) => s + Number(l.creditAmount), 0);

    return side === 'DEBIT'
      ? totalDebit - totalCredit
      : totalCredit - totalDebit;
  }

  /**
   * Solde de tous les comptes dont le numéro commence par l'un des préfixes
   * donnés (ex. '6' = toutes les charges). Le sens (débiteur/créditeur) est
   * déduit automatiquement de la classe SYSCOHADA des comptes résolus —
   * classe 7 (produits) : soldé en crédit-débit ; tout le reste (charges,
   * actif, passif, tiers, trésorerie) : débit-crédit.
   */
  async getAccountBalanceByPrefix(
    prefixes: string | string[],
    startDate: Date | null,
    endDate: Date,
    subsidiaryId?: string,
  ): Promise<number> {
    const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];

    const accounts = await this.prisma.accountingAccount.findMany({
      where: {
        OR: prefixList.map((p) => ({ accountNumber: { startsWith: p } })),
      },
      select: { accountNumber: true, class: true },
    });
    if (accounts.length === 0) return 0;

    const side: BalanceSide = accounts[0].class === 7 ? 'CREDIT' : 'DEBIT';
    return this.getAccountBalance(
      accounts.map((a) => a.accountNumber),
      startDate,
      endDate,
      side,
      subsidiaryId,
    );
  }
}
