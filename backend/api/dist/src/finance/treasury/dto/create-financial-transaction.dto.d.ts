import { TransactionType, TransactionStatus } from '@prisma/client';
export declare class CreateFinancialTransactionDto {
    transactionDate: string;
    description: string;
    financialTransactionType?: TransactionType;
    amount: number;
    treasuryAccountId: string;
    relatedDocumentId?: string;
    providerName?: string;
    providerPhone?: string;
    status?: TransactionStatus;
}
