import {
  Prisma,
  TransactionStatus,
  TransactionType,
  TreasuryTransactionType,
  AccountType,
} from '@prisma/client';

export function withOpeningBalance(
  account: Omit<
    Prisma.TreasuryAccountUncheckedCreateInput,
    'balance' | 'initialBalance' | 'financialTransactions'
  > & { id: string },
  initialBalance: number,
  createdByUserId: string,
): Prisma.TreasuryAccountUncheckedCreateInput {
  const amount = new Prisma.Decimal(initialBalance);
  const isBankAccount = account.accountType === AccountType.BANQUE;
  return {
    ...account,
    // Un encaissement bancaire doit passer par l'approbation indépendante.
    // Le montant demandé reste tracé mais n'intègre le solde qu'après validation.
    balance: isBankAccount ? new Prisma.Decimal(0) : amount,
    initialBalance: amount,
    financialTransactions: amount.gt(0)
      ? {
          create: {
            transactionDate: new Date(),
            description: 'Solde initial',
            amount,
            financialTransactionType: TransactionType.RECETTE,
            treasuryType: TreasuryTransactionType.INFLOW,
            status: isBankAccount
              ? TransactionStatus.EN_ATTENTE
              : TransactionStatus.VALIDE,
            balanceAfterSource: isBankAccount ? undefined : amount,
            createdByUserId: isBankAccount ? createdByUserId : undefined,
            subsidiaryId: account.subsidiaryId,
            reference: `INIT-${account.id}`,
          },
        }
      : undefined,
  };
}
