import { CustomerPaymentMethod } from '@prisma/client';
declare class DirectSaleItemDto {
    productId: string;
    quantity: number;
    productName: string;
    unitPrice: number;
    discount?: number;
    assemblyPrice?: number;
    specValues?: Record<string, unknown>;
}
export declare class CreateDirectSaleDto {
    customerId: string;
    paymentMethod: CustomerPaymentMethod;
    bankAccountId?: string;
    transactionReference?: string;
    applyTax?: boolean;
    items: DirectSaleItemDto[];
}
export {};
