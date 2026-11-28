import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  AccountType,
  PrefinancementCategory,
  PrefinancementStatus,
  PrefinancementTransactionType,
  Prisma,
} from '@prisma/client';
import type { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import type { PrismaService } from '../../common/utils/prisma/prisma.service';
import type { TreasuryService } from '../treasury/treasury.service';
import { PrefinancementService } from './prefinancement.service';

describe('PrefinancementService (Treasury & Accounting wiring)', () => {
  it('requires a source Safe/Bank treasuryAccountId when validating a CREDIT', async () => {
    const tx = {
      prefinancementTransaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pf-1',
          subsidiaryId: 'branch',
          type: PrefinancementTransactionType.CREDIT,
          status: PrefinancementStatus.EN_ATTENTE,
          amount: new Prisma.Decimal(100),
          date: new Date('2026-11-28'),
          description: 'Appro préfinancement',
          createdBy: 'daf-1',
        }),
      },
    };
    const prisma = {
      $transaction: (cb: (c: typeof tx) => unknown) => cb(tx),
    } as unknown as PrismaService;
    const treasury = {
      findPrefinancementAccount: jest.fn().mockResolvedValue({
        id: 'pf-acc',
        balance: new Prisma.Decimal(0),
      }),
    } as unknown as TreasuryService;

    const service = new PrefinancementService(prisma, treasury);
    await expect(service.validateTransaction('pf-1', 'branch')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debits COMPTE_PREFINANCEMENT and enqueues PREFINANCEMENT_USAGE on DEBIT validation', async () => {
    const enqueue = jest.fn();
    const tx = {
      prefinancementTransaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pf-2',
          subsidiaryId: 'branch',
          type: PrefinancementTransactionType.DEBIT,
          category: PrefinancementCategory.ENERGIE,
          status: PrefinancementStatus.EN_ATTENTE,
          amount: new Prisma.Decimal(50),
          date: new Date('2026-11-28'),
          description: 'Carburant chantier',
          createdBy: 'daf-1',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'pf-2',
          status: PrefinancementStatus.VALIDE,
        }),
      },
      treasuryAccount: {
        update: jest
          .fn()
          .mockResolvedValue({ balance: new Prisma.Decimal(150) }),
      },
      financialTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'fin-pf-2' }),
      },
    };
    const prisma = {
      $transaction: (cb: (c: typeof tx) => unknown) => cb(tx),
    } as unknown as PrismaService;
    const treasury = {
      findPrefinancementAccount: jest.fn().mockResolvedValue({
        id: 'pf-acc',
        accountType: AccountType.COMPTE_PREFINANCEMENT,
        balance: new Prisma.Decimal(200),
      }),
    } as unknown as TreasuryService;

    const service = new PrefinancementService(prisma, treasury, {
      enqueue,
    } as unknown as AccountingOutboxService);
    await service.validateTransaction('pf-2', 'branch', undefined, 'daf-1');

    expect(enqueue).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ eventType: 'PREFINANCEMENT_USAGE' }),
    );
  });

  it('blocks deletion of validated prefinancement transactions', async () => {
    const tx = {
      prefinancementTransaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pf-val',
          status: PrefinancementStatus.VALIDE,
        }),
      },
    };
    const service = new PrefinancementService(
      {
        $transaction: (cb: (c: typeof tx) => unknown) => cb(tx),
      } as unknown as PrismaService,
      {} as TreasuryService,
    );
    await expect(service.deleteTransaction('pf-val', 'branch')).rejects.toThrow(
      ConflictException,
    );
  });
});
