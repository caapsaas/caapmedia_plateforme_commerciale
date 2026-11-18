import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { JwtUser } from '../common/auth/jwt/jwt-user.interface';
import type { PrismaService } from '../common/utils/prisma/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { ExternalTransactionController } from './external-transaction/external-transaction.controller';
import { ExternalTransactionService } from './external-transaction/external-transaction.service';
import type { TreasuryService } from './treasury/treasury.service';
import { PrefinancementController } from './prefinancement/prefinancement.controller';
import { PrefinancementService } from './prefinancement/prefinancement.service';

describe('Finance subsidiary isolation', () => {
  const user: JwtUser = {
    id: 'staff-a',
    email: 'staff@example.test',
    role: UserRole.FINANCIAL_DIRECTOR,
    activeRole: UserRole.FINANCIAL_DIRECTOR,
    roles: [UserRole.FINANCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
    subsidiaryId: 'branch-a',
  };
  const superAdmin = { ...user, activeRole: UserRole.SUPER_ADMIN };
  const foreign = { id: 'transaction-b', subsidiaryId: 'branch-b' };
  const delegate = () => ({
    findUnique: jest.fn(
      ({ where }: { where: { id: string; subsidiaryId?: string } }) =>
        where.id === foreign.id &&
        (!where.subsidiaryId || where.subsidiaryId === foreign.subsidiaryId)
          ? Promise.resolve(foreign)
          : Promise.resolve(null),
    ),
    update: jest.fn(),
    delete: jest.fn(),
  });
  const prefinancementTransaction = delegate();
  const externalFinancialTransaction = delegate();
  const prisma = {
    prefinancementTransaction,
    externalFinancialTransaction,
    $transaction: <T>(
      callback: (tx: {
        prefinancementTransaction: ReturnType<typeof delegate>;
      }) => Promise<T>,
    ) => callback({ prefinancementTransaction }),
  } as unknown as PrismaService;
  const prefinancementService = new PrefinancementService(
    prisma,
    {} as TreasuryService,
  );
  const externalService = new ExternalTransactionService(
    prisma,
    {} as NotificationsService,
  );
  const prefinancement = new PrefinancementController(prefinancementService);
  const external = new ExternalTransactionController(externalService);

  afterEach(() => jest.restoreAllMocks());

  it('uses only the active role to scope list filters and reports', async () => {
    const getStatistics = jest
      .spyOn(externalService, 'getStatistics')
      .mockImplementation(jest.fn());
    const findTransactions = jest
      .spyOn(prefinancementService, 'findTransactions')
      .mockImplementation(jest.fn());
    await external.getStatistics('branch-b', user);
    expect(getStatistics).toHaveBeenCalledWith('branch-a');
    await external.getStatistics('branch-b', superAdmin);
    expect(getStatistics).toHaveBeenLastCalledWith('branch-b');

    await prefinancement.findTransactions(user, { subsidiaryId: 'branch-b' });
    expect(findTransactions).toHaveBeenCalledWith({ subsidiaryId: 'branch-a' });
  });

  it('enforces foreign-record isolation on prefinancing reads and writes', async () => {
    await expect(
      prefinancement.findTransactionById(foreign.id, user),
    ).rejects.toThrow(NotFoundException);
    await expect(
      prefinancement.updateTransaction(foreign.id, { amount: 100 }, user),
    ).rejects.toThrow(NotFoundException);
    await expect(
      prefinancement.validateTransaction(foreign.id, user),
    ).rejects.toThrow(NotFoundException);
    await expect(
      prefinancement.cancelTransaction(foreign.id, user),
    ).rejects.toThrow(NotFoundException);
    await expect(
      prefinancement.deleteTransaction(foreign.id, user),
    ).rejects.toThrow(NotFoundException);
    expect(prefinancementTransaction.update).not.toHaveBeenCalled();
    expect(prefinancementTransaction.delete).not.toHaveBeenCalled();
    await expect(
      prefinancement.findTransactionById(foreign.id, superAdmin),
    ).resolves.toEqual(foreign);
  });

  it('enforces foreign-record isolation on external transaction reads and writes', async () => {
    await expect(external.findOne(foreign.id, user)).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      external.update(foreign.id, { amount: 100 }, user),
    ).rejects.toThrow(NotFoundException);
    await expect(external.validate(foreign.id, user)).rejects.toThrow(
      NotFoundException,
    );
    await expect(external.cancel(foreign.id, user)).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      external.adminUpdate(foreign.id, { amount: 100 }, user),
    ).rejects.toThrow(NotFoundException);
    await expect(external.adminRemove(foreign.id, user)).rejects.toThrow(
      NotFoundException,
    );
    expect(externalFinancialTransaction.update).not.toHaveBeenCalled();
    expect(externalFinancialTransaction.delete).not.toHaveBeenCalled();
    await expect(external.findOne(foreign.id, superAdmin)).resolves.toEqual(
      foreign,
    );
  });
});
