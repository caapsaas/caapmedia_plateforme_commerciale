import { FinancialTransaction } from '../types';

/**
 * Affichage uniforme des transactions de trésorerie : chaque mouvement a un
 * émetteur et un destinataire — côté émetteur c'est un décaissement, côté
 * destinataire un encaissement (voir gmo AccountHistoryModal/BankStatementPrint).
 * Ces helpers déterminent, du point de vue d'UN compte précis, le sens du
 * mouvement, le nom de l'autre partie et le solde avant/après.
 *
 * Robuste face aux deux générations de transactions du backend :
 * - Décaissement typé / virement (treasury.service.ts::createDisbursement,
 *   cash-remittance.service.ts) : treasuryAccountId === sourceAccountId
 *   toujours, destinationAccountId renseigné seulement pour un virement.
 * - Recette/dépense simple, historique (createIncomeTransaction/
 *   createExpenseTransaction) : pas de sourceAccountId/destinationAccountId,
 *   seul financialTransactionType (RECETTE/DEPENSE) fait foi.
 */
export interface TransactionLegInfo {
  /** true = encaissement pour le compte considéré, false = décaissement. */
  isIncome: boolean;
  /** Nom de l'autre partie : compte interne (virement) ou tiers externe (fournisseur, administration fiscale...). */
  counterpartyName: string;
  /** Solde du compte après la transaction (null si transaction encore EN_ATTENTE). */
  balanceAfter: number | null;
  /** Solde du compte avant la transaction, dérivé de balanceAfter ± montant. */
  balanceBefore: number | null;
}

export function getTransactionLegForAccount(
  tx: FinancialTransaction,
  accountId: string,
): TransactionLegInfo {
  const isDestination = tx.destinationAccountId === accountId;
  const isIncome =
    isDestination ||
    (tx.treasuryAccountId === accountId && tx.financialTransactionType === 'RECETTE');

  const amount = Number(tx.amount);
  const balanceAfterRaw = isDestination ? tx.balanceAfterDest : tx.balanceAfterSource;
  const balanceAfter = balanceAfterRaw != null ? Number(balanceAfterRaw) : null;
  const balanceBefore =
    balanceAfter != null ? (isIncome ? balanceAfter - amount : balanceAfter + amount) : null;

  const counterpartyName = isIncome
    ? tx.treasuryAccount?.accountName ?? tx.counterparty?.name ?? '—'
    : tx.destinationAccount?.accountName ?? tx.counterparty?.name ?? '—';

  return { isIncome, counterpartyName, balanceAfter, balanceBefore };
}

/**
 * Pour une vue portant sur PLUSIEURS comptes (un type de compte, une
 * filiale...) : un même virement interne peut être à la fois le décaissement
 * d'un compte de l'ensemble ET l'encaissement d'un autre compte du même
 * ensemble — les deux legs sont donc évalués indépendamment, pas de façon
 * mutuellement exclusive.
 */
export function isIncomeLegForSet(tx: FinancialTransaction, accountIds: Set<string>): boolean {
  return (
    (!!tx.destinationAccountId && accountIds.has(tx.destinationAccountId)) ||
    (accountIds.has(tx.treasuryAccountId) && tx.financialTransactionType === 'RECETTE')
  );
}

export function isExpenseLegForSet(tx: FinancialTransaction, accountIds: Set<string>): boolean {
  return accountIds.has(tx.treasuryAccountId) && tx.financialTransactionType !== 'RECETTE';
}

/**
 * Résout l'id du compte (au sein de l'ensemble) concerné par une transaction,
 * en préférant le côté destinataire (encaissement) s'il est présent — pour un
 * affichage à une seule ligne par transaction (ex: liste de transactions
 * mêlant plusieurs comptes du même type).
 */
export function findAccountIdInSet(
  tx: FinancialTransaction,
  accountIds: Set<string>,
): string | undefined {
  if (tx.destinationAccountId && accountIds.has(tx.destinationAccountId)) {
    return tx.destinationAccountId;
  }
  if (accountIds.has(tx.treasuryAccountId)) {
    return tx.treasuryAccountId;
  }
  return undefined;
}
