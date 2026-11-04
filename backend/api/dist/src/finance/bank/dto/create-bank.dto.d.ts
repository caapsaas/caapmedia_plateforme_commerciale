import { BankType } from '@prisma/client';
export declare class CreateBankDto {
    name: string;
    address: string;
    phone: string;
    type: BankType;
}
