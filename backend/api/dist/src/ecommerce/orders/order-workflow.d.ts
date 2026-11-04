import { Order, OrderStatus, ProductionStatus, UserRole } from '@prisma/client';
import { RoleIdentity } from '../../common/auth/role/role-identity';
export declare const BEFORE_PRODUCTION: OrderStatus[];
export declare const PRODUCTION_STAGES: ProductionStatus[];
type WorkflowOrder = Pick<Order, 'status' | 'productionStatus' | 'paymentStatus' | 'amountPaid' | 'totalAmount'>;
export declare function assertWorkflowRole(user: RoleIdentity, roles: UserRole[]): void;
export declare function assertOrderTransition(order: WorkflowOrder, target: OrderStatus, user: RoleIdentity): void;
export declare function nextOrderStatusForProduction(order: WorkflowOrder, target: ProductionStatus, user: RoleIdentity): OrderStatus;
export {};
