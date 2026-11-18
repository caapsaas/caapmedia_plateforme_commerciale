import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RoleGuard } from '../common/auth/role/role.guard';
import { ExternalTransactionController } from './external-transaction/external-transaction.controller';
import { PrefinancementController } from './prefinancement/prefinancement.controller';

describe('Finance active role authorization', () => {
  const guard = new RoleGuard(new Reflector());
  const user = {
    role: UserRole.SUPER_ADMIN,
    roles: [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR],
  };

  function check(controller: object, handler: object, activeRole: UserRole) {
    return guard.canActivate({
      getClass: () => controller,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'PATCH',
          url: '/finance',
          user: { ...user, activeRole },
        }),
      }),
    } as ExecutionContext);
  }

  it.each([
    'createAccount',
    'updateAccount',
    'createTransaction',
    'updateTransaction',
    'validateTransaction',
    'cancelTransaction',
    'deleteTransaction',
  ] as const)(
    'requires an active finance role for prefinancing action %s',
    (action) => {
      const handler = PrefinancementController.prototype[action];
      expect(() =>
        check(PrefinancementController, handler, UserRole.SUPER_ADMIN),
      ).toThrow(ForbiddenException);
      expect(
        check(PrefinancementController, handler, UserRole.FINANCIAL_DIRECTOR),
      ).toBe(true);
    },
  );

  it('distinguishes external transaction approval from administrative corrections', () => {
    const controller = ExternalTransactionController;
    expect(
      check(controller, controller.prototype.validate, UserRole.SUPER_ADMIN),
    ).toBe(true);
    expect(() =>
      check(controller, controller.prototype.adminUpdate, UserRole.SUPER_ADMIN),
    ).toThrow(ForbiddenException);
    expect(() =>
      check(controller, controller.prototype.adminRemove, UserRole.SUPER_ADMIN),
    ).toThrow(ForbiddenException);
  });
});
