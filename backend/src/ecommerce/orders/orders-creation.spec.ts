import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CustomerPaymentMethod, OrderSource } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';

describe('Order creation with repeated services', () => {
  const create = jest.fn();
  const findMany = jest.fn();
  const getFormDefinition = jest.fn();
  const validateAgainstDefinition = jest.fn();
  const notifyCreated = jest.fn();
  const tx = {
    contact: {
      create: jest.fn().mockResolvedValue({ id: 'occasional' }),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    order: { create },
    orderItemProductionSummary: { create: jest.fn() },
  };
  const prisma = {
    item: { findMany },
    taxRate: {
      findFirstOrThrow: jest
        .fn()
        .mockResolvedValue({ id: 'tax', rate: new Decimal(0) }),
    },
    contact: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'customer' }),
    },
    $transaction: jest.fn((callback: (transaction: unknown) => unknown) =>
      callback(tx),
    ),
  };
  const service = new OrdersService(
    prisma as unknown as PrismaService,
    {
      getFormDefinition,
      validateAgainstDefinition,
    } as unknown as ProductSpecsService,
    { created: notifyCreated } as unknown as OrderNotificationsService,
  );
  const draft = {
    customerId: 'customer',
    customerName: 'Client',
    paymentDueDate: '2026-11-26',
    paymentMethod: CustomerPaymentMethod.PAY_ON_DELIVERY,
    source: OrderSource.MANUAL,
    items: [
      {
        productId: 'service',
        quantity: 2,
        unitPrice: 100,
        specValues: { format: 'A4' },
      },
      {
        productId: 'service',
        quantity: 3,
        unitPrice: 150,
        specValues: { format: 'A3' },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findMany.mockResolvedValue([{ id: 'service' }]);
    getFormDefinition.mockResolvedValue({ groups: [] });
    create.mockResolvedValue({
      id: 'order',
      orderItems: [{ id: 'line-a' }, { id: 'line-b' }],
    });
  });

  it('accepts distinct configurations of the same service and preserves both lines', async () => {
    await service.createBySalesRep(draft, {
      id: 'staff',
      subsidiaryId: 'branch',
    });
    expect(getFormDefinition).toHaveBeenCalledTimes(1);
    expect(validateAgainstDefinition).toHaveBeenCalledTimes(2);
    expect(validateAgainstDefinition).toHaveBeenNthCalledWith(
      1,
      { groups: [] },
      { format: 'A4' },
    );
    expect(validateAgainstDefinition).toHaveBeenNthCalledWith(
      2,
      { groups: [] },
      { format: 'A3' },
    );
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subtotal: new Decimal(650),
        salesRepId: 'staff',
        orderItems: {
          create: [
            expect.objectContaining({
              quantity: 2,
              total: new Decimal(200),
            }) as unknown,
            expect.objectContaining({
              quantity: 3,
              total: new Decimal(450),
            }) as unknown,
          ],
        },
      }) as unknown,
      include: { orderItems: { include: { product: true } } },
    });
  });

  it('still rejects a missing service before creating an order', async () => {
    findMany.mockResolvedValue([]);
    await expect(
      service.createBySalesRep(draft, { subsidiaryId: 'branch' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(create).not.toHaveBeenCalled();
    expect(notifyCreated).not.toHaveBeenCalled();
  });

  it('only notifies after the order transaction commits', async () => {
    let releaseCommit!: () => void;
    let reachedCommit!: () => void;
    const commitReached = new Promise<void>((resolve) => {
      reachedCommit = resolve;
    });
    const commit = new Promise<void>((resolve) => {
      releaseCommit = resolve;
    });
    prisma.$transaction.mockImplementationOnce(async (callback) => {
      const result = await callback(tx);
      reachedCommit();
      await commit;
      return result;
    });
    const operation = service.createBySalesRep(draft, {
      id: 'staff',
      subsidiaryId: 'branch',
    });
    await commitReached;
    expect(notifyCreated).not.toHaveBeenCalled();
    releaseCommit();
    await operation;
    expect(notifyCreated).toHaveBeenCalledTimes(1);
  });

  it('does not notify when the order transaction rolls back', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('Rollback'));
    await expect(
      service.createBySalesRep(draft, { id: 'staff', subsidiaryId: 'branch' }),
    ).rejects.toThrow('Rollback');
    expect(notifyCreated).not.toHaveBeenCalled();
  });

  it.each([undefined, 0, 125.5])(
    'persists assembly fee %s and includes it once in the line total',
    async (assemblyPrice) => {
      await service.createBySalesRep(
        {
          ...draft,
          items: [
            {
              ...draft.items[0],
              discount: 10,
              assemblyPrice,
              options: [{ optionType: 'format', optionValue: 'A4' }],
            },
          ],
        },
        { id: 'staff', subsidiaryId: 'branch' },
      );
      const total = new Decimal(190).add(assemblyPrice ?? 0);
      expect(create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subtotal: total,
          orderItems: {
            create: [
              expect.objectContaining({
                assemblyPrice:
                  assemblyPrice == null ? null : new Decimal(assemblyPrice),
                total,
                productOptions: {
                  create: [
                    expect.objectContaining({
                      optionType: 'format',
                      optionValue: 'A4',
                    }) as unknown,
                  ],
                },
              }) as unknown,
            ],
          },
        }) as unknown,
        include: { orderItems: { include: { product: true } } },
      });
    },
  );

  it.each([5, 150])(
    'creates production orders with an indicative margin of %s%% and no configuration',
    async (marginPercent) => {
      await service.createBySalesRep(
        {
          ...draft,
          items: [
            {
              ...draft.items[0],
              productionSummary: {
                totalProductionCost: 100,
                marginPercent,
                finalPrice: 100 + marginPercent,
              },
            },
          ],
        },
        { id: 'staff', subsidiaryId: 'branch' },
      );
      expect(create).toHaveBeenCalled();
      expect(tx.orderItemProductionSummary.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          marginPercent: new Decimal(marginPercent),
        }) as unknown,
      });
    },
  );
  it('creates an occasional contact in the order transaction without an email or portal access', async () => {
    await service.createBySalesRep(
      {
        ...draft,
        customerId: undefined,
        occasionalCustomer: {
          name: 'Client de passage',
          phone: '+237 699000000',
        },
      },
      { id: 'staff', subsidiaryId: 'branch' },
    );
    expect(prisma.contact.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(tx.contact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactName: 'Client de passage',
        phone: '+237 699000000',
        email: null,
        isOccasional: true,
        isVerified: false,
        subsidiaryId: 'branch',
        salesRepId: 'staff',
      }) as unknown,
    });
    const data = (
      tx.contact.create.mock.calls as unknown as [
        { data: Record<string, unknown> },
      ][]
    )[0][0].data;
    expect(data).not.toHaveProperty('passwordHash');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'occasional',
          customerName: 'Client de passage',
          subsidiaryId: 'branch',
        }) as unknown,
      }),
    );
    expect(notifyCreated).toHaveBeenCalledTimes(1);
  });

  it('rejects ambiguous customer selection before creating any contact', async () => {
    await expect(
      service.createBySalesRep(
        {
          ...draft,
          occasionalCustomer: { name: 'Client', phone: '699000000' },
        },
        { id: 'staff', subsidiaryId: 'branch' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.contact.create).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('requires either an existing or an occasional customer', async () => {
    await expect(
      service.createBySalesRep(
        { ...draft, customerId: undefined },
        { id: 'staff', subsidiaryId: 'branch' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.contact.create).not.toHaveBeenCalled();
  });

  it('requires a subsidiary for occasional orders', async () => {
    await expect(
      service.createBySalesRep(
        {
          ...draft,
          customerId: undefined,
          occasionalCustomer: { name: 'Client', phone: '699000000' },
        },
        { id: 'staff' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.contact.create).not.toHaveBeenCalled();
  });

  it('rejects an existing email instead of duplicating or silently linking a customer', async () => {
    tx.contact.findUnique.mockResolvedValueOnce({ id: 'existing' });
    await expect(
      service.createBySalesRep(
        {
          ...draft,
          customerId: undefined,
          occasionalCustomer: {
            name: 'Client',
            phone: '699000000',
            email: 'client@example.com',
          },
        },
        { id: 'staff', subsidiaryId: 'branch' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.contact.create).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an invalid order before creating an occasional contact', async () => {
    findMany.mockResolvedValueOnce([]);
    await expect(
      service.createBySalesRep(
        {
          ...draft,
          customerId: undefined,
          occasionalCustomer: { name: 'Client', phone: '699000000' },
        },
        { id: 'staff', subsidiaryId: 'branch' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.contact.create).not.toHaveBeenCalled();
  });
  it('returns authoritative document amounts, product names and the chosen payment method after creation', async () => {
    create.mockResolvedValueOnce({
      id: 'order',
      orderDate: new Date('2026-11-02T10:00:00Z'),
      customerName: 'Client',
      customerId: 'customer',
      subtotal: new Decimal('2300.50'),
      taxAmount: new Decimal('442.85'),
      totalAmount: new Decimal('2743.35'),
      paymentMethod: CustomerPaymentMethod.ORANGE_MONEY,
      orderItems: [
        {
          id: 'line-a',
          quantity: 2,
          unitPrice: new Decimal('1200.25'),
          discount: new Decimal('150'),
          assemblyPrice: new Decimal('50'),
          total: new Decimal('2300.50'),
          product: { id: 'service', name: 'Impression couleur A3' },
        },
      ],
    });
    const result = await service.createBySalesRep(
      {
        ...draft,
        items: [draft.items[0]],
        paymentMethod: CustomerPaymentMethod.ORANGE_MONEY,
      },
      { id: 'staff', subsidiaryId: 'branch' },
    );
    expect(result.totalAmount).toBe(2743.35);
    expect(result.paymentMethod).toBe(CustomerPaymentMethod.ORANGE_MONEY);
    expect(result.orderItems).toEqual([
      expect.objectContaining({
        productName: 'Impression couleur A3',
        unitPrice: 1200.25,
        quantity: 2,
        total: 2300.5,
      }) as unknown,
    ]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentMethod: CustomerPaymentMethod.ORANGE_MONEY,
        }) as unknown,
      }),
    );
  });
});
