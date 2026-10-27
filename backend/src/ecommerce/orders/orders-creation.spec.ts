import { NotFoundException } from '@nestjs/common';
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
      include: { orderItems: true },
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
        include: { orderItems: true },
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
});
