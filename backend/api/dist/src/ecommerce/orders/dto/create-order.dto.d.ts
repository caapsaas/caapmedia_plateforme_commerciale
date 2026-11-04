import { OrderSource } from '@prisma/client';
import { OrderStatus, CustomerPaymentMethod } from '@prisma/client';
import { ProductionStatus } from '@prisma/client';
declare class CreateProductOptionDto {
    optionType: string;
    optionValue: string;
}
export declare class CreateProductionStepDto {
    equipmentId: string;
    equipmentNameSnapshot: string;
    stepOrder: number;
    estimatedTimeHours: number;
    hourlyRateSnapshot: number;
    calculatedCost: number;
}
export declare class CreateProductionSummaryDto {
    totalProductionCost: number;
    marginPercent: number;
    finalPrice: number;
}
declare class CreateOrderItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    assemblyPrice?: number;
    designFileName?: string;
    designFileUrl?: string;
    options?: CreateProductOptionDto[];
    specValues?: Record<string, unknown>;
    productionSteps?: CreateProductionStepDto[];
    productionSummary?: CreateProductionSummaryDto;
}
export declare class OccasionalOrderCustomerDto {
    name: string;
    phone: string;
    email?: string;
}
export declare class CreateOrderBySalesRepDto {
    customerId?: string;
    occasionalCustomer?: OccasionalOrderCustomerDto;
    customerName: string;
    paymentDueDate: string;
    paymentMethod: CustomerPaymentMethod;
    opportunityId?: string;
    source: OrderSource;
    items: CreateOrderItemDto[];
    applyTax?: boolean;
}
export declare class RecordPaymentDto {
    amount: number;
    paymentMethod: CustomerPaymentMethod;
    bankAccountId?: string;
    transactionReference?: string;
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
}
export declare class updateProductionStatusDto {
    productionStatus: ProductionStatus;
}
export {};
