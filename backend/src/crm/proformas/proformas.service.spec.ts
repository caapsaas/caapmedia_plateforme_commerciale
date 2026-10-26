import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProformaStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ProformasService } from './proformas.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

const local: JwtUser = {
  id: 'staff',
  email: 'staff@example.test',
  role: UserRole.ADMIN,
  activeRole: UserRole.ADMIN,
  roles: [UserRole.ADMIN],
  subsidiaryId: 'A',
};
const globalUser: JwtUser = { ...local, roles: [UserRole.SUPER_ADMIN] };
const record = {
  id: 'quote',
  subsidiaryId: 'B',
  status: ProformaStatus.DRAFT,
  taxRate: new Decimal(19.25),
  subtotal: new Decimal(200),
  taxAmount: new Decimal(38.5),
  totalAmount: new Decimal(238.5),
  clientName: 'Client',
  clientEmail: 'client@example.test',
  validityDate: new Date('2026-11-26'),
  items: [{ productId: 'product', quantity: 2, unitPrice: new Decimal(100) }],
};

describe('Proforma subsidiary isolation', () => {
  const proforma = {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  };
  const lead = { findUnique: jest.fn() };
  const tx = {
    proforma: { updateMany: jest.fn(), findUniqueOrThrow: jest.fn() },
    order: { create: jest.fn() },
    contact: { findUnique: jest.fn() },
    taxRate: { findFirstOrThrow: jest.fn() },
  };
  const prisma = {
    proforma,
    lead,
    $transaction: jest.fn((callback: (client: unknown) => unknown) =>
      callback(tx),
    ),
  };
  const service = new ProformasService(prisma as unknown as PrismaService);
  beforeEach(() => {
    jest.clearAllMocks();
    proforma.findUnique.mockImplementation(
      ({ where }: { where: { subsidiaryId?: string } }) =>
        Promise.resolve(
          !where.subsidiaryId || where.subsidiaryId === record.subsidiaryId
            ? record
            : null,
        ),
    );
    proforma.count.mockResolvedValue(0);
  });

  it.each(['read', 'update', 'send', 'view', 'accept', 'reject', 'delete'])(
    'rejects a foreign proforma %s before side effects',
    async (action) => {
      const operation =
        action === 'read'
          ? service.findOne('quote', local)
          : action === 'update'
            ? service.update('quote', { notes: 'changed' }, local)
            : action === 'send'
              ? service.send('quote', local)
              : action === 'view'
                ? service.markAsViewed('quote', local)
                : action === 'accept'
                  ? service.accept('quote', local)
                  : action === 'reject'
                    ? service.reject('quote', local)
                    : service.remove('quote', local);
      await expect(operation).rejects.toBeInstanceOf(NotFoundException);
      expect(proforma.update).not.toHaveBeenCalled();
      expect(proforma.delete).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );
  it('uses safe creator selections in detail responses', async () => {
    await service.findOne('quote', globalUser);
    expect(proforma.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          createdByUser: { select: { id: true, userName: true, email: true } },
        }) as unknown,
      }),
    );
  });
  it('replaces items atomically under subsidiary and draft predicates, including zero tax', async () => {
    await service.update(
      'quote',
      {
        taxRate: 0,
        items: [{ productId: 'product', quantity: 3, unitPrice: 20 }],
      },
      { ...local, subsidiaryId: 'B' },
    );
    expect(proforma.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'quote', subsidiaryId: 'B', status: ProformaStatus.DRAFT },
        data: expect.objectContaining({
          subtotal: 60,
          taxAmount: 0,
          totalAmount: 60,
          items: {
            deleteMany: {},
            create: [
              expect.objectContaining({
                productId: 'product',
                quantity: 3,
                unitPrice: 20,
              }) as unknown,
            ],
          },
        }) as unknown,
      }),
    );
  });
  it('recalculates totals when only the tax rate changes', async () => {
    await service.update('quote', { taxRate: 0 }, globalUser);
    expect(proforma.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 200,
          taxAmount: 0,
          totalAmount: 200,
        }) as unknown,
      }),
    );
  });
  it('scopes status counters and supports consolidated access', async () => {
    await service.getStatusCounts(local);
    expect(proforma.count).toHaveBeenCalledWith({
      where: { subsidiaryId: 'A' },
    });
    proforma.count.mockClear();
    await service.getStatusCounts(globalUser);
    expect(proforma.count).toHaveBeenCalledWith({ where: {} });
  });
  it('rejects a lead from another subsidiary at creation', async () => {
    lead.findUnique.mockResolvedValue(null);
    await expect(
      service.create(
        {
          leadId: 'foreign',
          clientName: 'Client',
          clientEmail: 'client@example.test',
          clientPhone: '000',
          taxRate: 0,
          items: [],
        },
        local,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(lead.findUnique).toHaveBeenCalledWith({
      where: { id: 'foreign', subsidiaryId: 'A' },
    });
  });
  it('does not create an order when another request already converted the proforma', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.SENT,
    });
    tx.proforma.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.accept('quote', globalUser)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(tx.contact.findUnique).not.toHaveBeenCalled();
  });
  it('creates a super administrator quote in the authorized lead subsidiary', async () => {
    lead.findUnique.mockResolvedValue({ id: 'lead-B', subsidiaryId: 'B' });
    proforma.create.mockResolvedValue(record);
    await service.create(
      {
        leadId: 'lead-B',
        clientName: 'Client',
        clientEmail: 'client@example.test',
        clientPhone: '000',
        taxRate: 0,
        items: [{ productId: 'product', quantity: 1, unitPrice: 100 }],
      },
      globalUser,
    );
    expect(proforma.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subsidiaryId: 'B',
          createdBy: 'staff',
        }) as unknown,
      }),
    );
  });
  it('keeps the source subsidiary when a super administrator converts a foreign quote', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.SENT,
    });
    tx.proforma.updateMany.mockResolvedValue({ count: 1 });
    tx.contact.findUnique.mockResolvedValue({ id: 'customer' });
    tx.taxRate.findFirstOrThrow.mockResolvedValue({ id: 'tax' });
    tx.order.create.mockResolvedValue({ id: 'new-order' });
    tx.proforma.findUniqueOrThrow.mockResolvedValue({
      id: 'quote',
      status: ProformaStatus.CONVERTED,
    });
    await expect(service.accept('quote', globalUser)).resolves.toEqual({
      id: 'quote',
      status: ProformaStatus.CONVERTED,
      orderId: 'new-order',
    });
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subsidiaryId: 'B',
          customerId: 'customer',
        }) as unknown,
      }),
    );
  });
  it.each([
    ProformaStatus.CONVERTED,
    ProformaStatus.REJECTED,
    ProformaStatus.ACCEPTED,
  ])('does not reopen a terminal proforma as viewed (%s)', async (status) => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status,
      viewedAt: null,
    });
    await expect(
      service.markAsViewed('quote', globalUser),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(proforma.update).not.toHaveBeenCalled();
  });
});
