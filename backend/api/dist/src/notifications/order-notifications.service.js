"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OrderNotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderNotificationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("./notifications.service");
let OrderNotificationsService = OrderNotificationsService_1 = class OrderNotificationsService {
    notifications;
    logger = new common_1.Logger(OrderNotificationsService_1.name);
    constructor(notifications) {
        this.notifications = notifications;
    }
    async send(order, roles, payload) {
        const results = await Promise.allSettled([...new Set(roles)]
            .filter((role) => role !== client_1.UserRole.COMMERCIAL || !!order.salesRepId)
            .map((role) => {
            const notification = {
                ...payload,
                orderId: order.id,
                data: {
                    ...payload.data,
                    orderId: order.id,
                    subsidiaryId: order.subsidiaryId,
                },
            };
            return role === client_1.UserRole.COMMERCIAL
                ? this.notifications.notifyUsersByRole(order.subsidiaryId, role, notification, order.salesRepId)
                : this.notifications.notifyUsersByRole(order.subsidiaryId, role, notification);
        }));
        for (const result of results) {
            if (result.status === 'rejected') {
                this.logger.error(`Notification non envoyée pour la commande ${order.id}`, result.reason instanceof Error ? result.reason.stack : undefined);
            }
        }
    }
    created(order) {
        return this.send(order, [client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.COMMERCIAL], {
            title: 'Nouvelle commande',
            message: `La commande ${order.id} a été créée.`,
            type: client_1.NotificationType.NEW_ORDER,
            data: { event: 'order.created' },
        });
    }
    statusChanged(order, status, previousStatus) {
        if (status === previousStatus)
            return Promise.resolve();
        const labels = {
            PENDING_VALIDATION: 'en attente de validation',
            NEW: 'nouvelle',
            IN_PRODUCTION: 'en production',
            PENDING_DELIVERY: 'prête pour la livraison',
            DELIVERED: 'livrée',
            COMPLETED: 'terminée',
            CANCELLED: 'annulée',
        };
        const isDelivery = status === client_1.OrderStatus.PENDING_DELIVERY ||
            status === client_1.OrderStatus.DELIVERED;
        const validated = status === client_1.OrderStatus.IN_PRODUCTION &&
            (previousStatus === client_1.OrderStatus.NEW ||
                previousStatus === client_1.OrderStatus.PENDING_VALIDATION);
        const cancelled = status === client_1.OrderStatus.CANCELLED;
        return this.send(order, [
            client_1.UserRole.ADMIN,
            client_1.UserRole.PRODUCTION_DIRECTOR,
            client_1.UserRole.COMMERCIAL,
            client_1.UserRole.CAISSIER,
        ], {
            title: validated
                ? 'Commande validée pour la production'
                : cancelled
                    ? 'Commande annulée avant production'
                    : isDelivery
                        ? 'Livraison de commande'
                        : 'Statut de commande modifié',
            message: `La commande ${order.id} est ${labels[status]}.`,
            type: client_1.NotificationType.ORDER_STATUS,
            data: {
                event: validated
                    ? 'order.validated'
                    : cancelled
                        ? 'order.cancelled'
                        : isDelivery
                            ? 'order.delivery'
                            : 'order.status',
                previousStatus,
                status,
            },
        });
    }
    productionChanged(order, status) {
        const labels = {
            PREPRESS: 'prépresse',
            PRINTING: 'impression',
            FINISHING: 'finition',
            READY_FOR_DELIVERY: 'prête pour la livraison',
        };
        return this.send(order, [
            client_1.UserRole.ADMIN,
            client_1.UserRole.PRODUCTION_DIRECTOR,
            client_1.UserRole.COMMERCIAL,
            ...(status === client_1.ProductionStatus.READY_FOR_DELIVERY
                ? [client_1.UserRole.CAISSIER]
                : []),
        ], {
            title: status === client_1.ProductionStatus.READY_FOR_DELIVERY
                ? 'Commande prête pour la livraison'
                : 'Avancement de production',
            message: `Commande ${order.id} : ${labels[status]}.`,
            type: client_1.NotificationType.ORDER_STATUS,
            data: {
                event: status === client_1.ProductionStatus.READY_FOR_DELIVERY
                    ? 'order.ready'
                    : 'order.production',
                productionStatus: status,
            },
        });
    }
    paymentReceived(order) {
        return this.send(order, [
            client_1.UserRole.ADMIN,
            client_1.UserRole.COMMERCIAL,
            client_1.UserRole.CAISSIER,
            client_1.UserRole.FINANCIAL_DIRECTOR,
            client_1.UserRole.PRODUCTION_DIRECTOR,
        ], {
            title: 'Encaissement de commande',
            message: `Un paiement a été enregistré pour la commande ${order.id}.`,
            type: client_1.NotificationType.PAYMENT_RECEIVED,
            data: { event: 'order.payment' },
        });
    }
};
exports.OrderNotificationsService = OrderNotificationsService;
exports.OrderNotificationsService = OrderNotificationsService = OrderNotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], OrderNotificationsService);
//# sourceMappingURL=order-notifications.service.js.map