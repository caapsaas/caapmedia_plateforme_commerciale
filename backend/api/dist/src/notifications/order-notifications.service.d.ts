import { OrderStatus, ProductionStatus } from '@prisma/client';
import { NotificationsService } from './notifications.service';
interface OrderReference {
    id: string;
    subsidiaryId: string;
    salesRepId?: string | null;
}
export declare class OrderNotificationsService {
    private readonly notifications;
    private readonly logger;
    constructor(notifications: NotificationsService);
    private send;
    created(order: OrderReference): Promise<void>;
    statusChanged(order: OrderReference, status: OrderStatus, previousStatus: OrderStatus): Promise<void>;
    productionChanged(order: OrderReference, status: ProductionStatus): Promise<void>;
    paymentReceived(order: OrderReference): Promise<void>;
}
export {};
