import { ContractStatus } from '@prisma/client';
export declare class CreateContractDto {
    title: string;
    startDate: string;
    endDate: string;
    amount: number;
    status: ContractStatus;
    clientId: string;
}
