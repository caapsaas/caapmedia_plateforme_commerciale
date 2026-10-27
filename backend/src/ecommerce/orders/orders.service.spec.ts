import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CustomerPaymentMethod } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';

describe('OrdersService access control', () => {
  let service: OrdersService;
  const order = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  };
  const orderGroup = { findMany: jest.fn() };
  const prisma = {
    order,
    orderGroup,
    $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
      callback({ order }),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(
      prisma as unknown as PrismaService,
      {} as ProductSpecsService,
      {} as OrderNotificationsService,
    );
  });

  it('rejects another customer before querying their orders', async () => {
    await expect(
      service.findGroupsByCustomer('victim', { id: 'attacker' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(order.findMany).not.toHaveBeenCalled();
    expect(orderGroup.findMany).not.toHaveBeenCalled();
  });

  it('allows a global customer to see their own orders across subsidiaries', async () => {
    orderGroup.findMany.mockResolvedValue([]);
    order.findMany.mockResolvedValue([]);
    await expect(
      service.findGroupsByCustomer('customer', { id: 'customer' }),
    ).resolves.toEqual([]);
    expect(order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: 'customer', groupId: null },
      }),
    );
  });

  it('scopes individual customer orders by ownership, not their original subsidiary', async () => {
    order.findUnique.mockResolvedValue(null);
    await expect(
      service.findOneForCustomer('order', { id: 'customer' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order', customerId: 'customer' },
      }),
    );
  });

  it('does not select authentication secrets in customer order responses', async () => {
    order.findUnique.mockResolvedValue({ id: 'order', orderItems: [] });
    await service.findOneForCustomer('order', { id: 'customer' });
    expect(order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          customer: {
            select: {
              id: true,
              contactName: true,
              company: true,
              email: true,
              phone: true,
              address: true,
              subsidiaryId: true,
            },
          },
          salesRep: {
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

  it('uses safe relation selections for the staff order list', async () => {
    order.findMany.mockResolvedValue([]);
    await service.findAll({ subsidiaryId: 'branch' }, {});
    expect(order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          customer: {
            select: {
              id: true,
              contactName: true,
              company: true,
              email: true,
              phone: true,
              address: true,
              subsidiaryId: true,
            },
          },
          salesRep: {
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

  it('rejects a payment on an order outside the staff subsidiary without mutation', async () => {
    order.findUnique.mockResolvedValue(null);
    await expect(
      service.recordPayment(
        'foreign-order',
        {
          amount: 100,
          paymentMethod: CustomerPaymentMethod.CASH,
        },
        { subsidiaryId: 'branch' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'foreign-order', subsidiaryId: 'branch' },
      }),
    );
    expect(order.updateMany).not.toHaveBeenCalled();
  });

  it('rejects payment identities missing a subsidiary', async () => {
    await expect(
      service.recordPayment(
        'order',
        {
          amount: 100,
          paymentMethod: CustomerPaymentMethod.CASH,
        },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(order.findUnique).not.toHaveBeenCalled();
  });
});
