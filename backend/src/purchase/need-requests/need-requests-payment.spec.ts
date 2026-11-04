import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseCategory, Prisma, UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NeedRequestsService } from './need-requests.service';
import { PayNeedRequestDto } from './dto/pay-need-request.dto';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { TreasuryService } from '../../finance/treasury/treasury.service';

describe('Cash-box-only need payments', () => {
  const admin: JwtUser = {
    id: 'admin',
    email: 'admin@test.local',
    role: UserRole.SUPER_ADMIN,
    activeRole: UserRole.SUPER_ADMIN,
    roles: [UserRole.SUPER_ADMIN],
    subsidiaryId: 'headquarter',
  };
  const commercial: JwtUser = {
    ...admin,
    id: 'commercial',
    role: UserRole.COMMERCIAL,
    activeRole: UserRole.COMMERCIAL,
    roles: [UserRole.COMMERCIAL],
  };
  const dto: PayNeedRequestDto = {
    amount: 12500.5,
    beneficiary: 'Prestataire',
    transactionDate: '2026-10-27',
    category: ExpenseCategory.ADVERTISING,
  };
  const account = {
    id: 'expense-box',
    accountName: 'Caisse locale',
    balance: new Prisma.Decimal(50000),
    currency: 'XOF',
  };
  const request = {
    id: 'need',
    title: 'Campagne',
    subsidiaryId: 'branch-b',
    requesterId: 'commercial',
    status: 'APPROVED',
    payment: null,
  };
  const prisma = {
    needRequest: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    treasuryAccount: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    financialTransaction: { create: jest.fn(), findFirst: jest.fn() },
    needRequestPayment: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const notifications = { createNotification: jest.fn(), publish: jest.fn() };
  const accounting = { enqueue: jest.fn() };
  let service: NeedRequestsService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new NeedRequestsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      accounting as unknown as AccountingOutboxService,
    );
    prisma.$transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma),
    );
    prisma.needRequest.findUnique.mockResolvedValue(request);
    prisma.needRequest.findUniqueOrThrow.mockResolvedValue({
      ...request,
      payment: { id: 'payment' },
    });
    prisma.treasuryAccount.findMany.mockResolvedValue([account]);
    prisma.treasuryAccount.updateMany.mockResolvedValue({ count: 1 });
    prisma.treasuryAccount.findUniqueOrThrow.mockResolvedValue({
      ...account,
      balance: new Prisma.Decimal(37499.5),
    });
    prisma.financialTransaction.create.mockResolvedValue({
      id: 'transaction',
      description: 'Règlement campagne',
    });
    notifications.createNotification.mockResolvedValue({
      id: 'notification',
      recipientId: 'commercial',
    });
  });
  it('denies payments and balance access to a commercial or financial director', async () => {
    for (const identity of [
      commercial,
      { ...commercial, activeRole: UserRole.FINANCIAL_DIRECTOR },
    ]) {
      await expect(service.pay(identity, 'need', dto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.paymentAccount(identity, 'need')).rejects.toThrow(
        ForbiddenException,
      );
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('resolves only the expense box of the request branch, not the admin branch', async () => {
    await service.pay(admin, 'need', dto);
    expect(prisma.treasuryAccount.findMany).toHaveBeenCalledWith({
      where: { subsidiaryId: 'branch-b', accountType: 'EXPENSE_BOX' },
      take: 2,
      select: { id: true, accountName: true, balance: true, currency: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(prisma.treasuryAccount.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'expense-box',
        subsidiaryId: 'branch-b',
        accountType: 'EXPENSE_BOX',
        balance: { gte: new Prisma.Decimal(12500.5) },
      },
      data: { balance: { decrement: new Prisma.Decimal(12500.5) } },
    });
  });
  it.each(['PENDING', 'REJECTED'])(
    'refuses a %s request before touching funds',
    async (status) => {
      prisma.needRequest.findUnique.mockResolvedValue({ ...request, status });
      await expect(service.pay(admin, 'need', dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.treasuryAccount.updateMany).not.toHaveBeenCalled();
    },
  );
  it('refuses an unknown request', async () => {
    prisma.needRequest.findUnique.mockResolvedValue(null);
    await expect(service.pay(admin, 'missing', dto)).rejects.toThrow(
      NotFoundException,
    );
  });
  it('refuses an already paid request without debiting again', async () => {
    prisma.needRequest.findUnique.mockResolvedValue({
      ...request,
      payment: { id: 'existing' },
    });
    await expect(service.pay(admin, 'need', dto)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.treasuryAccount.updateMany).not.toHaveBeenCalled();
  });
  it.each([
    { accounts: [] },
    { accounts: [account, { ...account, id: 'second' }] },
  ])(
    'refuses missing or ambiguous cash-box configuration',
    async ({ accounts }) => {
      prisma.treasuryAccount.findMany.mockResolvedValue(accounts);
      await expect(service.pay(admin, 'need', dto)).rejects.toThrow();
      expect(prisma.treasuryAccount.updateMany).not.toHaveBeenCalled();
    },
  );
  it('refuses an insufficient balance without recording a payment', async () => {
    prisma.treasuryAccount.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.pay(admin, 'need', dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.financialTransaction.create).not.toHaveBeenCalled();
    expect(prisma.needRequestPayment.create).not.toHaveBeenCalled();
    expect(notifications.publish).not.toHaveBeenCalled();
  });
  it('records one validated cash-box expense, linked payment, accounting event and notification', async () => {
    await service.pay(admin, 'need', dto);
    const transactionData = (
      prisma.financialTransaction.create.mock.calls as unknown as Array<
        [
          {
            data: {
              sourceAccountId: string;
              destinationAccountId?: string;
              subsidiaryId: string;
              relatedDocumentId: string;
              status: string;
              amount: Prisma.Decimal;
            };
          },
        ]
      >
    )[0][0];
    expect(transactionData.data).toMatchObject({
      sourceAccountId: 'expense-box',
      subsidiaryId: 'branch-b',
      relatedDocumentId: 'need',
      status: 'VALIDE',
    });
    expect(transactionData.data.destinationAccountId).toBeUndefined();
    expect(transactionData.data.amount.toString()).toBe('12500.5');
    const paymentData = (
      prisma.needRequestPayment.create.mock.calls as unknown as Array<
        [{ data: object }]
      >
    )[0][0];
    expect(paymentData.data).toMatchObject({
      needRequestId: 'need',
      financialTransactionId: 'transaction',
      beneficiary: 'Prestataire',
      paidById: 'admin',
      currency: 'XOF',
    });
    expect(accounting.enqueue).toHaveBeenCalledWith(prisma, {
      eventType: 'TREASURY_EXPENSE',
      subsidiaryId: 'branch-b',
      payload: {
        userId: 'admin',
        operationDate: new Date('2026-10-27').toISOString(),
        amount: 12500.5,
        description: 'Règlement campagne',
        sourceId: 'transaction',
        accountType: 'EXPENSE_BOX',
        expenseCategory: 'ADVERTISING',
        withTva: false,
      },
    });
    expect(notifications.createNotification).toHaveBeenCalledWith(
      'commercial',
      expect.objectContaining({
        data: {
          event: 'need.paid',
          requestId: 'need',
          subsidiaryId: 'branch-b',
        },
      }),
      prisma,
    );
  });
  it('publishes only after the transaction completes', async () => {
    prisma.$transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => {
        const result = await callback(prisma);
        expect(notifications.publish).not.toHaveBeenCalled();
        return result;
      },
    );
    await service.pay(admin, 'need', dto);
    expect(notifications.publish).toHaveBeenCalledTimes(1);
  });
  it('propagates persistence errors without sending a notification', async () => {
    accounting.enqueue.mockRejectedValue(new Error('outbox unavailable'));
    await expect(service.pay(admin, 'need', dto)).rejects.toThrow(
      'outbox unavailable',
    );
    expect(notifications.publish).not.toHaveBeenCalled();
  });
  it('retries serialization conflicts and turns a duplicate payment into a conflict', async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('conflict', {
        code: 'P2034',
        clientVersion: '6',
      }),
    );
    await service.pay(admin, 'need', dto);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(notifications.publish).toHaveBeenCalledTimes(1);
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6',
      }),
    );
    await expect(service.pay(admin, 'need', dto)).rejects.toThrow(
      ConflictException,
    );
  });
  it('caps retries for repeated serialization conflicts', async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('conflict', {
        code: 'P2034',
        clientVersion: '6',
      }),
    );
    await expect(service.pay(admin, 'need', dto)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(notifications.publish).not.toHaveBeenCalled();
  });
  it('blocks deleting a payment from the generic treasury endpoint', async () => {
    prisma.financialTransaction.findFirst.mockResolvedValue({
      id: 'transaction',
      needRequestPayment: { id: 'payment' },
    });
    const treasury = new TreasuryService(
      prisma as unknown as PrismaService,
      accounting as unknown as AccountingOutboxService,
    );
    await expect(
      treasury.deleteTransaction('transaction', admin),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.001, null, '500', 10000000000000])(
    'rejects invalid amount %p at the DTO boundary',
    async (amount) => {
      const errors = await validate(
        plainToInstance(PayNeedRequestDto, { ...dto, amount }),
      );
      expect(errors.some((error) => error.property === 'amount')).toBe(true);
    },
  );
  it('strips caller-selected bank and destination ids from the payment DTO', async () => {
    const payload = plainToInstance(PayNeedRequestDto, {
      ...dto,
      sourceAccountId: 'bank',
      destinationAccountId: 'foreign',
    });
    expect(await validate(payload, { whitelist: true })).toHaveLength(0);
    expect(payload).not.toHaveProperty('sourceAccountId');
    expect(payload).not.toHaveProperty('destinationAccountId');
  });
});
