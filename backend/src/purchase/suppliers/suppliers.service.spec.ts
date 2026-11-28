import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService (Lot 1 non-destructive archiving)', () => {
  const user = {
    id: 'USR-1',
    email: 'admin@caap.cm',
    subsidiaryId: 'SUB-A',
    userRole: UserRole.ADMIN,
  } as unknown as User;
  const supplier = {
    id: 'SUP-ABC123',
    supplierName: 'Papeterie Cameroun',
    subsidiaryId: 'SUB-A',
    isActive: true,
  };

  const setup = () => {
    const tx = {
      supplier: {
        findUnique: jest.fn().mockResolvedValue(supplier),
        update: jest
          .fn()
          .mockResolvedValue({ ...supplier, isActive: false }),
        delete: jest.fn().mockResolvedValue(supplier),
      },
      purchaseOrder: {
        count: jest.fn().mockResolvedValue(0),
      },
      item: {
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const prisma = {
      ...tx,
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    return {
      tx,
      prisma,
      audit,
      service: new SuppliersService(
        prisma as unknown as PrismaService,
        audit as never,
      ),
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

  it('refuses another subsidiary before any archiving or deletion', async () => {
    const { tx, service } = setup();
    tx.supplier.findUnique.mockResolvedValue({
      ...supplier,
      subsidiaryId: 'SUB-B',
    });
    await expect(service.remove(supplier.id, user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tx.purchaseOrder.count).not.toHaveBeenCalled();
    expect(tx.supplier.delete).not.toHaveBeenCalled();
    expect(tx.supplier.update).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing supplier', async () => {
    const { tx, service } = setup();
    tx.supplier.findUnique.mockResolvedValue(null);
    await expect(service.remove(supplier.id, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('archives instead of deleting when purchase orders or catalog items exist', async () => {
    const { tx, audit, service } = setup();
    tx.purchaseOrder.count.mockResolvedValue(2);
    tx.item.count.mockResolvedValue(1);

    const res = await service.remove(supplier.id, user);
    expect(res).toMatchObject({ isActive: false, archived: true });
    expect(tx.supplier.delete).not.toHaveBeenCalled();
    expect(tx.supplier.update).toHaveBeenCalledWith({
      where: { id: supplier.id },
      data: expect.objectContaining({
        isActive: false,
        archivedBy: 'USR-1',
      }),
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SUPPLIER_ARCHIVED' }),
      tx,
    );
  });

  it('deletes physically only when supplier has zero linked orders or items', async () => {
    const { tx, audit, service } = setup();
    const res = await service.remove(supplier.id, user);
    expect(res).toMatchObject({ archived: false });
    expect(tx.supplier.delete).toHaveBeenCalledWith({
      where: { id: supplier.id },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SUPPLIER_DELETED' }),
      tx,
    );
  });

  it('restores an archived supplier', async () => {
    const { tx, audit, service } = setup();
    tx.supplier.update.mockResolvedValue({ ...supplier, isActive: true });
    const res = await service.restore(supplier.id, user);
    expect(res).toMatchObject({ isActive: true });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SUPPLIER_RESTORED' }),
    );
  });
});
