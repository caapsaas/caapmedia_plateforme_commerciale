import { EntriesService } from '../../accounting/entries/entries.service';
/* eslint-disable @typescript-eslint/unbound-method -- Reflection inspects handler identity without invoking it. */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SalesController } from '../sales/sales.controller';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { ProductionWorkflowsController } from '../production/production-workflows/production-workflows.controller';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';

function checkAccess(
  {
    controller,
    handler,
    method,
    url,
  }: {
    controller: object;
    handler: object;
    method: string;
    url: string;
  },
  activeRole: UserRole,
) {
  const context = {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          id: 'staff',
          activeRole,
          roles: [activeRole, UserRole.CAISSIER],
        },
        method,
        url,
      }),
    }),
  } as unknown as ExecutionContext;
  return new RoleGuard(new Reflector()).canActivate(context);
}

describe('Cashier order creation permissions', () => {
  it.each([
    {
      controller: OrdersController,
      handler: OrdersController.prototype.createBySalesRep,
      method: 'POST',
      url: '/ecommerce/orders/by-salesrep',
    },
    {
      controller: OrdersController,
      handler: OrdersController.prototype.createBySalesRepJson,
      method: 'POST',
      url: '/ecommerce/orders/by-salesrep/json',
    },
    {
      controller: ProductionWorkflowsController,
      handler: ProductionWorkflowsController.prototype.resolve,
      method: 'GET',
      url: '/production/workflows/resolve/product',
    },
  ])('allows the active cashier to use $method $url', (route) => {
    expect(checkAccess(route, UserRole.CAISSIER)).toBe(true);
    expect(() => checkAccess(route, UserRole.SECRETARY)).toThrow(
      ForbiddenException,
    );
  });
});

describe('Order payment permissions', () => {
  describe.each([
    {
      controller: OrdersController,
      handler: OrdersController.prototype.recordPayment,
      method: 'PATCH',
      url: '/ecommerce/orders/payment/order',
    },
    {
      controller: SalesController,
      handler: SalesController.prototype.createDirectSale,
      method: 'POST',
      url: '/ecommerce/sales/direct',
    },
  ])('$method $url', (route) => {
    it('allows the active cashier role to collect payments', () => {
      expect(checkAccess(route, UserRole.CAISSIER)).toBe(true);
    });

    it.each([UserRole.COMMERCIAL, UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      'rejects active role %s even when the cashier role is assigned',
      (role) => {
        expect(() => checkAccess(route, role)).toThrow(ForbiddenException);
      },
    );
  });

  it('exposes bank accounts and assigned registers from the user subsidiary', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new OrdersService(
      { treasuryAccount: { findMany } } as unknown as PrismaService,
      {} as ProductSpecsService,
      {} as OrderNotificationsService,
      {} as EntriesService,
    );
    await service.findPaymentAccounts({ id: 'staff', subsidiaryId: 'branch' });
    expect(findMany).toHaveBeenCalledWith({
      where: {
        subsidiaryId: 'branch',
        OR: [
          { accountType: 'BANQUE' },
          { accountType: 'CASH_REGISTER', cashierId: 'staff' },
        ],
      },
      select: { id: true, accountName: true, accountType: true },
      orderBy: { accountName: 'asc' },
    });
    findMany.mockClear();
    await expect(
      service.findPaymentAccounts({ id: 'staff' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findMany).not.toHaveBeenCalled();
  });
});
