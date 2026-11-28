import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AccountType,
  ExpenseStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
  UserRole,
} from '@prisma/client';
import type { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import type { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ExpensesService } from './expense.service';

describe('Expense payments from the safe', () => {
  const admin: JwtUser = {
    id: 'admin',
    role: UserRole.SUPER_ADMIN,
    activeRole: UserRole.SUPER_ADMIN,
    roles: [UserRole.SUPER_ADMIN],
    email: 'admin@example.com',
    subsidiaryId: 'head-office',
  };
  const amount = new Prisma.Decimal(120);
  const expense = {
    id: 'expense',
    amount,
    description: 'Loyer',
    subsidiaryId: 'branch',
    paymentTransactionId: null,
  };
  const safe = { id: 'safe', subsidiaryId: 'head-office', currency: 'XOF' };
  const dto = {
    safeId: safe.id,
    transactionDate: '2026-11-16',
    expectedAmount: 120,
  };
  const prisma = {
    expenseRecord: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    treasuryAccount: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    financialTransaction: {
      create: jest.fn<unknown, [Prisma.FinancialTransactionCreateArgs]>(),
    },
    accountingOutboxEntry: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const outbox = { enqueue: jest.fn() };
  const service = new ExpensesService(
    prisma as unknown as PrismaService,
    outbox as unknown as AccountingOutboxService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    );
    prisma.expenseRecord.findUnique.mockResolvedValue(expense);
    prisma.treasuryAccount.findFirst.mockResolvedValue(safe);
    prisma.treasuryAccount.updateMany.mockResolvedValue({ count: 1 });
    prisma.treasuryAccount.findUniqueOrThrow.mockResolvedValue({
      balance: new Prisma.Decimal(880),
    });
    prisma.financialTransaction.create.mockResolvedValue({
      id: 'payment',
      transactionDate: new Date(dto.transactionDate),
      description: 'Règlement du loyer',
    });
    prisma.expenseRecord.updateMany.mockResolvedValue({ count: 1 });
  });

  it('uses the charge amount and records a validated debit on the selected safe', async () => {
    await service.pay(expense.id, dto, admin);
    expect(prisma.treasuryAccount.findFirst).toHaveBeenCalledWith({
      where: { id: safe.id, accountType: AccountType.SAFE },
    });
    expect(prisma.treasuryAccount.updateMany).toHaveBeenCalledWith({
      where: {
        id: safe.id,
        subsidiaryId: safe.subsidiaryId,
        accountType: AccountType.SAFE,
        balance: { gte: amount },
      },
      data: { balance: { decrement: amount } },
    });
    expect(
      prisma.financialTransaction.create.mock.calls[0][0].data,
    ).toMatchObject({
      amount,
      subsidiaryId: safe.subsidiaryId,
      treasuryAccountId: safe.id,
      balanceAfterSource: new Prisma.Decimal(880),
      financialTransactionType: TransactionType.DEPENSE,
      status: TransactionStatus.VALIDE,
    });
    expect(prisma.expenseRecord.updateMany).toHaveBeenCalledWith({
      where: {
        id: expense.id,
        subsidiaryId: expense.subsidiaryId,
        paymentTransactionId: null,
        amount,
        description: expense.description,
      },
      data: { paymentTransactionId: 'payment', status: ExpenseStatus.PAID },
    });
    expect(outbox.enqueue).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        eventType: 'EXPENSE_RECORD_PAYMENT',
        subsidiaryId: expense.subsidiaryId,
      }),
    );
  });

  it('requires super-admin access to debit a safe', async () => {
    await expect(
      service.pay(expense.id, dto, {
        ...admin,
        role: UserRole.FINANCIAL_DIRECTOR,
        activeRole: UserRole.FINANCIAL_DIRECTOR,
        roles: [UserRole.FINANCIAL_DIRECTOR],
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuses already-paid charges before debiting the safe', async () => {
    prisma.expenseRecord.findUnique.mockResolvedValue({
      ...expense,
      paymentTransactionId: 'old-payment',
    });
    await expect(service.pay(expense.id, dto, admin)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.treasuryAccount.updateMany).not.toHaveBeenCalled();
  });

  it('does not record a payment if the safe has insufficient funds', async () => {
    prisma.treasuryAccount.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.pay(expense.id, dto, admin)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.financialTransaction.create).not.toHaveBeenCalled();
  });

  it('refuses a change in amount since the charge was selected', async () => {
    await expect(
      service.pay(expense.id, { ...dto, expectedAmount: 80 }, admin),
    ).rejects.toThrow(ConflictException);
    expect(prisma.treasuryAccount.updateMany).not.toHaveBeenCalled();
  });

  it('aborts the transaction if a competing edit or payment wins', async () => {
    prisma.expenseRecord.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.pay(expense.id, dto, admin)).rejects.toThrow(
      ConflictException,
    );
    expect(outbox.enqueue).not.toHaveBeenCalled();
  });

  it('enforces 3-step workflow and ExpenseBox unit limit', async () => {
    prisma.expenseRecord.findUnique.mockResolvedValue({
      ...expense,
      status: ExpenseStatus.DRAFT,
    });
    await expect(service.pay(expense.id, dto, admin)).rejects.toThrow(
      ConflictException,
    );

    prisma.expenseRecord.findUnique.mockResolvedValue({
      ...expense,
      status: ExpenseStatus.APPROVED,
    });
    prisma.treasuryAccount.findFirst.mockResolvedValue({
      id: 'box-1',
      subsidiaryId: 'branch',
      accountType: AccountType.EXPENSE_BOX,
      currency: 'XAF',
      balance: new Prisma.Decimal(500),
    });
    (prisma as any).subsidiary = {
      findUnique: jest.fn().mockResolvedValue({
        expenseBoxUnitLimit: new Prisma.Decimal(50),
        safeMakerCheckerThreshold: new Prisma.Decimal(0),
      }),
    };

    await expect(
      service.pay(
        expense.id,
        {
          accountId: 'box-1',
          transactionDate: '2026-11-16',
          expectedAmount: 120,
        },
        {
          ...admin,
          role: UserRole.FINANCIAL_DIRECTOR,
          activeRole: UserRole.FINANCIAL_DIRECTOR,
          roles: [UserRole.FINANCIAL_DIRECTOR],
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
