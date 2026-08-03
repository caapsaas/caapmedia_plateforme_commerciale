import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { JournalEntryStatus } from '@prisma/client';
import {
  resolveScopeContext,
  resolveEffectiveSubsidiaryId,
  assertSubsidiaryAccess,
  SubsidiaryScopeContext,
} from 'src/common/utils/subsidiary-scope';
import { AccountingBalanceService } from '../shared/accounting-balance.service';
import { ACCOUNTING_GLOBAL_SCOPE_ROLES } from '../shared/accounting-scope-roles.const';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly balanceService: AccountingBalanceService,
  ) {}

  /**
   * Résout l'exercice fiscal demandé et vérifie l'accès (un utilisateur sans
   * portée globale ne peut consulter que les exercices de sa propre filiale).
   * Sert uniquement de référence de PÉRIODE (`startDate`/`endDate`) — le
   * périmètre filiale réel de la requête est décidé séparément par
   * `resolveEffectiveSubsidiaryId`, pour permettre une vue consolidée sur
   * cette même période à travers toutes les filiales.
   */
  private async resolveFiscalYearPeriod(
    fiscalYearId: string,
    ctx: SubsidiaryScopeContext,
  ) {
    const fiscalYear = await this.prisma.fiscalYear.findUnique({
      where: { id: fiscalYearId },
    });
    if (!fiscalYear)
      throw new NotFoundException(
        `Exercice fiscal "${fiscalYearId}" introuvable.`,
      );
    assertSubsidiaryAccess(fiscalYear.subsidiaryId, ctx);
    return fiscalYear;
  }

  /**
   * Réduit la période du rapport à une sous-plage (`startDate`/`endDate`) au
   * sein de l'exercice fiscal — permet de sortir un grand livre/une balance/un
   * journal centralisateur sur un trimestre par exemple. Les bornes fournies
   * sont toujours contraintes à l'intérieur de l'exercice (jamais au-delà).
   */
  private resolveDateRange(
    fiscalYear: { startDate: Date; endDate: Date },
    startDate?: string,
    endDate?: string,
  ): { startDate: Date; endDate: Date } {
    const requestedStart = startDate ? new Date(startDate) : fiscalYear.startDate;
    const requestedEnd = endDate ? new Date(endDate) : fiscalYear.endDate;
    return {
      startDate:
        requestedStart < fiscalYear.startDate
          ? fiscalYear.startDate
          : requestedStart,
      endDate: requestedEnd > fiscalYear.endDate ? fiscalYear.endDate : requestedEnd,
    };
  }

  // ================================================================= //
  //                      GRAND LIVRE DES COMPTES                      //
  // ================================================================= //
  /**
   * Liste tous les mouvements d'un compte avec solde cumulatif.
   * Filtre optionnel par période et par journal.
   */
  async getGrandLivre(
    user: JwtUser,
    fiscalYearId: string,
    accountNumber?: string,
    journalCode?: string,
    subsidiaryIdFilter?: string,
    startDateFilter?: string,
    endDateFilter?: string,
  ) {
    const ctx = resolveScopeContext(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
    const fiscalYear = await this.resolveFiscalYearPeriod(fiscalYearId, ctx);
    const { startDate, endDate } = this.resolveDateRange(
      fiscalYear,
      startDateFilter,
      endDateFilter,
    );
    const effectiveSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      subsidiaryIdFilter,
    );

    const where: any = {
      journalEntry: {
        status: JournalEntryStatus.POSTED,
        entryDate: { gte: startDate, lte: endDate },
        ...(effectiveSubsidiaryId
          ? { subsidiaryId: effectiveSubsidiaryId }
          : {}),
        ...(journalCode ? { journal: { code: journalCode } } : {}),
      },
      ...(accountNumber ? { account: { accountNumber } } : {}),
    };

    const lines = await this.prisma.journalEntryLine.findMany({
      where,
      include: {
        account: {
          select: { accountNumber: true, accountName: true, accountType: true },
        },
        journalEntry: {
          select: {
            entryNumber: true,
            entryDate: true,
            description: true,
            journal: { select: { code: true } },
          },
        },
      },
      orderBy: [
        { account: { accountNumber: 'asc' } },
        { journalEntry: { entryDate: 'asc' } },
      ],
      // Filet de sécurité : le solde cumulatif par compte doit rester calculé
      // sur l'intégralité de la période (pas de pagination cliquable possible
      // sans casser le running balance) — ce plafond protège seulement contre
      // un scan pathologique (ex: filtre de dates trop large sur des années
      // de données), pas un usage normal borné à un exercice fiscal.
      take: 20000,
    });

    // Regrouper par compte et calculer les soldes cumulatifs
    const grouped = new Map<
      string,
      {
        account: any;
        movements: any[];
        totalDebit: number;
        totalCredit: number;
        balance: number;
      }
    >();

    for (const line of lines) {
      const num = line.account.accountNumber;
      if (!grouped.has(num)) {
        grouped.set(num, {
          account: line.account,
          movements: [],
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
        });
      }
      const entry = grouped.get(num);
      const debit = Number(line.debitAmount);
      const credit = Number(line.creditAmount);
      entry.totalDebit += debit;
      entry.totalCredit += credit;
      entry.balance += debit - credit;
      entry.movements.push({
        date: line.journalEntry.entryDate,
        entryNumber: line.journalEntry.entryNumber,
        journalCode: line.journalEntry.journal?.code,
        description: line.journalEntry.description,
        debit,
        credit,
        runningBalance: entry.balance,
      });
    }

    return Array.from(grouped.values());
  }

  // ================================================================= //
  //                      BALANCE GÉNÉRALE                             //
  // ================================================================= //
  /**
   * Tableau synthétique : solde débiteur/créditeur de chaque compte.
   * Conforme SYSCOHADA : balance à 4 colonnes (mouv. débit, mouv. crédit, solde D, solde C).
   */
  async getBalanceGenerale(
    user: JwtUser,
    fiscalYearId: string,
    subsidiaryIdFilter?: string,
    startDateFilter?: string,
    endDateFilter?: string,
  ) {
    const ctx = resolveScopeContext(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
    const fiscalYear = await this.resolveFiscalYearPeriod(fiscalYearId, ctx);
    const { startDate, endDate } = this.resolveDateRange(
      fiscalYear,
      startDateFilter,
      endDateFilter,
    );
    const effectiveSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      subsidiaryIdFilter,
    );

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          status: JournalEntryStatus.POSTED,
          entryDate: { gte: startDate, lte: endDate },
          ...(effectiveSubsidiaryId
            ? { subsidiaryId: effectiveSubsidiaryId }
            : {}),
        },
      },
      include: {
        account: {
          select: { accountNumber: true, accountName: true, accountType: true },
        },
      },
      // Filet de sécurité : voir getGrandLivre — les totaux par compte doivent
      // rester agrégés sur l'intégralité de la période.
      take: 20000,
    });

    const map = new Map<
      string,
      {
        accountNumber: string;
        accountName: string;
        accountType: string;
        mouvDebit: number;
        mouvCredit: number;
      }
    >();

    for (const line of lines) {
      const num = line.account.accountNumber;
      if (!map.has(num)) {
        map.set(num, {
          accountNumber: num,
          accountName: line.account.accountName,
          accountType: line.account.accountType,
          mouvDebit: 0,
          mouvCredit: 0,
        });
      }
      const row = map.get(num);
      row.mouvDebit += Number(line.debitAmount);
      row.mouvCredit += Number(line.creditAmount);
    }

    const balance = Array.from(map.values())
      .sort((a, b) => a.accountNumber.localeCompare(b.accountNumber))
      .map((row) => {
        const net = row.mouvDebit - row.mouvCredit;
        return {
          ...row,
          soldeDebiteur: net > 0 ? net : 0,
          soldeCrediteur: net < 0 ? Math.abs(net) : 0,
        };
      });

    const totaux = balance.reduce(
      (t, r) => ({
        totalMouvDebit: t.totalMouvDebit + r.mouvDebit,
        totalMouvCredit: t.totalMouvCredit + r.mouvCredit,
        totalSoldeDebiteur: t.totalSoldeDebiteur + r.soldeDebiteur,
        totalSoldeCrediteur: t.totalSoldeCrediteur + r.soldeCrediteur,
      }),
      {
        totalMouvDebit: 0,
        totalMouvCredit: 0,
        totalSoldeDebiteur: 0,
        totalSoldeCrediteur: 0,
      },
    );

    return { balance, totaux };
  }

  // ================================================================= //
  //                    JOURNAL CENTRALISATEUR                         //
  // ================================================================= //
  /**
   * Récapitulatif des écritures par journal sur la période.
   */
  async getJournalCentralisateur(
    user: JwtUser,
    fiscalYearId: string,
    journalCode?: string,
    subsidiaryIdFilter?: string,
    startDateFilter?: string,
    endDateFilter?: string,
  ) {
    const ctx = resolveScopeContext(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
    const fiscalYear = await this.resolveFiscalYearPeriod(fiscalYearId, ctx);
    const { startDate, endDate } = this.resolveDateRange(
      fiscalYear,
      startDateFilter,
      endDateFilter,
    );
    const effectiveSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      subsidiaryIdFilter,
    );

    const entries = await this.prisma.journalEntry.findMany({
      where: {
        status: JournalEntryStatus.POSTED,
        entryDate: { gte: startDate, lte: endDate },
        ...(effectiveSubsidiaryId
          ? { subsidiaryId: effectiveSubsidiaryId }
          : {}),
        ...(journalCode ? { journal: { code: journalCode } } : {}),
      },
      include: {
        journal: { select: { code: true, name: true } },
        lines: {
          include: {
            account: { select: { accountNumber: true, accountName: true } },
          },
        },
      },
      orderBy: [{ journal: { code: 'asc' } }, { entryDate: 'asc' }],
      // Filet de sécurité : voir getGrandLivre — le récapitulatif par journal
      // doit rester agrégé sur l'intégralité de la période.
      take: 20000,
    });

    // Grouper par journal
    const grouped = new Map<
      string,
      {
        journal: any;
        entries: any[];
        totalDebit: number;
        totalCredit: number;
      }
    >();

    for (const entry of entries) {
      const code = entry.journal?.code ?? 'JOD';
      if (!grouped.has(code)) {
        grouped.set(code, {
          journal: entry.journal,
          entries: [],
          totalDebit: 0,
          totalCredit: 0,
        });
      }
      const g = grouped.get(code);
      const totDebit = entry.lines.reduce(
        (s, l) => s + Number(l.debitAmount),
        0,
      );
      const totCredit = entry.lines.reduce(
        (s, l) => s + Number(l.creditAmount),
        0,
      );
      g.totalDebit += totDebit;
      g.totalCredit += totCredit;
      g.entries.push({
        entryNumber: entry.entryNumber,
        date: entry.entryDate,
        description: entry.description,
        totalDebit: totDebit,
        totalCredit: totCredit,
        lines: entry.lines.map((l) => ({
          accountNumber: l.account.accountNumber,
          accountName: l.account.accountName,
          debit: Number(l.debitAmount),
          credit: Number(l.creditAmount),
        })),
      });
    }

    return Array.from(grouped.values());
  }

  // ================================================================= //
  //               BILAN + COMPTE DE RÉSULTAT SYSCOHADA               //
  // ================================================================= //
  /**
   * États financiers de synthèse conformes SYSCOHADA révisé. Version simplifiée
   * (calculée directement par préfixe de compte, pas encore template-driven —
   * voir Phase 6 du plan pour la version BalanceSheetTemplate/Value).
   */
  async getSyscohadaStatements(
    user: JwtUser,
    fiscalYearId: string,
    subsidiaryIdFilter?: string,
  ) {
    const ctx = resolveScopeContext(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
    const fiscalYear = await this.resolveFiscalYearPeriod(fiscalYearId, ctx);
    const effectiveSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      subsidiaryIdFilter,
    );
    const { startDate, endDate } = fiscalYear;

    const bal = (prefix: string | string[]) =>
      this.balanceService.getAccountBalanceByPrefix(
        prefix,
        startDate,
        endDate,
        effectiveSubsidiaryId,
      );

    // ── BILAN ACTIF / PASSIF ─────────────────────────────────────────
    const [
      immobilisationsBrutes,
      amortissements,
      stocks,
      creancesClients,
      tvaDeductible,
      tresorerie,
      capitalSocial,
      reserves,
      dettesLongTerme,
      dettesFournisseurs,
      tvaCollectee,
      autresDettes,
    ] = await Promise.all([
      bal(['21', '22']),
      bal('28'),
      bal(['31', '32']),
      bal('411'),
      bal(['4451', '4452']),
      bal(['521', '571']),
      bal('101'),
      bal('111'),
      bal('162'),
      bal('401'),
      bal('4431'),
      bal(['421', '431', '447']),
    ]);

    const bilan = {
      actif: {
        immobilisationsNettes: immobilisationsBrutes - Math.abs(amortissements),
        stocks,
        creancesClients,
        tvaDeductible,
        tresorerie,
      },
      passif: {
        capitalSocial: Math.abs(capitalSocial),
        reserves: Math.abs(reserves),
        resultatExercice: 0, // calculé depuis le P&L ci-dessous
        dettesLongTerme: Math.abs(dettesLongTerme),
        dettesFournisseurs: Math.abs(dettesFournisseurs),
        tvaCollectee: Math.abs(tvaCollectee),
        autresDettes: Math.abs(autresDettes),
      },
    };
    bilan.actif['totalActif'] = Object.values(bilan.actif).reduce(
      (s, v: any) => s + (typeof v === 'number' ? v : 0),
      0,
    );

    // ── COMPTE DE RÉSULTAT ───────────────────────────────────────────
    const [
      ventesMarchandises,
      prestationsServices,
      autresProduits,
      achatsMarchandises,
      chargesExternes,
      chargesPersonnel,
      dotationsAmort,
      chargesFinancieres,
      autresCharges,
      is,
    ] = await Promise.all([
      bal('701'),
      bal('706'),
      bal(['707', '74', '75', '77', '78']),
      bal(['601', '602']),
      bal(['61', '62']),
      bal(['641', '644', '645', '646']),
      bal('681'),
      bal('661'),
      bal(['63', '65', '67', '68']),
      bal('691'),
    ]);

    const comptResultat = {
      produits: {
        ventesMarchandises: Math.abs(ventesMarchandises),
        prestationsServices: Math.abs(prestationsServices),
        autresProduits: Math.abs(autresProduits),
      },
      charges: {
        achatsMarchandises,
        chargesExternes,
        chargesPersonnel,
        dotationsAmort,
        chargesFinancieres,
        autresCharges,
        is,
      },
    };

    const totalProduits = Object.values(comptResultat.produits).reduce(
      (s, v) => s + v,
      0,
    );
    const totalCharges = Object.values(comptResultat.charges).reduce(
      (s, v) => s + v,
      0,
    );
    const resultatNet = totalProduits - totalCharges;

    bilan.passif.resultatExercice = resultatNet;
    bilan.passif['totalPassif'] = Object.values(bilan.passif).reduce(
      (s, v: any) => s + (typeof v === 'number' ? v : 0),
      0,
    );

    return {
      bilan,
      comptResultat: {
        ...comptResultat,
        totalProduits,
        totalCharges,
        resultatNet,
        margeCommerciale:
          comptResultat.produits.ventesMarchandises -
          comptResultat.charges.achatsMarchandises,
        ebe:
          totalProduits -
          comptResultat.charges.achatsMarchandises -
          comptResultat.charges.chargesExternes -
          comptResultat.charges.chargesPersonnel,
      },
    };
  }
}
