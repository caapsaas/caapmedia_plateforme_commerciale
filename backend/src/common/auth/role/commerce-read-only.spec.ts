import {
  Controller,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ProformasController } from '../../../crm/proformas/proformas.controller';
import { OrdersController } from '../../../ecommerce/orders/orders.controller';
import { NeedRequestsController } from '../../../purchase/need-requests/need-requests.controller';
import { Roles, SuperAdminReadOnly } from './role.decorator';
import { RoleGuard } from './role.guard';
import type { RoleIdentity } from './role-identity';

@SuperAdminReadOnly()
@Controller('commerce')
class CommerceController {}

@Controller('other')
class OtherController {}

describe('super-admin read-only commerce access', () => {
  const reflector = new Reflector();
  const guard = new RoleGuard(reflector);
  const admin = { role: UserRole.ADMIN };
  const superAdmin = { role: UserRole.SUPER_ADMIN };
  const switchedSuperAdmin = {
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    activeRole: UserRole.ADMIN,
  };

  const check = (
    method: string,
    user: RoleIdentity,
    controller: Type<unknown> = CommerceController,
    handler: object = Roles(UserRole.ADMIN)(() => undefined),
  ) => {
    const request = { method, url: '/test', user };
    return guard.canActivate({
      getClass: () => controller,
      getHandler: () => handler,
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext);
  };

  it.each(['GET', 'HEAD', 'OPTIONS'])(
    'allows %s for consultation',
    (method) => {
      expect(check(method, superAdmin)).toBe(true);
    },
  );

  it.each(['POST', 'PATCH', 'PUT', 'DELETE'])(
    'forbids %s even after switching to an additional role',
    (method) => {
      expect(() => check(method, superAdmin)).toThrow(ForbiddenException);
      expect(() => check(method, switchedSuperAdmin)).toThrow(
        ForbiddenException,
      );
    },
  );

  it.each([
    [ProformasController, ProformasController.prototype.create],
    [OrdersController, OrdersController.prototype.createBySalesRepJson],
    [NeedRequestsController, NeedRequestsController.prototype.pay],
  ])('wires the guard to %p writes', (controller, handler) => {
    const guards = reflector.getAllAndMerge<unknown[]>(GUARDS_METADATA, [
      handler,
      controller,
    ]);
    expect(guards).toContain(RoleGuard);
    expect(() => check('POST', superAdmin, controller, handler)).toThrow(
      ForbiddenException,
    );
  });

  it('preserves the ordinary administrator permissions and other modules', () => {
    expect(check('POST', admin)).toBe(true);
    expect(check('POST', superAdmin, OtherController)).toBe(true);
  });
});
