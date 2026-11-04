import { Order, OrderStatus, PaymentStatus, ProductionStatus, UserRole } from '../types';

export const productionStages = [ProductionStatus.PREPRESS, ProductionStatus.PRINTING, ProductionStatus.FINISHING, ProductionStatus.READY_FOR_DELIVERY];
export const isBeforeProduction = (status: OrderStatus) => [OrderStatus.NEW, OrderStatus.PENDING_VALIDATION].includes(status);
export const canManageProduction = (role?: UserRole) => role === UserRole.ADMIN || role === UserRole.PRODUCTION_DIRECTOR;
export const isKanbanOrder = (order: Order) => order.status === OrderStatus.IN_PRODUCTION || order.status === OrderStatus.PENDING_DELIVERY;
export const canAdvanceProduction = (order: Order, target: ProductionStatus, role?: UserRole) => canManageProduction(role) && order.status === OrderStatus.IN_PRODUCTION && productionStages.indexOf(target) === productionStages.indexOf(order.productionStatus) + 1;

export function allowedOrderTransitions(order: Order, role?: UserRole): OrderStatus[] {
  const result: OrderStatus[] = [];
  if (!role || role === UserRole.SUPER_ADMIN) return result; // Consolidated view remains read-only.
  const production = canManageProduction(role);
  if (isBeforeProduction(order.status)) {
    if (production) result.push(OrderStatus.IN_PRODUCTION);
    if ((production || role === UserRole.COMMERCIAL) && Number(order.amountPaid) === 0) result.push(OrderStatus.CANCELLED);
  }
  if (production && order.status === OrderStatus.IN_PRODUCTION && order.productionStatus === ProductionStatus.READY_FOR_DELIVERY) result.push(OrderStatus.PENDING_DELIVERY);
  const delivery = production || role === UserRole.COMMERCIAL || role === UserRole.CAISSIER;
  if (delivery && order.status === OrderStatus.PENDING_DELIVERY && order.productionStatus === ProductionStatus.READY_FOR_DELIVERY) result.push(OrderStatus.DELIVERED);
  if (delivery && order.status === OrderStatus.DELIVERED && order.paymentStatus === PaymentStatus.PAID && Number(order.amountPaid) >= Number(order.totalAmount)) result.push(OrderStatus.COMPLETED);
  return result;
}
