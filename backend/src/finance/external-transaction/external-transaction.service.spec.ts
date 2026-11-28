import {
  AccountType,
  ExternalTransactionCategory,
  ExternalTransactionStatus,
  ExternalTransactionType,
  PaymentMethod,
  Prisma,
  TransactionStatus,
  UserRole,
} from '@prisma/client';
import type { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import type { PrismaService } from '../../common/utils/prisma/prisma.service';
import type { NotificationsService } from '../../notifications/notifications.service';
import { ExternalTransactionService } from './external-transaction.service';

describe('ExternalTransactionService (Treasury & Outbox wiring)', () => {
  it('updates SAFE balance and enqueues EXTERNAL_TRANSACTION on validation when impactsTreasury=true', async () => {
    const enqueue = jest.fn();
    const tx = {
      treasuryAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'safe-1',
          accountName: 'Coffre Central',
          accountType: AccountType.SAFE,
          balance: new Prisma.Decimal(500),
          subsidiaryId: 'branch',
        }),
        update: jest.fn().mockResolvedValue({
          balance: new Prisma.Decimal(400),
        }),
      },
      subsidiary: {
        findUnique: jest.fn().mockResolvedValue({
          safeMakerCheckerThreshold: new Prisma.Decimal(0),
        }),
      },
      financialTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'fin-ext-1' }),
      },
      externalFinancialTransaction: {
        update: jest.fn().mockResolvedValue({
          id: 'ext-1',
          subsidiaryId: 'branch',
          amount: new Prisma.Decimal(100),
          description: 'Investissement matériel',
          externalTransactionType: ExternalTransactionType.INVESTMENT,
          impactsTreasury: true,
          financialTransactionId: 'fin-ext-1',
          createdBy: 'maker-1',
          creator: { id: 'maker-1', userName: 'Admin', email: 'a@b.c' },
        }),
      },
    };
    const prisma = {
      externalFinancialTransaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ext-1',
          subsidiaryId: 'branch',
          amount: new Prisma.Decimal(100),
          description: 'Investissement matériel',
          externalTransactionType: ExternalTransactionType.INVESTMENT,
          externalTransactionCategory: ExternalTransactionCategory.EQUIPMENT,
          paymentMethod: PaymentMethod.CASH,
          status: ExternalTransactionStatus.DRAFT,
          impactsTreasury: true,
          treasuryAccountId: 'safe-1',
          transactionDate: new Date('2026-11-28'),
          createdBy: 'maker-1',
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'daf-1',
          userName: 'DAF',
          email: 'daf@b.c',
          userRole: UserRole.FINANCIAL_DIRECTOR,
        }),
      },
      $transaction: (cb: (c: typeof tx) => unknown) => cb(tx),
    } as unknown as PrismaService;
    const notifications = {
      notifyUsersByRole: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationsService;

    const service = new ExternalTransactionService(prisma, notifications, {
      enqueue,
    } as unknown as AccountingOutboxService);

    const validated = await service.validate('ext-1', 'branch', 'daf-1');
    expect(validated.financialTransactionId).toBe('fin-ext-1');
    expect(enqueue).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        eventType: 'EXTERNAL_TRANSACTION',
        payload: expect.objectContaining({ direction: 'OUTFLOW' }),
      }),
    );

    // Same-user validation on BANK triggers EN_ATTENTE financial transaction for 2nd approver
    (
      prisma.externalFinancialTransaction.findUnique as jest.Mock
    ).mockResolvedValueOnce({
      id: 'ext-2',
      subsidiaryId: 'branch',
      amount: new Prisma.Decimal(100),
      description: 'Virement externe banque',
      externalTransactionType: ExternalTransactionType.LOAN,
      externalTransactionCategory: ExternalTransactionCategory.OTHER,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: ExternalTransactionStatus.DRAFT,
      impactsTreasury: true,
      treasuryAccountId: 'bank-1',
      transactionDate: new Date('2026-11-28'),
      createdBy: 'daf-1',
    });
    tx.treasuryAccount.findFirst.mockResolvedValueOnce({
      id: 'bank-1',
      accountName: 'Banque',
      accountType: AccountType.BANQUE,
      balance: new Prisma.Decimal(1000),
      subsidiaryId: 'branch',
    });
    await service.validate('ext-2', 'branch', 'daf-1');
    expect(tx.financialTransaction.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TransactionStatus.EN_ATTENTE }),
      }),
    );
  });
});
