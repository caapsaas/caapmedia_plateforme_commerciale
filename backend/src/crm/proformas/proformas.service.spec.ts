import { ProductSpecsService } from '../../ecommerce/products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, ProformaStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ProformasService } from './proformas.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

const conversion = { paymentDueDate: '2099-12-31' };

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
  createdBy: 'seller',
  subsidiaryId: 'B',
  status: ProformaStatus.DRAFT,
  taxRate: new Decimal(19.25),
  subtotal: new Decimal(200),
  taxAmount: new Decimal(38.5),
  totalAmount: new Decimal(238.5),
  clientName: 'Client',
  clientEmail: 'client@example.test',
  validityDate: new Date(Date.now() + 86_400_000),
  items: [
    {
      id: 'line',
      productId: 'product',
      quantity: 2,
      unitPrice: new Decimal(100),
    },
  ],
};

describe('Proforma subsidiary isolation', () => {
  const proforma = {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  };
  const lead = { findUnique: jest.fn() };
  const tx = {
    proforma: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
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
  const notificationEvents = { created: jest.fn() };
  const specs = {
    getFormDefinition: jest
      .fn()
      .mockResolvedValue({ groups: [], ungroupedSpecifications: [] }),
    validateAgainstDefinition: jest.fn(),
  };
  const service = new ProformasService(
    prisma as unknown as PrismaService,
    notificationEvents as unknown as OrderNotificationsService,
    specs as unknown as ProductSpecsService,
  );
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

  it.each([
    'read',
    'update',
    'send',
    'view',
    'accept',
    'convert',
    'reject',
    'delete',
  ])('rejects a foreign proforma %s before side effects', async (action) => {
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
                : action === 'convert'
                  ? service.convert('quote', local, conversion)
                  : action === 'reject'
                    ? service.reject('quote', local)
                    : service.remove('quote', local);
    await expect(operation).rejects.toBeInstanceOf(NotFoundException);
    expect(proforma.update).not.toHaveBeenCalled();
    expect(proforma.delete).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('uses safe creator selections in detail responses', async () => {
    await service.findOne('quote', globalUser);
    expect(proforma.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          createdByUser: {
            select: {
              id: true,
              userName: true,
              email: true,
              subsidiaryId: true,
            },
          },
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
  it('records acceptance without creating an order', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.VIEWED,
    });
    await service.accept('quote', { ...local, subsidiaryId: 'B' });

    expect(proforma.update).toHaveBeenCalledWith({
      where: {
        id: 'quote',
        subsidiaryId: 'B',
        status: { in: [ProformaStatus.SENT, ProformaStatus.VIEWED] },
        validityDate: { gt: expect.any(Date) as Date },
      },
      data: {
        status: ProformaStatus.ACCEPTED,
        acceptedAt: expect.any(Date) as Date,
      },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('prevents acceptance after the validity date', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.SENT,
      validityDate: new Date(0),
    });
    const user = { ...local, subsidiaryId: 'B' };
    await expect(service.findOne('quote', user)).resolves.toMatchObject({
      status: ProformaStatus.EXPIRED,
    });
    await expect(service.accept('quote', user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(proforma.update).not.toHaveBeenCalled();
  });

  it('does not convert a proforma before it is accepted', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.SENT,
    });
    await expect(
      service.convert('quote', globalUser, conversion),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not create an order when another request already converted the proforma', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.ACCEPTED,
    });
    tx.proforma.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.convert('quote', globalUser, conversion),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(tx.contact.findUnique).not.toHaveBeenCalled();
  });

  it('validates production specifications before claiming the accepted proforma', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.ACCEPTED,
    });
    specs.validateAgainstDefinition.mockImplementationOnce(() => {
      throw new BadRequestException('Spécifications invalides');
    });
    await expect(
      service.convert('quote', globalUser, {
        ...conversion,
        items: [{ id: 'line', specValues: { format: 'A3' } }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(specs.validateAgainstDefinition).toHaveBeenCalledWith(
      { groups: [], ungroupedSpecifications: [] },
      { format: 'A3' },
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('keeps the accepted price and attaches specifications and artwork to their original line', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.ACCEPTED,
    });
    tx.proforma.updateMany.mockResolvedValue({ count: 1 });
    tx.contact.findUnique.mockResolvedValue({ id: 'customer' });
    tx.taxRate.findFirstOrThrow.mockResolvedValue({ id: 'tax' });
    tx.order.create.mockResolvedValue({ id: 'new-order' });
    tx.proforma.update.mockResolvedValue({ id: 'quote', orderId: 'new-order' });
    const file = {
      originalname: 'artwork.pdf',
      filename: 'B/upload.pdf',
    } as Express.Multer.File;
    await service.convert(
      'quote',
      globalUser,
      {
        ...conversion,
        items: [
          { id: 'line', specValues: { format: 'A3' }, designFileIndex: 0 },
        ],
      },
      [file],
    );
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: record.totalAmount,
          orderItems: {
            create: [
              expect.objectContaining({
                unitPrice: record.items[0].unitPrice,
                specValues: { format: 'A3' },
                specSnapshot: { groups: [], ungroupedSpecifications: [] },
                designFileUrl: '/public/order_item_img/B/upload.pdf',
              }),
            ],
          },
        }),
      }),
    );
  });

  it('returns the linked order on retry without creating or notifying again', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.CONVERTED,
      orderId: 'existing-order',
    });
    await expect(
      service.convert('quote', globalUser, conversion),
    ).resolves.toMatchObject({
      orderId: 'existing-order',
    });
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(notificationEvents.created).not.toHaveBeenCalled();
  });

  it('returns the winning order when another conversion commits first', async () => {
    proforma.findUnique.mockResolvedValue({
      ...record,
      status: ProformaStatus.ACCEPTED,
    });
    tx.proforma.updateMany.mockResolvedValue({ count: 0 });
    tx.proforma.findUnique.mockResolvedValueOnce({
      ...record,
      status: ProformaStatus.CONVERTED,
      orderId: 'existing-order',
    });
    await expect(
      service.convert('quote', globalUser, conversion),
    ).resolves.toMatchObject({
      orderId: 'existing-order',
    });
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(notificationEvents.created).not.toHaveBeenCalled();
  });

  it('blocks quote creation in super administrator read-only mode', async () => {
    await expect(
      service.create(
        {
          leadId: 'lead-B',
          clientName: 'Client',
          clientEmail: 'client@example.test',
          clientPhone: '000',
          taxRate: 0,
          items: [{ productId: 'product', quantity: 1, unitPrice: 100 }],
        },
        globalUser,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(proforma.create).not.toHaveBeenCalled();
  });
  it.each(['A', 'B'])(
    'keeps the source subsidiary and scopes the creator from branch %s when converting a quote',
    async (creatorBranch) => {
      proforma.findUnique.mockResolvedValue({
        ...record,
        createdByUser: { id: 'seller', subsidiaryId: creatorBranch },
        status: ProformaStatus.ACCEPTED,
      });
      tx.proforma.updateMany.mockResolvedValue({ count: 1 });
      tx.contact.findUnique.mockResolvedValue({ id: 'customer' });
      tx.taxRate.findFirstOrThrow.mockResolvedValue({ id: 'tax' });
      tx.order.create.mockResolvedValue({ id: 'new-order' });
      tx.proforma.update.mockResolvedValue({
        id: 'quote',
        status: ProformaStatus.CONVERTED,
        orderId: 'new-order',
      });
      await expect(
        service.convert('quote', globalUser, conversion),
      ).resolves.toEqual({
        id: 'quote',
        status: ProformaStatus.CONVERTED,
        orderId: 'new-order',
      });
      expect(tx.proforma.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { orderId: 'new-order' } }),
      );
      expect(notificationEvents.created).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'new-order' }),
      );
      expect(tx.proforma.update.mock.invocationCallOrder[0]).toBeLessThan(
        notificationEvents.created.mock.invocationCallOrder[0],
      );
      expect(tx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subsidiaryId: 'B',
            customerId: 'customer',
            salesRepId: creatorBranch === 'B' ? 'seller' : null,
            status: OrderStatus.PENDING_VALIDATION,
            paymentDueDate: new Date(conversion.paymentDueDate),
          }) as unknown,
        }),
      );
    },
  );
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
