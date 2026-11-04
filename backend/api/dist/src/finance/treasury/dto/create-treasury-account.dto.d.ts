import { AccountType } from '@prisma/client';
export declare class CreateTreasuryAccountDto {
    accountName: string;
    initialBalance: number;
    currency: string;
    accountType: AccountType;
    cashierId?: string;
    accountCode?: string;
    accountNumber?: string;
    bankId?: string;
    subsidiaryId?: string;
}
