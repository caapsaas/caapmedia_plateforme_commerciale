import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { JournalEntryStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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
  ) {
    const where: any = {
      journalEntry: {
        subsidiaryId: user.subsidiaryId,
        fiscalYearId,
        status: JournalEntryStatus.POSTED,
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
    });

    // Regrouper par compte et calculer les soldes cumulatifs
    const grouped = new Map<
      string,
      {
        account: any;
        mouvements: any[];
        totalDebit: number;
        totalCredit: number;
        solde: number;
      }
    >();

    for (const line of lines) {
      const num = line.account.accountNumber;
      if (!grouped.has(num)) {
        grouped.set(num, {
          account: line.account,
          mouvements: [],
          totalDebit: 0,
          totalCredit: 0,
          solde: 0,
        });
      }
      const entry = grouped.get(num)!;
      const debit = Number(line.debitAmount);
      const credit = Number(line.creditAmount);
      entry.totalDebit += debit;
      entry.totalCredit += credit;
      entry.solde += debit - credit;
      entry.mouvements.push({
        date: line.journalEntry.entryDate,
        pièce: line.journalEntry.entryNumber,
        journal: line.journalEntry.journal?.code,
        libellé: line.journalEntry.description,
        débit: debit,
        crédit: credit,
        solde: entry.solde,
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
  async getBalanceGenerale(user: JwtUser, fiscalYearId: string) {
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          subsidiaryId: user.subsidiaryId,
          fiscalYearId,
          status: JournalEntryStatus.POSTED,
        },
      },
      include: {
        account: {
          select: { accountNumber: true, accountName: true, accountType: true },
        },
      },
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
      const row = map.get(num)!;
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
  ) {
    const entries = await this.prisma.journalEntry.findMany({
      where: {
        subsidiaryId: user.subsidiaryId,
        fiscalYearId,
        status: JournalEntryStatus.POSTED,
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
    });

    // Grouper par journal
    const grouped = new Map<
      string,
      {
        journal: any;
        écritures: any[];
        totalDebit: number;
        totalCredit: number;
      }
    >();

    for (const entry of entries) {
      const code = entry.journal?.code ?? 'JOD';
      if (!grouped.has(code)) {
        grouped.set(code, {
          journal: entry.journal,
          écritures: [],
          totalDebit: 0,
          totalCredit: 0,
        });
      }
      const g = grouped.get(code)!;
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
      g.écritures.push({
        numéro: entry.entryNumber,
        date: entry.entryDate,
        libellé: entry.description,
        totalDebit: totDebit,
        totalCredit: totCredit,
        lignes: entry.lines.map((l) => ({
          compte: l.account.accountNumber,
          libellé: l.account.accountName,
          débit: Number(l.debitAmount),
          crédit: Number(l.creditAmount),
        })),
      });
    }

    return Array.from(grouped.values());
  }

  // ================================================================= //
  //               BILAN + COMPTE DE RÉSULTAT SYSCOHADA               //
  // ================================================================= //
  /**
   * États financiers de synthèse conformes SYSCOHADA révisé.
   * Utilise les soldes des comptes postés sur l'exercice.
   */
  async getSyscohadaStatements(user: JwtUser, fiscalYearId: string) {
    const { balance } = await this.getBalanceGenerale(user, fiscalYearId);

    const getBalance = (prefix: string | string[]) => {
      const prefixes = Array.isArray(prefix) ? prefix : [prefix];
      return balance
        .filter((r) => prefixes.some((p) => r.accountNumber.startsWith(p)))
        .reduce((s, r) => s + r.soldeDebiteur - r.soldeCrediteur, 0);
    };

    // ── BILAN ACTIF ──────────────────────────────────────────────────
    const bilan = {
      actif: {
        immobilisationsNettes:
          getBalance(['21', '22']) - Math.abs(getBalance(['28'])),
        stocks: getBalance(['31', '32']),
        creancesClients: getBalance('411'),
        tvaDeductible: getBalance(['4451', '4452']),
        tresorerie: getBalance(['521', '571']),
      },
      passif: {
        capitalSocial: Math.abs(getBalance('101')),
        reserves: Math.abs(getBalance('111')),
        resultatExercice: 0, // calculé depuis le P&L
        dettesLongTerme: Math.abs(getBalance('162')),
        dettesFournisseurs: Math.abs(getBalance('401')),
        tvaCollectee: Math.abs(getBalance('4431')),
        autresDettes: Math.abs(getBalance(['421', '431', '447'])),
      },
    };
    bilan.actif['totalActif'] = Object.values(bilan.actif).reduce(
      (s, v: any) => s + (typeof v === 'number' ? v : 0),
      0,
    );

    // ── COMPTE DE RÉSULTAT ───────────────────────────────────────────
    const comptResultat = {
      produits: {
        ventesMarchandises: Math.abs(getBalance('701')),
        prestationsServices: Math.abs(getBalance('706')),
        autresProduits: Math.abs(getBalance(['707', '74', '75', '77', '78'])),
      },
      charges: {
        achatsMarchandises: getBalance(['601', '602']),
        chargesExternes: getBalance(['61', '62']),
        chargesPersonnel: getBalance(['641', '644', '645', '646']),
        dotationsAmort: getBalance('681'),
        chargesFinancieres: getBalance('661'),
        autresCharges: getBalance(['63', '65', '67', '68']),
        is: getBalance('691'),
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
