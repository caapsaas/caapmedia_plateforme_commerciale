/* eslint-disable @typescript-eslint/unbound-method -- The guard reads handler metadata. */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { StockMovementsController } from '../../purchase/stock-movements/stock-movements.controller';
import { OrdersController } from './orders.controller';

describe('Production permissions', () => {
  const guard = new RoleGuard(new Reflector());
  const director = UserRole.PRODUCTION_DIRECTOR;
  const superAdmin = UserRole.SUPER_ADMIN;

  function checkAccess(
    controller: typeof OrdersController | typeof StockMovementsController,
    handler: object,
    method: string,
    activeRole: UserRole,
    roles: UserRole[],
  ) {
    return guard.canActivate({
      getClass: () => controller,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({ method, user: { activeRole, roles } }),
      }),
    } as unknown as ExecutionContext);
  }

  it.each([
    [
      OrdersController,
      OrdersController.prototype.validateForProduction,
      'PATCH',
    ],
    [OrdersController, OrdersController.prototype.rejectOrder, 'PATCH'],
    [
      OrdersController,
      OrdersController.prototype.updateProductionStatus,
      'PATCH',
    ],
    [OrdersController, OrdersController.prototype.updateOrderStatus, 'PATCH'],
    [
      StockMovementsController,
      StockMovementsController.prototype.withdrawForOrder,
      'POST',
    ],
  ] as const)(
    'restricts production mutations (%#)',
    (controller, handler, method) => {
      expect(
        checkAccess(controller, handler, method, director, [director]),
      ).toBe(true);
      expect(() =>
        checkAccess(controller, handler, method, superAdmin, [superAdmin]),
      ).toThrow(ForbiddenException);
      expect(() =>
        checkAccess(controller, handler, method, director, [
          superAdmin,
          director,
        ]),
      ).toThrow(ForbiddenException);
    },
  );

  it('allows the super-admin to consult pending production orders', () => {
    expect(
      checkAccess(
        OrdersController,
        OrdersController.prototype.findPendingValidation,
        'GET',
        superAdmin,
        [superAdmin],
      ),
    ).toBe(true);
  });
});
