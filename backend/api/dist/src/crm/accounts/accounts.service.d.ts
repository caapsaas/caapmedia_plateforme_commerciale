import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Prisma, User } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import { PaginatedResult } from "../../common/pagination/pagination";
import type { Account } from '@prisma/client';
export declare class AccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createAccountDto: CreateAccountDto, user: User): Promise<{
        id: string;
        address: string;
        phone: string;
        subsidiaryId: string;
        salesRepId: string | null;
        accountName: string;
        industry: string;
    }>;
    findAll(user: User, paginationQuery: PaginationQueryDto, filterSubsidiaryId?: string, filterSalesRepId?: string): Promise<PaginatedResult<Account>>;
    findOne(id: string, user: User): Promise<{
        contacts: {
            id: string;
            address: string;
            phone: string;
            email: string | null;
            passwordHash: string | null;
            subsidiaryId: string | null;
            status: import("@prisma/client").$Enums.ContactStatus | null;
            contactName: string;
            company: string;
            since: Date;
            isOccasional: boolean;
            isVerified: boolean;
            accountId: string | null;
            salesRepId: string | null;
        }[];
        opportunities: {
            id: string;
            subsidiaryId: string;
            accountId: string;
            opportunityName: string;
            opportunityValue: Prisma.Decimal;
            closeDate: Date;
            contactId: string;
            userId: string;
            stage: import("@prisma/client").$Enums.OpportunityStage;
            sourceOpportunity: import("@prisma/client").$Enums.OpportunitySource | null;
        }[];
        salesRep: {
            email: string;
            userName: string;
        };
    } & {
        id: string;
        address: string;
        phone: string;
        subsidiaryId: string;
        salesRepId: string | null;
        accountName: string;
        industry: string;
    }>;
    update(id: string, updateAccountDto: UpdateAccountDto, user: User): Promise<{
        id: string;
        address: string;
        phone: string;
        subsidiaryId: string;
        salesRepId: string | null;
        accountName: string;
        industry: string;
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        address: string;
        phone: string;
        subsidiaryId: string;
        salesRepId: string | null;
        accountName: string;
        industry: string;
    }>;
}
