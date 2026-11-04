import { TreasuryTransactionType, CounterpartyType, TransactionStatus } from '@prisma/client';
export declare class CreateDisbursementDto {
    transactionDate: string;
    description: string;
    amount: number;
    sourceAccountId: string;
    destinationAccountId?: string;
    treasuryType: TreasuryTransactionType;
    reference?: string;
    counterpartyId?: string;
    newCounterpartyName?: string;
    newCounterpartyType?: CounterpartyType;
    status?: TransactionStatus;
}
