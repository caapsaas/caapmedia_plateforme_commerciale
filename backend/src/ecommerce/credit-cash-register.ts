import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  AccountType,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';

export async function creditCashRegister(
  tx: Prisma.TransactionClient,
  user: { id: string; subsidiaryId?: string },
  cashRegisterId: string,
  orderId: string,
  amount: Prisma.Decimal,
) {
  if (!user.id || !user.subsidiaryId) {
    throw new ForbiddenException(
      'Caissier et filiale requis pour encaisser en espèces.',
    );
  }

  const account = await tx.treasuryAccount.updateMany({
    where: {
      id: cashRegisterId,
      subsidiaryId: user.subsidiaryId,
      cashierId: user.id,
      accountType: AccountType.CASH_REGISTER,
    },
    data: { balance: { increment: amount } },
  });
  if (!account.count) {
    throw new NotFoundException(
      'Caisse introuvable parmi les caisses qui vous sont affectées.',
    );
  }

  const { balance } = await tx.treasuryAccount.findUniqueOrThrow({
    where: { id: cashRegisterId },
    select: { balance: true },
  });
  await tx.financialTransaction.create({
    data: {
      description: `Encaissement en espèces - Commande ${orderId}`,
      relatedDocumentId: orderId,
      amount,
      transactionDate: new Date(),
      subsidiaryId: user.subsidiaryId,
      treasuryAccountId: cashRegisterId,
      financialTransactionType: TransactionType.RECETTE,
      status: TransactionStatus.VALIDE,
      balanceAfterSource: balance,
    },
  });
}
