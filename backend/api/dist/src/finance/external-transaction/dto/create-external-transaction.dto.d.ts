import { ExternalTransactionType, ExternalTransactionCategory, PaymentMethod } from '@prisma/client';
export declare class CreateExternalTransactionDto {
    transactionDate: string;
    description: string;
    amount: number;
    externalTransactionType: ExternalTransactionType;
    externalTransactionCategory: ExternalTransactionCategory;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    createdBy: string;
    subsidiaryId: string;
}
