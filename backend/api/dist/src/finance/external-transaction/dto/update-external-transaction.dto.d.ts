import { ExternalTransactionStatus, ExternalTransactionType, ExternalTransactionCategory, PaymentMethod } from '@prisma/client';
export declare class UpdateExternalTransactionDto {
    transactionDate?: string;
    description?: string;
    amount?: number;
    externalTransactionType?: ExternalTransactionType;
    externalTransactionCategory?: ExternalTransactionCategory;
    paymentMethod?: PaymentMethod;
    referenceNumber?: string;
    relatedDocumentUrl?: string;
    status?: ExternalTransactionStatus;
}
