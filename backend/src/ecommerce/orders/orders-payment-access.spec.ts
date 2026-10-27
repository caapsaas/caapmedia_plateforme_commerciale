/* eslint-disable @typescript-eslint/unbound-method -- Reflection inspects handler identity without invoking it. */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';

describe('Order payment permissions', () => {
  it.each([UserRole.COMMERCIAL, UserRole.CAISSIER, UserRole.ADMIN])(
    'allows active role %s to collect payments and list payment accounts',
    (role) => {
      const guard = new RoleGuard(new Reflector());
      for (const handler of [
        OrdersController.prototype.recordPayment,
        OrdersController.prototype.findPaymentAccounts,
      ]) {
        const context = {
          getHandler: () => handler,
          getClass: () => OrdersController,
          switchToHttp: () => ({
            getRequest: () => ({
              user: { id: 'staff', activeRole: role, userRole: role },
              method: 'PATCH',
              url: '/ecommerce/orders/payment/order',
            }),
          }),
        } as unknown as ExecutionContext;
        expect(guard.canActivate(context)).toBe(true);
      }
    },
  );

  it('rejects collection when the active role lacks payment permission', () => {
    const context = {
      getHandler: () => OrdersController.prototype.recordPayment,
      getClass: () => OrdersController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'staff',
            activeRole: UserRole.PRODUCTION_DIRECTOR,
            additionalRoles: [UserRole.COMMERCIAL],
          },
          method: 'PATCH',
          url: '/ecommerce/orders/payment/order',
        }),
      }),
    } as unknown as ExecutionContext;
    expect(() => new RoleGuard(new Reflector()).canActivate(context)).toThrow(
      ForbiddenException,
    );
  });

  it('only exposes bank identifiers and names from the user subsidiary', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new OrdersService(
      { treasuryAccount: { findMany } } as unknown as PrismaService,
      {} as ProductSpecsService,
      {} as OrderNotificationsService,
    );
    await service.findPaymentAccounts({ subsidiaryId: 'branch' });
    expect(findMany).toHaveBeenCalledWith({
      where: { subsidiaryId: 'branch', accountType: 'BANQUE' },
      select: { id: true, accountName: true },
      orderBy: { accountName: 'asc' },
    });
    findMany.mockClear();
    await expect(service.findPaymentAccounts({})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findMany).not.toHaveBeenCalled();
  });
});
