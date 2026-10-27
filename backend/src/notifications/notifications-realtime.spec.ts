import { UserRole, NotificationType } from '@prisma/client';
import { NotificationsSseService } from './notifications-sse.service';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../common/utils/prisma/prisma.service';

describe('Notification persistence and realtime delivery', () => {
  it('delivers production notifications when the production director role is active', () => {
    const sse = new NotificationsSseService();
    const delivered = jest.fn();
    const subscription = sse
      .subscribe('production-director', UserRole.PRODUCTION_DIRECTOR)
      .subscribe(delivered);
    try {
      sse.push('production-director', {
        id: 'other-role',
        targetRole: UserRole.CAISSIER,
      });
      expect(delivered).not.toHaveBeenCalled();
      const notification = {
        id: 'production-payment',
        targetRole: UserRole.PRODUCTION_DIRECTOR,
      };
      sse.push('production-director', notification);
      expect(delivered).toHaveBeenCalledTimes(1);
      expect(delivered).toHaveBeenCalledWith({
        type: 'notification',
        data: notification,
      });
    } finally {
      subscription.unsubscribe();
    }
  });
  it('persists a notification before publishing it to the matching user and role', async () => {
    const sse = new NotificationsSseService();
    const delivered = jest.fn();
    const wrongRole = jest.fn();
    const wrongUser = jest.fn();
    const subscriptions = [
      sse.subscribe('cashier', UserRole.CAISSIER).subscribe(delivered),
      sse.subscribe('cashier', UserRole.COMMERCIAL).subscribe(wrongRole),
      sse.subscribe('other-user', UserRole.CAISSIER).subscribe(wrongUser),
    ];
    const notification = { id: 'notification', targetRole: UserRole.CAISSIER };
    const create = jest.fn().mockImplementation(() => {
      expect(delivered).not.toHaveBeenCalled();
      return Promise.resolve(notification);
    });
    const service = new NotificationsService(
      { notification: { create } } as unknown as PrismaService,
      sse,
    );
    try {
      await service.notifyUser('cashier', {
        title: 'Livraison',
        message: 'Commande prête',
        type: NotificationType.ORDER_STATUS,
        targetRole: UserRole.CAISSIER,
      });
      expect(delivered).toHaveBeenCalledWith({
        type: 'notification',
        data: notification,
      });
      expect(wrongRole).not.toHaveBeenCalled();
      expect(wrongUser).not.toHaveBeenCalled();
      sse.push('cashier', { id: 'common', targetRole: null });
      expect(delivered).toHaveBeenCalledTimes(2);
      expect(wrongRole).toHaveBeenCalledTimes(1);
    } finally {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
  });

  it('does not push when persistence fails', async () => {
    const sse = new NotificationsSseService();
    const delivered = jest.fn();
    const subscription = sse
      .subscribe('user', UserRole.COMMERCIAL)
      .subscribe(delivered);
    const service = new NotificationsService(
      {
        notification: {
          create: jest
            .fn()
            .mockRejectedValue(new Error('Database unavailable')),
        },
      } as unknown as PrismaService,
      sse,
    );
    try {
      await expect(
        service.notifyUser('user', {
          title: 'Commande',
          message: 'Nouvelle',
          type: NotificationType.NEW_ORDER,
        }),
      ).rejects.toThrow('Database unavailable');
      expect(delivered).not.toHaveBeenCalled();
    } finally {
      subscription.unsubscribe();
    }
  });

  it('selects recipients by subsidiary and any assigned role', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 'cashier' }]);
    const create = jest.fn().mockResolvedValue({ id: 'notification' });
    const service = new NotificationsService(
      {
        user: { findMany },
        notification: { create },
      } as unknown as PrismaService,
      new NotificationsSseService(),
    );
    await service.notifyUsersByRole('branch', UserRole.CAISSIER, {
      title: 'Livraison',
      message: 'Prête',
      type: NotificationType.ORDER_STATUS,
    });
    expect(findMany).toHaveBeenCalledWith({
      where: {
        subsidiaryId: 'branch',
        OR: [
          { userRole: UserRole.CAISSIER },
          { roles: { has: UserRole.CAISSIER } },
          { additionalRoles: { has: UserRole.CAISSIER } },
        ],
      },
      select: { id: true },
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipientId: 'cashier',
        targetRole: UserRole.CAISSIER,
      }) as unknown,
    });
  });
});
