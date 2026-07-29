import { api } from '../api';

// ===================== GRAND LIVRE =====================

export interface GrandLivreMovement {
  date: string;
  entryNumber: string;
  journalCode?: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface GrandLivreAccount {
  account: { accountNumber: string; accountName: string; accountType: string };
  movements: GrandLivreMovement[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export const getGrandLivre = async (
  fiscalYearId: string,
  accountNumber?: string,
  journalCode?: string,
  subsidiaryId?: string,
  startDate?: string,
  endDate?: string,
): Promise<GrandLivreAccount[]> => {
  const params: Record<string, string> = {};
  if (accountNumber) params.accountNumber = accountNumber;
  if (journalCode) params.journalCode = journalCode;
  if (subsidiaryId) params.subsidiaryId = subsidiaryId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await api.get<GrandLivreAccount[]>(
    `/accounting/reports/grand-livre/${fiscalYearId}`,
    { params },
  );
  return data;
};

// ===================== BALANCE GÉNÉRALE =====================

export interface BalanceGeneraleLine {
  accountNumber: string;
  accountName: string;
  accountType: string;
  mouvDebit: number;
  mouvCredit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

export interface BalanceGeneraleResponse {
  balance: BalanceGeneraleLine[];
  totaux: {
    totalMouvDebit: number;
    totalMouvCredit: number;
    totalSoldeDebiteur: number;
    totalSoldeCrediteur: number;
  };
}

export const getBalanceGenerale = async (
  fiscalYearId: string,
  subsidiaryId?: string,
  startDate?: string,
  endDate?: string,
): Promise<BalanceGeneraleResponse> => {
  const params: Record<string, string> = {};
  if (subsidiaryId) params.subsidiaryId = subsidiaryId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await api.get<BalanceGeneraleResponse>(
    `/accounting/reports/balance/${fiscalYearId}`,
    { params },
  );
  return data;
};

// ===================== JOURNAL CENTRALISATEUR =====================

export interface JournalCentralisateurLine {
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalCentralisateurEntry {
  entryNumber: string;
  date: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  lines: JournalCentralisateurLine[];
}

export interface JournalCentralisateurGroup {
  journal: { code: string; name: string } | null;
  entries: JournalCentralisateurEntry[];
  totalDebit: number;
  totalCredit: number;
}

export const getJournalCentralisateur = async (
  fiscalYearId: string,
  journalCode?: string,
  subsidiaryId?: string,
  startDate?: string,
  endDate?: string,
): Promise<JournalCentralisateurGroup[]> => {
  const params: Record<string, string> = {};
  if (journalCode) params.journalCode = journalCode;
  if (subsidiaryId) params.subsidiaryId = subsidiaryId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await api.get<JournalCentralisateurGroup[]>(
    `/accounting/reports/journal-centralisateur/${fiscalYearId}`,
    { params },
  );
  return data;
};

// ===================== ÉTATS SYSCOHADA (BILAN + CDR) =====================

export interface SyscohadaStatements {
  bilan: {
    actif: {
      immobilisationsNettes: number;
      stocks: number;
      creancesClients: number;
      tvaDeductible: number;
      tresorerie: number;
      totalActif: number;
    };
    passif: {
      capitalSocial: number;
      reserves: number;
      resultatExercice: number;
      dettesLongTerme: number;
      dettesFournisseurs: number;
      tvaCollectee: number;
      autresDettes: number;
      totalPassif: number;
    };
  };
  comptResultat: {
    produits: {
      ventesMarchandises: number;
      prestationsServices: number;
      autresProduits: number;
    };
    charges: {
      achatsMarchandises: number;
      chargesExternes: number;
      chargesPersonnel: number;
      dotationsAmort: number;
      chargesFinancieres: number;
      autresCharges: number;
      is: number;
    };
    totalProduits: number;
    totalCharges: number;
    resultatNet: number;
    margeCommerciale: number;
    ebe: number;
  };
}

export const getSyscohadaStatements = async (
  fiscalYearId: string,
  subsidiaryId?: string,
): Promise<SyscohadaStatements> => {
  const params = subsidiaryId ? { subsidiaryId } : {};
  const { data } = await api.get<SyscohadaStatements>(
    `/accounting/reports/states/${fiscalYearId}`,
    { params },
  );
  return data;
};
