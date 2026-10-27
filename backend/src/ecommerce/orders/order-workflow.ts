import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Order, OrderStatus, PaymentStatus, ProductionStatus, UserRole } from '@prisma/client';
import { getActiveRole, RoleIdentity } from '../../common/auth/role/role-identity';

export const BEFORE_PRODUCTION: OrderStatus[] = [OrderStatus.NEW, OrderStatus.PENDING_VALIDATION];
export const PRODUCTION_STAGES: ProductionStatus[] = [ProductionStatus.PREPRESS, ProductionStatus.PRINTING, ProductionStatus.FINISHING, ProductionStatus.READY_FOR_DELIVERY];
const PRODUCTION_ROLES = [UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR];
const DELIVERY_ROLES = [...PRODUCTION_ROLES, UserRole.COMMERCIAL, UserRole.CAISSIER];
type WorkflowOrder = Pick<Order, 'status' | 'productionStatus' | 'paymentStatus' | 'amountPaid' | 'totalAmount'>;

export function assertWorkflowRole(user: RoleIdentity, roles: UserRole[]) {
  const role = getActiveRole(user);
  if (role !== UserRole.SUPER_ADMIN && (!role || !roles.includes(role))) {
    throw new ForbiddenException('Votre rôle actif ne permet pas cette action sur la commande.');
  }
}

export function assertOrderTransition(order: WorkflowOrder, target: OrderStatus, user: RoleIdentity) {
  if (target === order.status) return;
  if (target === OrderStatus.IN_PRODUCTION && BEFORE_PRODUCTION.includes(order.status)) {
    assertWorkflowRole(user, PRODUCTION_ROLES);
    return;
  }
  if (target === OrderStatus.CANCELLED && BEFORE_PRODUCTION.includes(order.status)) {
    assertWorkflowRole(user, [...PRODUCTION_ROLES, UserRole.COMMERCIAL]);
    if (order.amountPaid.greaterThan(0)) {
      throw new ConflictException('Une commande encaissée ne peut pas être annulée. Régularisez son paiement au préalable.');
    }
    return;
  }
  if (target === OrderStatus.PENDING_DELIVERY && order.status === OrderStatus.IN_PRODUCTION && order.productionStatus === ProductionStatus.READY_FOR_DELIVERY) {
    assertWorkflowRole(user, PRODUCTION_ROLES);
    return;
  }
  if (target === OrderStatus.DELIVERED && order.status === OrderStatus.PENDING_DELIVERY && order.productionStatus === ProductionStatus.READY_FOR_DELIVERY) {
    assertWorkflowRole(user, DELIVERY_ROLES);
    return;
  }
  if (target === OrderStatus.COMPLETED && order.status === OrderStatus.DELIVERED) {
    assertWorkflowRole(user, DELIVERY_ROLES);
    if (order.paymentStatus !== PaymentStatus.PAID || order.amountPaid.lessThan(order.totalAmount)) {
      throw new ConflictException('La commande doit être intégralement payée avant sa clôture.');
    }
    return;
  }
  throw new ConflictException(`Transition de commande interdite : ${order.status} → ${target}.`);
}

export function nextOrderStatusForProduction(order: WorkflowOrder, target: ProductionStatus, user: RoleIdentity): OrderStatus {
  assertWorkflowRole(user, PRODUCTION_ROLES);
  if (order.status !== OrderStatus.IN_PRODUCTION) {
    throw new ConflictException('Seule une commande validée et en production peut changer d’étape de fabrication.');
  }
  if (PRODUCTION_STAGES.indexOf(target) !== PRODUCTION_STAGES.indexOf(order.productionStatus) + 1) {
    throw new ConflictException('La fabrication doit suivre les étapes Prépresse → Impression → Finition → Prête à livrer.');
  }
  return target === ProductionStatus.READY_FOR_DELIVERY ? OrderStatus.PENDING_DELIVERY : OrderStatus.IN_PRODUCTION;
}
