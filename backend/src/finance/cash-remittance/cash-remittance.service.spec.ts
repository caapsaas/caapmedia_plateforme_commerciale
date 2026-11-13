import { ForbiddenException } from '@nestjs/common';
import { AccountType, UserRole } from '@prisma/client';
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
  const findReceipts = jest.fn();
  const service = new CashRemittanceService(
    {
      treasuryAccount: { findMany },
      financialTransaction: { findMany: findReceipts },
    } as unknown as PrismaService,
    {} as AccountingOutboxService,
  );

  beforeEach(() => {
    findMany.mockReset();
    findReceipts.mockReset().mockResolvedValue([]);
  });

  it('lists only the active cashier assigned sales registers in their branch', async () => {
    const accounts = [{ id: 'register', accountName: 'Caisse', balance: 25 }];
    findMany.mockResolvedValue(accounts);
    await expect(service.findSourceAccounts(cashier)).resolves.toEqual([
      {
        ...accounts[0],
        balance: 25,
        dailyCollectedAmount: 0,
        availableReceipts: [],
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
});
