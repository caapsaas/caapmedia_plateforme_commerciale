import {
  AccountType,
  DebtStatus,
  Prisma,
  SupplierCreditNoteStatus,
  TransactionStatus,
  UserRole,
} from '@prisma/client';
import type { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import type { PrismaService } from '../../common/utils/prisma/prisma.service';
import { DebtsService } from './debts.service';

describe('DebtsService (Bank payments, thresholds & Supplier Credit Notes)', () => {
  const daf: JwtUser = {
    id: 'daf-1',
    email: 'daf@example.com',
    role: UserRole.FINANCIAL_DIRECTOR,
    activeRole: UserRole.FINANCIAL_DIRECTOR,
    roles: [UserRole.FINANCIAL_DIRECTOR],
    subsidiaryId: 'branch',
  };

  it('queues supplier debt payment via BANQUE as EN_ATTENTE for Maker-Checker approval', async () => {
    const createTx = jest.fn().mockResolvedValue({ id: 'tx-pending-bank' });
    const prisma = {
      supplierDebt: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'debt-1',
          supplierName: 'Fournisseur A',
          invoiceId: 'INV-001',
          amount: new Prisma.Decimal(200),
          status: DebtStatus.A_PAYER,
          subsidiaryId: 'branch',
          purchaseOrder: {
            id: 'po-1',
            totalAmount: new Prisma.Decimal(200),
            amountPaid: new Prisma.Decimal(0),
          },
        }),
      },
      treasuryAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'bank-1',
          accountName: 'Banque Afriland',
          accountType: AccountType.BANQUE,
          balance: new Prisma.Decimal(1000),
          subsidiaryId: 'branch',
        }),
      },
      subsidiary: {
        findUnique: jest.fn().mockResolvedValue({
          safeMakerCheckerThreshold: new Prisma.Decimal(0),
        }),
      },
      financialTransaction: { create: createTx },
    } as unknown as PrismaService;

    const service = new DebtsService(prisma, {
      enqueue: jest.fn(),
    } as unknown as AccountingOutboxService);
    const result = await service.paySupplierDebt(
      'debt-1',
      { treasuryAccountId: 'bank-1', paymentDate: '2026-11-28', amount: 150 },
      daf,
    );

    expect(result).toMatchObject({ pendingApproval: true });
    expect(createTx).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TransactionStatus.EN_ATTENTE,
          supplierDebtId: 'debt-1',
        }),
      }),
    );
  });

  it('applies an active supplier credit note against supplier debt and enqueues SUPPLIER_CREDIT_NOTE', async () => {
    const enqueue = jest.fn();
    const tx = {
      supplierCreditNote: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cn-1',
          creditNoteNumber: 'AV-2026-01',
          supplierDebtId: 'debt-1',
          amount: new Prisma.Decimal(50),
          appliedAmount: new Prisma.Decimal(0),
          status: SupplierCreditNoteStatus.ACTIVE,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'cn-1',
          creditNoteNumber: 'AV-2026-01',
          amount: new Prisma.Decimal(50),
          appliedAmount: new Prisma.Decimal(50),
          status: SupplierCreditNoteStatus.APPLIED,
        }),
      },
      supplierDebt: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'debt-1',
          supplierName: 'Fournisseur A',
          subsidiaryId: 'branch',
          amount: new Prisma.Decimal(200),
          status: DebtStatus.A_PAYER,
          purchaseOrder: {
            id: 'po-1',
            totalAmount: new Prisma.Decimal(200),
            amountPaid: new Prisma.Decimal(0),
          },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'debt-1',
          amount: new Prisma.Decimal(150),
          status: DebtStatus.PARTIELLEMENT_PAYE,
        }),
      },
      purchaseOrder: { update: jest.fn() },
      purchaseOrderHistory: { create: jest.fn() },
    };
    const prisma = {
      $transaction: (cb: (client: typeof tx) => unknown) => cb(tx),
    } as unknown as PrismaService;

    const service = new DebtsService(prisma, {
      enqueue,
    } as unknown as AccountingOutboxService);
    const res = await service.applySupplierCreditNote('cn-1', daf);

    expect(res.creditNote.status).toBe(SupplierCreditNoteStatus.APPLIED);
    expect(enqueue).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        eventType: 'SUPPLIER_CREDIT_NOTE',
        subsidiaryId: 'branch',
      }),
    );
  });
});
