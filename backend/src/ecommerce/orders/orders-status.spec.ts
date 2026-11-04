import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  ProductionStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';

describe('Order cancellation after production', () => {
  const findUnique = jest.fn();
  const update = jest.fn();
  const statusChanged = jest.fn();
  const prisma = {
    order: { findUnique, update },
    $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
      callback({ order: { update } }),
    ),
  };
  const service = new OrdersService(
    prisma as unknown as PrismaService,
    {} as ProductSpecsService,
    { statusChanged } as unknown as OrderNotificationsService,
  );
  const user = { subsidiaryId: 'branch', activeRole: UserRole.ADMIN };
  const details = {
    productionStatus: ProductionStatus.PREPRESS,
    paymentStatus: PaymentStatus.UNPAID,
    amountPaid: new Decimal(0),
    totalAmount: new Decimal(100),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((callback) =>
      callback({ order: { update } }),
    );
  });

  it.each([
    OrderStatus.IN_PRODUCTION,
    OrderStatus.PENDING_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
  ])(
    'rejects cancellation and reverting %s to a pre-production state',
    async (status) => {
      findUnique.mockResolvedValue({ id: 'order', status, ...details });
      for (const target of [
        OrderStatus.CANCELLED,
        OrderStatus.NEW,
        OrderStatus.PENDING_VALIDATION,
      ]) {
        await expect(
          service.updateOrderStatus('order', { status: target }, user),
        ).rejects.toBeInstanceOf(ConflictException);
      }
      expect(update).not.toHaveBeenCalled();
      expect(statusChanged).not.toHaveBeenCalled();
    },
  );

  it.each([OrderStatus.NEW, OrderStatus.PENDING_VALIDATION])(
    'allows cancellation before production (%s)',
    async (status) => {
      findUnique.mockResolvedValue({ id: 'order', status, ...details });
      update.mockResolvedValue({ id: 'order', status: OrderStatus.CANCELLED });
      await service.updateOrderStatus(
        'order',
        { status: OrderStatus.CANCELLED },
        user,
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'order',
            subsidiaryId: 'branch',
            status,
          }) as unknown,
          data: { status: OrderStatus.CANCELLED },
        }),
      );
    },
  );

  it('allows normal progress after production', async () => {
    findUnique.mockResolvedValue({
      id: 'order',
      status: OrderStatus.IN_PRODUCTION,
      ...details,
      productionStatus: ProductionStatus.READY_FOR_DELIVERY,
    });
    update.mockResolvedValue({
      id: 'order',
      status: OrderStatus.PENDING_DELIVERY,
    });
    await expect(
      service.updateOrderStatus(
        'order',
        { status: OrderStatus.PENDING_DELIVERY },
        user,
      ),
    ).resolves.toEqual(
      expect.objectContaining({ status: OrderStatus.PENDING_DELIVERY }),
    );
    expect(statusChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order',
        status: OrderStatus.IN_PRODUCTION,
      }),
      OrderStatus.PENDING_DELIVERY,
      OrderStatus.IN_PRODUCTION,
    );
  });

  it('does not mutate an order outside the subsidiary', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      service.updateOrderStatus(
        'foreign',
        { status: OrderStatus.CANCELLED },
        user,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(update).not.toHaveBeenCalled();
  });

  it.each(['updateOrderStatus', 'rejectByProductionDirector'] as const)(
    'handles simultaneous production validation during %s',
    async (method) => {
      findUnique.mockResolvedValue({
        id: 'order',
        status: OrderStatus.PENDING_VALIDATION,
        ...details,
      });
      update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('State changed', {
          code: 'P2025',
          clientVersion: '6.19.3',
        }),
      );
      const operation =
        method === 'updateOrderStatus'
          ? service.updateOrderStatus(
              'order',
              { status: OrderStatus.CANCELLED },
              user,
            )
          : service.rejectByProductionDirector('order', user);
      await expect(operation).rejects.toBeInstanceOf(ConflictException);
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'order',
            subsidiaryId: 'branch',
            status: OrderStatus.PENDING_VALIDATION,
          }) as unknown,
        }),
      );
    },
  );
});
