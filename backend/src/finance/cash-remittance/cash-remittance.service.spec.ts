import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AccountType,
  CashRemittanceStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import type { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import type { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CashRemittanceService } from './cash-remittance.service';

describe('CashRemittanceService source accounts', () => {
  const cashier: JwtUser = {
    id: 'cashier',
    email: 'cashier@example.com',
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN, UserRole.CAISSIER],
    activeRole: UserRole.CAISSIER,
    subsidiaryId: 'branch',
  };
  const findMany = jest.fn();
  const groupBy = jest.fn();
  const transaction = jest.fn();
  const service = new CashRemittanceService(
    {
      treasuryAccount: { findMany },
      cashRemittance: { groupBy },
      $transaction: transaction,
    } as unknown as PrismaService,
    {} as AccountingOutboxService,
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-20T09:00:00Z'));
    findMany.mockReset();
    groupBy.mockReset().mockResolvedValue([]);
    transaction.mockReset();
  });

  afterEach(() => jest.useRealTimers());

  it('lists only the active cashier assigned sales registers in their branch', async () => {
    const accounts = [
      {
        id: 'register',
        accountName: 'Caisse',
        balance: new Prisma.Decimal(25),
      },
    ];
    findMany.mockResolvedValue(accounts);
    groupBy.mockResolvedValue([
      {
        sourceCashRegisterId: 'register',
        _sum: { declaredAmount: new Prisma.Decimal(10) },
      },
    ]);
    await expect(service.findSourceAccounts(cashier)).resolves.toEqual([
      {
        ...accounts[0],
        balance: 25,
        availableBalance: 15,
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        cashierId: 'cashier',
        subsidiaryId: 'branch',
        accountType: AccountType.CASH_REGISTER,
      },
      select: { id: true, accountName: true, balance: true },
      orderBy: { accountName: 'asc' },
    });
  });

  it('rejects callers without the active cashier role or branch scope', async () => {
    await expect(
      service.findSourceAccounts({ ...cashier, activeRole: UserRole.ADMIN }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.findSourceAccounts({ ...cashier, subsidiaryId: '' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findMany).not.toHaveBeenCalled();
  });

  it.each(['2026-11-21', '2026-02-30'])(
    'rejects an invalid remittance day %s',
    async (remittanceDate) => {
      await expect(
        service.create({ remittanceDate, declaredAmount: 25 }, cashier),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(transaction).not.toHaveBeenCalled();
    },
  );

  it('submits a previous day as one amount without linking any orders', async () => {
    const amount = new Prisma.Decimal('25.75');
    const create = jest.fn().mockResolvedValue({ declaredAmount: amount });
    const register = {
      id: 'register',
      subsidiaryId: 'branch',
      balance: new Prisma.Decimal(50),
    };
    const tx = {
      treasuryAccount: {
        findMany: jest.fn().mockResolvedValue([register]),
        findFirst: jest.fn().mockResolvedValue({ id: 'safe' }),
      },
      financialTransaction: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'receipt', relatedDocumentId: 'order', amount },
          ]),
      },
      order: { findMany: jest.fn().mockResolvedValue([{ id: 'order' }]) },
      cashRemittance: {
        groupBy,
        count: jest.fn().mockResolvedValue(0),
        create,
      },
    };
    transaction.mockImplementation((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    );
    const dto = { remittanceDate: '2026-11-19', declaredAmount: 25.75 };

    groupBy.mockResolvedValue([
      {
        sourceCashRegisterId: 'register',
        _sum: { declaredAmount: new Prisma.Decimal(30) },
      },
    ]);
    await expect(service.create(dto, cashier)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(create).not.toHaveBeenCalled();

    groupBy.mockResolvedValue([
      {
        sourceCashRegisterId: 'register',
        _sum: { declaredAmount: new Prisma.Decimal(10) },
      },
    ]);
    await expect(service.create(dto, cashier)).resolves.toMatchObject({
      declaredAmount: 25.75,
    });
    expect(groupBy).toHaveBeenCalledWith({
      by: ['sourceCashRegisterId'],
      where: {
        sourceCashRegisterId: { in: ['register'] },
        subsidiaryId: 'branch',
        status: CashRemittanceStatus.SUBMITTED,
      },
      _sum: { declaredAmount: true },
    });
    const [saved] = create.mock.calls[0] as [Prisma.CashRemittanceCreateArgs];
    expect(saved.data.remittanceDate).toEqual(new Date('2026-11-19T00:00:00Z'));
    expect(saved.data.declaredAmount).toEqual(amount);
    expect(saved.data).not.toHaveProperty('receipts');
    expect(saved.data).not.toHaveProperty('orders');

    await expect(
      service.create(
        { ...dto, receiptIds: ['receipt'], declaredAmount: 10 },
        cashier,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await service.create({ ...dto, receiptIds: ['receipt'] }, cashier);
    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          receipts: { create: [{ financialTransactionId: 'receipt' }] },
        }),
      }),
    );
  });
});
