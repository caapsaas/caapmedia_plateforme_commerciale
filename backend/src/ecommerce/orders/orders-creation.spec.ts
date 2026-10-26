import { NotFoundException } from '@nestjs/common';
import { CustomerPaymentMethod, OrderSource } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';

describe('Order creation with repeated services', () => {
  const create = jest.fn();
  const findMany = jest.fn();
  const getFormDefinition = jest.fn();
  const validateAgainstDefinition = jest.fn();
  const tx = { order: { create } };
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
  });
});
