import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationType,
  OrderStatus,
  ProductionStatus,
  UserRole,
} from '@prisma/client';
import { NotificationsService, NotifyPayload } from './notifications.service';

interface OrderReference {
  id: string;
  subsidiaryId: string;
}

@Injectable()
export class OrderNotificationsService {
  private readonly logger = new Logger(OrderNotificationsService.name);
  constructor(private readonly notifications: NotificationsService) {}

  // Invoke after commit: notification failures must not invite duplicate payments.
  private async send(
    order: OrderReference,
    roles: UserRole[],
    payload: NotifyPayload,
  ) {
    const results = await Promise.allSettled(
      [...new Set(roles)].map((role) =>
        this.notifications.notifyUsersByRole(order.subsidiaryId, role, {
          ...payload,
          orderId: order.id,
          data: {
            ...payload.data,
            orderId: order.id,
            subsidiaryId: order.subsidiaryId,
          },
        }),
      ),
    );
    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error(
          `Notification non envoyée pour la commande ${order.id}`,
          result.reason instanceof Error ? result.reason.stack : undefined,
        );
      }
    }
  }

  created(order: OrderReference) {
    return this.send(
      order,
      [UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR, UserRole.COMMERCIAL],
      {
        title: 'Nouvelle commande',
        message: `La commande ${order.id} a été créée.`,
        type: NotificationType.NEW_ORDER,
        data: { event: 'order.created' },
      },
    );
  }

  statusChanged(
    order: OrderReference,
    status: OrderStatus,
    previousStatus: OrderStatus,
  ) {
    if (status === previousStatus) return Promise.resolve();
    const labels: Record<OrderStatus, string> = {
      PENDING_VALIDATION: 'en attente de validation',
      NEW: 'nouvelle',
      IN_PRODUCTION: 'en production',
      PENDING_DELIVERY: 'prête pour la livraison',
      DELIVERED: 'livrée',
      COMPLETED: 'terminée',
      CANCELLED: 'annulée',
    };
    const isDelivery =
      status === OrderStatus.PENDING_DELIVERY ||
      status === OrderStatus.DELIVERED;
    return this.send(
      order,
      [
        UserRole.ADMIN,
        UserRole.PRODUCTION_DIRECTOR,
        UserRole.COMMERCIAL,
        UserRole.CAISSIER,
      ],
      {
        title: isDelivery
          ? 'Livraison de commande'
          : 'Statut de commande modifié',
        message: `La commande ${order.id} est ${labels[status]}.`,
        type: NotificationType.ORDER_STATUS,
        data: {
          event: isDelivery ? 'order.delivery' : 'order.status',
          previousStatus,
          status,
        },
      },
    );
  }

  productionChanged(order: OrderReference, status: ProductionStatus) {
    const labels: Record<ProductionStatus, string> = {
      PREPRESS: 'prépresse',
      PRINTING: 'impression',
      FINISHING: 'finition',
      READY_FOR_DELIVERY: 'prête pour la livraison',
    };
    return this.send(
      order,
      [
        UserRole.ADMIN,
        UserRole.PRODUCTION_DIRECTOR,
        UserRole.COMMERCIAL,
        ...(status === ProductionStatus.READY_FOR_DELIVERY
          ? [UserRole.CAISSIER]
          : []),
      ],
      {
        title:
          status === ProductionStatus.READY_FOR_DELIVERY
            ? 'Commande prête pour la livraison'
            : 'Avancement de production',
        message: `Commande ${order.id} : ${labels[status]}.`,
        type: NotificationType.ORDER_STATUS,
        data: { event: 'order.production', productionStatus: status },
      },
    );
  }

  paymentReceived(order: OrderReference) {
    return this.send(
      order,
      [
        UserRole.ADMIN,
        UserRole.COMMERCIAL,
        UserRole.CAISSIER,
        UserRole.FINANCIAL_DIRECTOR,
        UserRole.PRODUCTION_DIRECTOR,
      ],
      {
        title: 'Encaissement de commande',
        message: `Un paiement a été enregistré pour la commande ${order.id}.`,
        type: NotificationType.PAYMENT_RECEIVED,
        data: { event: 'order.payment' },
      },
    );
  }
}
