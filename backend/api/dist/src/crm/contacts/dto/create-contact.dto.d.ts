import { ContactStatus } from '@prisma/client';
export declare class CreateContactDto {
    contactName: string;
    company: string;
    email: string;
    phone: string;
    address: string;
    status?: ContactStatus;
    accountId?: string;
    subsidiaryId?: string;
    since?: Date;
}
