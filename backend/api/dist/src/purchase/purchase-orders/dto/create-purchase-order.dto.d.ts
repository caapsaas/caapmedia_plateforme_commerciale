import { PaymentTerms, PurchaseOrderStatus } from '@prisma/client';
declare class CreatePurchaseOrderItemDto {
    productId: string;
    quantity: number;
    purchasePrice: number;
    purchaseUnitId?: string;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    expectedDeliveryDate: string;
    paymentTerms: PaymentTerms;
    items: CreatePurchaseOrderItemDto[];
}
export declare class UpdatePurchaseOrderStatusDto {
    status: PurchaseOrderStatus;
}
export {};
