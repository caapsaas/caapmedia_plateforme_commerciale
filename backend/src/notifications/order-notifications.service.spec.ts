import { Logger } from '@nestjs/common';
import {
  NotificationType,
  OrderStatus,
  ProductionStatus,
  UserRole,
} from '@prisma/client';
import { OrderNotificationsService } from './order-notifications.service';
import { NotificationsService } from './notifications.service';

describe('Order event recipients', () => {
  const notifyUsersByRole = jest.fn();
  const service = new OrderNotificationsService({
    notifyUsersByRole,
  } as unknown as NotificationsService);
  const order = { id: 'order', subsidiaryId: 'branch' };
  beforeEach(() => {
    jest.clearAllMocks();
    notifyUsersByRole.mockResolvedValue([]);
  });

  it('notifies production, sales and administration of new orders in their subsidiary', async () => {
    await service.created(order);
    for (const role of [
      UserRole.ADMIN,
      UserRole.COMMERCIAL,
      UserRole.PRODUCTION_DIRECTOR,
    ]) {
      expect(notifyUsersByRole).toHaveBeenCalledWith(
        'branch',
        role,
        expect.objectContaining({
          type: NotificationType.NEW_ORDER,
          orderId: 'order',
        }),
      );
    }
  });

  it.each([OrderStatus.PENDING_DELIVERY, OrderStatus.DELIVERED])(
    'publishes the delivery event for %s',
    async (status) => {
      await service.statusChanged(order, status, OrderStatus.IN_PRODUCTION);
      expect(notifyUsersByRole).toHaveBeenCalledWith(
        'branch',
        UserRole.COMMERCIAL,
        expect.objectContaining({
          type: NotificationType.ORDER_STATUS,
          data: {
            event: 'order.delivery',
            previousStatus: OrderStatus.IN_PRODUCTION,
            status,
            orderId: 'order',
            subsidiaryId: 'branch',
          },
        }),
      );
      expect(notifyUsersByRole).toHaveBeenCalledWith(
        'branch',
        UserRole.CAISSIER,
        expect.anything(),
      );
    },
  );

  it('does not notify for an unchanged status', async () => {
    await service.statusChanged(
      order,
      OrderStatus.IN_PRODUCTION,
      OrderStatus.IN_PRODUCTION,
    );
    expect(notifyUsersByRole).not.toHaveBeenCalled();
  });

  it('includes the production director in every order, payment, production and delivery event', async () => {
    const events = [
      () => service.created(order),
      () => service.paymentReceived(order),
      ...Object.values(ProductionStatus).map(
        (status) => () => service.productionChanged(order, status),
      ),
      ...Object.values(OrderStatus)
        .filter((status) => status !== OrderStatus.NEW)
        .map(
          (status) => () =>
            service.statusChanged(order, status, OrderStatus.NEW),
        ),
    ];
    for (const event of events) {
      notifyUsersByRole.mockClear();
      await event();
      expect(notifyUsersByRole).toHaveBeenCalledWith(
        'branch',
        UserRole.PRODUCTION_DIRECTOR,
        expect.objectContaining({
          orderId: 'order',
          data: expect.objectContaining({ subsidiaryId: 'branch' }) as unknown,
        }),
      );
    }
  });

  it('alerts the cashier when production is ready for delivery', async () => {
    await service.productionChanged(order, ProductionStatus.READY_FOR_DELIVERY);
    expect(notifyUsersByRole).toHaveBeenCalledWith(
      'branch',
      UserRole.CAISSIER,
      expect.objectContaining({
        data: expect.objectContaining({
          productionStatus: ProductionStatus.READY_FOR_DELIVERY,
        }) as unknown,
      }),
    );
  });

  it('notifies finance about payments without failing an already committed operation if delivery fails', async () => {
    const errorLog = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    notifyUsersByRole.mockRejectedValue(new Error('Notification failure'));
    try {
      await expect(service.paymentReceived(order)).resolves.toBeUndefined();
      expect(notifyUsersByRole).toHaveBeenCalledWith(
        'branch',
        UserRole.FINANCIAL_DIRECTOR,
        expect.objectContaining({ type: NotificationType.PAYMENT_RECEIVED }),
      );
      expect(errorLog).toHaveBeenCalled();
    } finally {
      errorLog.mockRestore();
    }
  });
});
