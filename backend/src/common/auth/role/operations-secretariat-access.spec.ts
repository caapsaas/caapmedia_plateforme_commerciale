import {
  ExecutionContext,
  ForbiddenException,
  RequestMethod,
} from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { EquipementController } from '../../../maintenance/equipement/equipement.controller';
import { MaintenanceRecordController } from '../../../maintenance/maintenance_record/maintenance_record.controller';
import { PurchaseOrdersController } from '../../../purchase/purchase-orders/purchase-orders.controller';
import { StockItemsController } from '../../../purchase/stock-items/stock-items.controller';
import { StockMovementsController } from '../../../purchase/stock-movements/stock-movements.controller';
import { SecretariatController } from '../../../secretariat/secretariat.controller';
import { RoleGuard } from './role.guard';

describe('Operations and secretariat permissions', () => {
  const reflector = new Reflector();
  const guard = new RoleGuard(reflector);

  function checkAccess(
    controller: object,
    handler: object,
    method: string,
    activeRole: UserRole,
    roles: UserRole[],
  ) {
    return guard.canActivate({
      getClass: () => controller,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          url: '/test',
          user: { id: 'staff', activeRole, roles },
        }),
      }),
    } as unknown as ExecutionContext);
  }

  it.each([
    PurchaseOrdersController,
    StockItemsController,
    StockMovementsController,
    MaintenanceRecordController,
    SecretariatController,
  ])('enforces read-only supervision for %p', (controller) => {
    let writes = 0;
    let reads = 0;
    for (const descriptor of Object.values(
      Object.getOwnPropertyDescriptors(controller.prototype as object),
    )) {
      const handler: unknown = descriptor.value;
      if (typeof handler !== 'function') continue;
      const method = reflector.get<RequestMethod | undefined>(
        METHOD_METADATA,
        handler,
      );
      if (method === undefined) continue;
      const verb = RequestMethod[method];
      const superAdmin = UserRole.SUPER_ADMIN;
      const admin = UserRole.ADMIN;
      if (method === RequestMethod.GET) {
        reads++;
        expect(
          checkAccess(controller, handler, verb, superAdmin, [superAdmin]),
        ).toBe(true);
        continue;
      }
      writes++;
      expect(checkAccess(controller, handler, verb, admin, [admin])).toBe(true);
      expect(() =>
        checkAccess(controller, handler, verb, superAdmin, [superAdmin]),
      ).toThrow(ForbiddenException);
      expect(() =>
        checkAccess(controller, handler, verb, admin, [superAdmin, admin]),
      ).toThrow(ForbiddenException);
    }
    expect(reads).toBeGreaterThan(0);
    expect(writes).toBeGreaterThan(0);
  });

  it('preserves equipment management assigned to the super-admin', () => {
    const handler: unknown = Object.getOwnPropertyDescriptor(
      EquipementController.prototype,
      'create',
    )?.value;
    expect(typeof handler).toBe('function');
    const superAdmin = UserRole.SUPER_ADMIN;
    expect(
      checkAccess(EquipementController, handler as object, 'POST', superAdmin, [
        superAdmin,
      ]),
    ).toBe(true);
  });
});
