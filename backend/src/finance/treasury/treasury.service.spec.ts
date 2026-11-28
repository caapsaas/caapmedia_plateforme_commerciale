import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AccountType,
  Prisma,
  TransactionStatus,
  TransactionType,
  TreasuryTransactionType,
  UserRole,
} from '@prisma/client';
import type { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import type { PrismaService } from '../../common/utils/prisma/prisma.service';
import { TreasuryService } from './treasury.service';

describe('Treasury account funding', () => {
  const admin: JwtUser = {
    id: 'admin',
    email: 'admin@example.com',
    role: UserRole.SUPER_ADMIN,
    activeRole: UserRole.SUPER_ADMIN,
    roles: [UserRole.SUPER_ADMIN],
    subsidiaryId: 'branch',
  };
  const safe = {
    id: 'safe',
    accountName: 'Coffre-fort',
    accountType: AccountType.SAFE,
    currency: 'XOF',
    subsidiaryId: 'branch',
  };
  const expenseBox = {
    ...safe,
    id: 'expense-box',
    accountName: 'Caisse dépense',
    accountType: AccountType.EXPENSE_BOX,
  };
  const refill = {
    sourceAccountId: safe.id,
    destinationAccountId: expenseBox.id,
    treasuryType: TreasuryTransactionType.CASH_REFILL,
    transactionDate: '2026-11-16',
    description: 'Alimentation',
    amount: 100,
  };
  const amount = new Prisma.Decimal(100);
  const prisma = {
    subsidiary: { findUnique: jest.fn() },
    treasuryAccount: {
      findFirst: jest.fn(),
      create: jest.fn<unknown, [Prisma.TreasuryAccountCreateArgs]>(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    financialTransaction: {
      create: jest.fn<unknown, [Prisma.FinancialTransactionCreateArgs]>(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const outbox = { enqueue: jest.fn() };
  const service = new TreasuryService(
    prisma as unknown as PrismaService,
    outbox as unknown as AccountingOutboxService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    );
    prisma.subsidiary.findUnique.mockResolvedValue({ id: 'branch' });
    prisma.treasuryAccount.findFirst.mockResolvedValue(null);
    prisma.treasuryAccount.create.mockImplementation(({ data }) => data);
  });

  it('refuses super-admin approval of a branch expense-box operation', async () => {
    prisma.financialTransaction.findFirst.mockResolvedValue({
      status: TransactionStatus.EN_ATTENTE,
      financialTransactionType: TransactionType.DEPENSE,
      treasuryAccount: expenseBox,
      destinationAccount: null,
    });

    await expect(
      service.updateTransactionStatus(
        'expense',
        { status: TransactionStatus.VALIDE },
        admin,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.financialTransaction.updateMany).not.toHaveBeenCalled();
  });

  it('opens an expense box at zero and rejects a nonzero opening balance', async () => {
    const dto = {
      accountName: expenseBox.accountName,
      accountType: expenseBox.accountType,
      currency: 'XOF',
    };
    await expect(
      service.createAccount({ ...dto, initialBalance: 100 }, admin),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.treasuryAccount.create).not.toHaveBeenCalled();

    await expect(
      service.createAccount({ ...dto, initialBalance: 0 }, admin),
    ).resolves.toMatchObject({ balance: 0, financialTransactions: undefined });
  });

  it('records a positive opening balance as a validated receipt in the same write', async () => {
    await service.createAccount(
      {
        accountName: safe.accountName,
        accountType: safe.accountType,
        currency: safe.currency,
        initialBalance: 100,
      },
      admin,
    );
    const { data, include } = prisma.treasuryAccount.create.mock.calls[0][0];
    expect(data).toMatchObject({
      balance: amount,
      initialBalance: amount,
      financialTransactions: {
        create: {
          description: 'Solde initial',
          amount,
          financialTransactionType: TransactionType.RECETTE,
          treasuryType: TreasuryTransactionType.INFLOW,
          status: TransactionStatus.VALIDE,
          balanceAfterSource: amount,
          subsidiaryId: 'branch',
          reference: `INIT-${data.id}`,
        },
      },
    });
    expect(include).toEqual({ bank: true });
  });

  it('rejects a direct income into the expense box', async () => {
    prisma.treasuryAccount.findFirst.mockResolvedValue(expenseBox);
    await expect(
      service.createIncomeTransaction(
        {
          treasuryAccountId: expenseBox.id,
          amount: 100,
          transactionDate: refill.transactionDate,
          description: refill.description,
        },
        {
          ...admin,
          role: UserRole.FINANCIAL_DIRECTOR,
          activeRole: UserRole.FINANCIAL_DIRECTOR,
          roles: [UserRole.FINANCIAL_DIRECTOR],
        },
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.financialTransaction.create).not.toHaveBeenCalled();
  });

  it.each([
    [AccountType.BANQUE, TreasuryTransactionType.CASH_REFILL],
    [AccountType.SAFE, TreasuryTransactionType.BANK_WITHDRAWAL],
  ])(
    'rejects an expense box transfer with source %s and type %s',
    async (accountType, treasuryType) => {
      prisma.treasuryAccount.findFirst
        .mockResolvedValueOnce({ ...safe, accountType })
        .mockResolvedValueOnce(expenseBox);
      await expect(
        service.createDisbursement({ ...refill, treasuryType }, admin),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.treasuryAccount.updateMany).not.toHaveBeenCalled();
    },
  );

  it('debits the safe and credits the expense box in one transfer', async () => {
    prisma.treasuryAccount.findFirst
      .mockResolvedValueOnce(safe)
      .mockResolvedValueOnce(expenseBox);
    prisma.treasuryAccount.updateMany.mockResolvedValue({ count: 1 });
    prisma.treasuryAccount.findUniqueOrThrow.mockResolvedValue({
      balance: new Prisma.Decimal(200),
    });
    prisma.treasuryAccount.update.mockResolvedValue({ balance: amount });
    prisma.financialTransaction.create.mockResolvedValue({ id: 'refill' });
    await service.createDisbursement(refill, admin);

    expect(prisma.treasuryAccount.updateMany).toHaveBeenCalledWith({
      where: { id: safe.id, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    expect(prisma.treasuryAccount.update).toHaveBeenCalledWith({
      where: { id: expenseBox.id },
      data: { balance: { increment: amount } },
    });
    expect(
      prisma.financialTransaction.create.mock.calls[0][0].data,
    ).toMatchObject({
      sourceAccountId: safe.id,
      destinationAccountId: expenseBox.id,
      balanceAfterSource: new Prisma.Decimal(200),
      balanceAfterDest: amount,
    });
    expect(outbox.enqueue).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({ eventType: 'TREASURY_TRANSFER' }),
    );
  });

  it('leaves the expense box untouched when the safe has insufficient funds', async () => {
    prisma.treasuryAccount.findFirst
      .mockResolvedValueOnce(safe)
      .mockResolvedValueOnce(expenseBox);
    prisma.treasuryAccount.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.createDisbursement(refill, admin)).rejects.toThrow(
      'Solde insuffisant',
    );
    expect(prisma.treasuryAccount.update).not.toHaveBeenCalled();
    expect(prisma.financialTransaction.create).not.toHaveBeenCalled();
  });

  it('applies a pending refill only after claiming it for validation', async () => {
    prisma.financialTransaction.findFirst.mockResolvedValue({
      id: 'refill',
      subsidiaryId: safe.subsidiaryId,
      treasuryType: refill.treasuryType,
      financialTransactionType: TransactionType.DEPENSE,
      transactionDate: new Date(refill.transactionDate),
      status: TransactionStatus.EN_ATTENTE,
      treasuryAccount: safe,
      destinationAccount: expenseBox,
      amount,
    });
    prisma.financialTransaction.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    prisma.treasuryAccount.updateMany.mockResolvedValue({ count: 1 });
    prisma.treasuryAccount.findUniqueOrThrow.mockResolvedValue({
      balance: new Prisma.Decimal(200),
    });
    prisma.treasuryAccount.update.mockResolvedValue({ balance: amount });
    const dto = { status: TransactionStatus.VALIDE } as const;

    await service.updateTransactionStatus('refill', dto, admin);
    await expect(
      service.updateTransactionStatus('refill', dto, admin),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.treasuryAccount.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.treasuryAccount.update).toHaveBeenCalledTimes(1);
    expect(prisma.financialTransaction.update).toHaveBeenCalledWith({
      where: { id: 'refill' },
      data: {
        balanceAfterSource: new Prisma.Decimal(200),
        balanceAfterDest: amount,
      },
    });
  });

  it('allows branch financial director Maker-Checker approval on bank transactions created by another user, but blocks self-approval', async () => {
    const daf: JwtUser = {
      id: 'daf-user',
      email: 'daf@example.com',
      role: UserRole.FINANCIAL_DIRECTOR,
      activeRole: UserRole.FINANCIAL_DIRECTOR,
      roles: [UserRole.FINANCIAL_DIRECTOR],
      subsidiaryId: 'branch',
    };
    const bankAccount = {
      id: 'bank-1',
      accountName: 'Banque Afriland',
      accountType: AccountType.BANQUE,
      currency: 'XAF',
      subsidiaryId: 'branch',
    };

    prisma.financialTransaction.findFirst.mockResolvedValueOnce({
      id: 'bank-tx-self',
      subsidiaryId: 'branch',
      financialTransactionType: TransactionType.DEPENSE,
      transactionDate: new Date('2026-11-28'),
      status: TransactionStatus.EN_ATTENTE,
      createdByUserId: daf.id,
      treasuryAccount: bankAccount,
      destinationAccount: null,
      amount,
    });
    await expect(
      service.updateTransactionStatus(
        'bank-tx-self',
        { status: TransactionStatus.VALIDE },
        daf,
      ),
    ).rejects.toThrow(ForbiddenException);

    prisma.financialTransaction.findFirst.mockResolvedValueOnce({
      id: 'bank-tx-other',
      subsidiaryId: 'branch',
      financialTransactionType: TransactionType.DEPENSE,
      transactionDate: new Date('2026-11-28'),
      status: TransactionStatus.EN_ATTENTE,
      createdByUserId: 'admin-maker',
      treasuryAccount: bankAccount,
      destinationAccount: null,
      amount,
    });
    prisma.financialTransaction.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.treasuryAccount.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.treasuryAccount.findUniqueOrThrow.mockResolvedValueOnce({
      balance: new Prisma.Decimal(900),
    });
    prisma.financialTransaction.update.mockResolvedValueOnce({
      id: 'bank-tx-other',
      status: TransactionStatus.VALIDE,
    });

    const approved = await service.updateTransactionStatus(
      'bank-tx-other',
      { status: TransactionStatus.VALIDE },
      daf,
    );
    expect(approved).toMatchObject({ status: TransactionStatus.VALIDE });
  });

  it('blocks deletion of validated transactions and supports motivated reversal', async () => {
    prisma.financialTransaction.findFirst.mockResolvedValueOnce({
      id: 'tx-valide',
      status: TransactionStatus.VALIDE,
      subsidiaryId: admin.subsidiaryId,
      treasuryAccount: safe,
      destinationAccount: null,
    });
    await expect(
      service.deleteTransaction('tx-valide', {
        ...admin,
        role: UserRole.ADMIN,
        activeRole: UserRole.ADMIN,
        roles: [UserRole.ADMIN],
      }),
    ).rejects.toThrow(BadRequestException);

    prisma.financialTransaction.findFirst.mockResolvedValueOnce({
      id: 'tx-valide',
      description: 'Loyer Octobre',
      amount: new Prisma.Decimal(100),
      status: TransactionStatus.VALIDE,
      isReversed: false,
      financialTransactionType: TransactionType.DEPENSE,
      subsidiaryId: safe.subsidiaryId,
      treasuryAccountId: safe.id,
      treasuryAccount: { ...safe, balance: new Prisma.Decimal(400) },
      destinationAccount: null,
      destinationAccountId: null,
      relatedDocumentId: null,
    });
    prisma.treasuryAccount.update.mockResolvedValue({
      balance: new Prisma.Decimal(500),
    });
    prisma.financialTransaction.create.mockResolvedValue({
      id: 'tx-rev',
      status: TransactionStatus.VALIDE,
    });
    prisma.financialTransaction.update.mockResolvedValue({
      id: 'tx-valide',
      status: TransactionStatus.REVERSED,
      isReversed: true,
    });

    const res = await service.reverseTransaction(
      'tx-valide',
      { reason: 'Erreur de saisie fournisseur' },
      admin,
    );
    expect(res).toMatchObject({
      id: 'tx-rev',
      status: TransactionStatus.VALIDE,
    });
    expect(prisma.financialTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tx-valide' },
        data: expect.objectContaining({
          status: TransactionStatus.REVERSED,
          isReversed: true,
        }),
      }),
    );
    expect(outbox.enqueue).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({ eventType: 'TRANSACTION_REVERSAL' }),
    );
  });
});
