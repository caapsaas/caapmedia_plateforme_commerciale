import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  const user = { subsidiaryId: 'SUB-A', userRole: UserRole.ADMIN } as User;
  const supplier = { id: 'SUP-ABC123', subsidiaryId: 'SUB-A' };
  const delegate = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(supplier),
    update: jest.fn().mockResolvedValue(supplier),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    delete: jest.fn().mockResolvedValue(supplier),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  });
  const setup = () => {
    const tx = {
      supplier: delegate(),
      purchaseOrder: delegate(),
      financialTransaction: delegate(),
      treasuryAccount: delegate(),
      accountingOutboxEntry: delegate(),
      journalEntry: delegate(),
      stockMovement: delegate(),
      itemStock: delegate(),
      item: delegate(),
    };
    const prisma = {
      ...tx,
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    return {
      tx,
      prisma,
      service: new SuppliersService(prisma as unknown as PrismaService),
    };
  };

  it('updates semantic supplier IDs after verifying subsidiary access', async () => {
    const { tx, service } = setup();
    await service.update(supplier.id, { supplierName: 'Updated' }, user);
    expect(tx.supplier.update).toHaveBeenCalledWith({
      where: { id: supplier.id },
      data: { supplierName: 'Updated' },
    });
  });

  it('refuses another subsidiary before any deletion', async () => {
    const { tx, service } = setup();
    tx.supplier.findUnique.mockResolvedValue({
      ...supplier,
      subsidiaryId: 'SUB-B',
    });
    await expect(service.remove(supplier.id, user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tx.purchaseOrder.findMany).not.toHaveBeenCalled();
    expect(tx.supplier.delete).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing supplier', async () => {
    const { tx, service } = setup();
    tx.supplier.findUnique.mockResolvedValue(null);
    await expect(service.remove(supplier.id, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes linked operations and reverses actual stock and treasury effects atomically', async () => {
    const { tx, prisma, service } = setup();
    tx.purchaseOrder.findMany.mockResolvedValue([
      { id: 'PO-A', supplierDebts: [{ id: 'SDT-A' }] },
    ]);
    tx.financialTransaction.findMany.mockResolvedValue([
      {
        id: 'PAY-A',
        relatedDocumentId: 'SDT-A',
        status: 'VALIDE',
        financialTransactionType: 'DEPENSE',
        amount: new Prisma.Decimal('125.50'),
        treasuryAccountId: 'HQ-SAFE',
        sourceAccountId: 'HQ-SAFE',
      },
      {
        id: 'PAY-B',
        relatedDocumentId: 'PO-A',
        status: 'EN_ATTENTE',
        amount: new Prisma.Decimal(50),
      },
    ]);
    tx.stockMovement.findMany.mockResolvedValue([
      {
        itemId: 'ITEM-A',
        subsidiaryId: 'SUB-A',
        type: 'PURCHASE_RECEIPT',
        quantity: new Prisma.Decimal(10),
      },
      {
        itemId: 'ITEM-A',
        subsidiaryId: 'SUB-A',
        type: 'SUPPLIER_RETURN',
        quantity: new Prisma.Decimal(2),
      },
    ]);
    tx.journalEntry.findMany
      .mockResolvedValueOnce([{ id: 'J-A' }])
      .mockResolvedValueOnce([{ id: 'J-REV' }])
      .mockResolvedValueOnce([]);
    await expect(service.remove(supplier.id, user)).resolves.toEqual(supplier);
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: 'Serializable' }),
    );
    expect(tx.financialTransaction.findMany).toHaveBeenCalledWith({
      where: { relatedDocumentId: { in: [supplier.id, 'PO-A', 'SDT-A'] } },
    });
    expect(tx.treasuryAccount.update).toHaveBeenCalledTimes(1);
    expect(tx.treasuryAccount.update).toHaveBeenCalledWith({
      where: { id: 'HQ-SAFE' },
      data: { balance: { increment: new Prisma.Decimal('125.50') } },
    });
    expect(tx.itemStock.update).toHaveBeenNthCalledWith(1, {
      where: {
        itemId_subsidiaryId: { itemId: 'ITEM-A', subsidiaryId: 'SUB-A' },
      },
      data: { stock: { increment: new Prisma.Decimal(-10) } },
    });
    expect(tx.itemStock.update).toHaveBeenNthCalledWith(2, {
      where: {
        itemId_subsidiaryId: { itemId: 'ITEM-A', subsidiaryId: 'SUB-A' },
      },
      data: { stock: { increment: new Prisma.Decimal(2) } },
    });
    expect(tx.stockMovement.deleteMany).toHaveBeenCalledWith({
      where: { purchaseOrderId: { in: ['PO-A'] } },
    });
    expect(tx.item.updateMany).toHaveBeenCalledWith({
      where: { mainSupplierId: supplier.id },
      data: { mainSupplierId: null },
    });
    expect(tx.journalEntry.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['J-A', 'J-REV'] } },
    });
    expect(tx.accountingOutboxEntry.deleteMany).toHaveBeenCalled();
    expect(tx.supplier.delete).toHaveBeenCalledWith({
      where: { id: supplier.id },
    });
  });

  it('propagates a cleanup error without deleting the supplier', async () => {
    const { tx, service } = setup();
    tx.stockMovement.deleteMany.mockRejectedValue(
      new Error('Database failure'),
    );
    await expect(service.remove(supplier.id, user)).rejects.toThrow(
      'Database failure',
    );
    expect(tx.supplier.delete).not.toHaveBeenCalled();
  });
});
