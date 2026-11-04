import { ConflictException } from '@nestjs/common';
import {
  CustomerPaymentMethod,
  OrderStatus,
  PaymentStatus,
  ProductionStatus,
  UserRole,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';

describe('Order notification triggers', () => {
  const user = {
    id: 'cashier',
    subsidiaryId: 'branch',
    activeRole: UserRole.PRODUCTION_DIRECTOR,
  };
  const order = {
    id: 'order',
    subsidiaryId: 'branch',
    status: OrderStatus.PENDING_VALIDATION,
    productionStatus: ProductionStatus.FINISHING,
    amountPaid: new Decimal(0),
    totalAmount: new Decimal(100),
    orderItems: [],
  };

  function setup() {
    let committed = false;
    const updated = {
      ...order,
      status: OrderStatus.PENDING_VALIDATION,
      amountPaid: new Decimal(25),
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
    };
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        findUniqueOrThrow: jest.fn().mockResolvedValue(updated),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({
          ...order,
          productionStatus: ProductionStatus.READY_FOR_DELIVERY,
          status: OrderStatus.PENDING_DELIVERY,
        }),
      },
      orderProductionHistory: { create: jest.fn() },
    };
    const prisma = {
      order: tx.order,
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => unknown) => {
          const result = await callback(tx);
          committed = true;
          return result;
        },
      ),
    };
    const afterCommit = () => {
      expect(committed).toBe(true);
    };
    const notifications = {
      paymentReceived: jest.fn(afterCommit),
      statusChanged: jest.fn(afterCommit),
      productionChanged: jest.fn(afterCommit),
    };
    const service = new OrdersService(
      prisma as unknown as PrismaService,
      {} as ProductSpecsService,
      notifications as unknown as OrderNotificationsService,
    );
    return { service, tx, notifications };
  }

  it('notifies payment without starting production or changing order status', async () => {
    const { service, notifications, tx } = setup();
    const result = await service.recordPayment(
      'order',
      { amount: 25, paymentMethod: CustomerPaymentMethod.CASH },
      user,
    );
    expect(result.amountPaid).toBe(25);
    expect(notifications.paymentReceived).toHaveBeenCalledWith({
      id: 'order',
      subsidiaryId: 'branch',
    });
    expect(result.status).toBe(OrderStatus.PENDING_VALIDATION);
    expect(notifications.statusChanged).not.toHaveBeenCalled();
    const calls = tx.order.updateMany.mock.calls as unknown[][];
    const data = calls[0][0] as {
      data: Record<string, unknown>;
      where: Record<string, unknown>;
    };
    expect(data.data).not.toHaveProperty('status');
    expect(data.where).toEqual(
      expect.objectContaining({
        status: OrderStatus.PENDING_VALIDATION,
        subsidiaryId: 'branch',
      }),
    );
  });

  it('does not announce a payment rejected by the concurrent-update guard', async () => {
    const { service, tx, notifications } = setup();
    tx.order.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.recordPayment(
        'order',
        { amount: 25, paymentMethod: CustomerPaymentMethod.CASH },
        user,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(notifications.paymentReceived).not.toHaveBeenCalled();
    expect(notifications.statusChanged).not.toHaveBeenCalled();
  });

  it('announces readiness for delivery only after the production history is saved', async () => {
    const { service, tx, notifications } = setup();
    tx.order.findUnique.mockResolvedValue({
      ...order,
      status: OrderStatus.IN_PRODUCTION,
    });
    await service.updateProductionStatus(
      'order',
      { productionStatus: ProductionStatus.READY_FOR_DELIVERY },
      user,
    );
    expect(tx.orderProductionHistory.create).toHaveBeenCalled();
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'order',
          subsidiaryId: 'branch',
          status: OrderStatus.IN_PRODUCTION,
          productionStatus: ProductionStatus.FINISHING,
        },
        data: {
          productionStatus: ProductionStatus.READY_FOR_DELIVERY,
          status: OrderStatus.PENDING_DELIVERY,
        },
      }),
    );
    expect(notifications.productionChanged).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order', subsidiaryId: 'branch' }),
      ProductionStatus.READY_FOR_DELIVERY,
    );
  });

  it('does not announce readiness when the production transaction rolls back', async () => {
    const { service, tx, notifications } = setup();
    tx.order.findUnique.mockResolvedValue({
      ...order,
      status: OrderStatus.IN_PRODUCTION,
    });
    tx.orderProductionHistory.create.mockImplementation(() => {
      throw new Error('History write failed');
    });
    await expect(
      service.updateProductionStatus(
        'order',
        { productionStatus: ProductionStatus.READY_FOR_DELIVERY },
        user,
      ),
    ).rejects.toThrow('History write failed');
    expect(notifications.productionChanged).not.toHaveBeenCalled();
  });
});
