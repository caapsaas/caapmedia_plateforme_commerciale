"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCTION_STAGES = exports.BEFORE_PRODUCTION = void 0;
exports.assertWorkflowRole = assertWorkflowRole;
exports.assertOrderTransition = assertOrderTransition;
exports.nextOrderStatusForProduction = nextOrderStatusForProduction;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const role_identity_1 = require("../../common/auth/role/role-identity");
exports.BEFORE_PRODUCTION = [
    client_1.OrderStatus.NEW,
    client_1.OrderStatus.PENDING_VALIDATION,
];
exports.PRODUCTION_STAGES = [
    client_1.ProductionStatus.PREPRESS,
    client_1.ProductionStatus.PRINTING,
    client_1.ProductionStatus.FINISHING,
    client_1.ProductionStatus.READY_FOR_DELIVERY,
];
const PRODUCTION_ROLES = [client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR];
const DELIVERY_ROLES = [
    ...PRODUCTION_ROLES,
    client_1.UserRole.COMMERCIAL,
    client_1.UserRole.CAISSIER,
];
function assertWorkflowRole(user, roles) {
    const role = (0, role_identity_1.getActiveRole)(user);
    if (role !== client_1.UserRole.SUPER_ADMIN && (!role || !roles.includes(role))) {
        throw new common_1.ForbiddenException('Votre rôle actif ne permet pas cette action sur la commande.');
    }
}
function assertOrderTransition(order, target, user) {
    if (target === order.status)
        return;
    if (target === client_1.OrderStatus.IN_PRODUCTION &&
        exports.BEFORE_PRODUCTION.includes(order.status)) {
        assertWorkflowRole(user, PRODUCTION_ROLES);
        return;
    }
    if (target === client_1.OrderStatus.CANCELLED &&
        exports.BEFORE_PRODUCTION.includes(order.status)) {
        assertWorkflowRole(user, [...PRODUCTION_ROLES, client_1.UserRole.COMMERCIAL]);
        if (order.amountPaid.greaterThan(0)) {
            throw new common_1.ConflictException('Une commande encaissée ne peut pas être annulée. Régularisez son paiement au préalable.');
        }
        return;
    }
    if (target === client_1.OrderStatus.PENDING_DELIVERY &&
        order.status === client_1.OrderStatus.IN_PRODUCTION &&
        order.productionStatus === client_1.ProductionStatus.READY_FOR_DELIVERY) {
        assertWorkflowRole(user, PRODUCTION_ROLES);
        return;
    }
    if (target === client_1.OrderStatus.DELIVERED &&
        order.status === client_1.OrderStatus.PENDING_DELIVERY &&
        order.productionStatus === client_1.ProductionStatus.READY_FOR_DELIVERY) {
        assertWorkflowRole(user, DELIVERY_ROLES);
        return;
    }
    if (target === client_1.OrderStatus.COMPLETED &&
        order.status === client_1.OrderStatus.DELIVERED) {
        assertWorkflowRole(user, DELIVERY_ROLES);
        if (order.paymentStatus !== client_1.PaymentStatus.PAID ||
            order.amountPaid.lessThan(order.totalAmount)) {
            throw new common_1.ConflictException('La commande doit être intégralement payée avant sa clôture.');
        }
        return;
    }
    throw new common_1.ConflictException(`Transition de commande interdite : ${order.status} → ${target}.`);
}
function nextOrderStatusForProduction(order, target, user) {
    assertWorkflowRole(user, PRODUCTION_ROLES);
    if (order.status !== client_1.OrderStatus.IN_PRODUCTION) {
        throw new common_1.ConflictException('Seule une commande validée et en production peut changer d’étape de fabrication.');
    }
    if (exports.PRODUCTION_STAGES.indexOf(target) !==
        exports.PRODUCTION_STAGES.indexOf(order.productionStatus) + 1) {
        throw new common_1.ConflictException('La fabrication doit suivre les étapes Prépresse → Impression → Finition → Prête à livrer.');
    }
    return target === client_1.ProductionStatus.READY_FOR_DELIVERY
        ? client_1.OrderStatus.PENDING_DELIVERY
        : client_1.OrderStatus.IN_PRODUCTION;
}
//# sourceMappingURL=order-workflow.js.map