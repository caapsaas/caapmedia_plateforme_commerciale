import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { User, Prisma } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import { PaginatedResult } from "../../common/pagination/pagination";
import type { Contract } from '@prisma/client';
export declare class ContractsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createContractDto: CreateContractDto, user: User): Promise<{
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ContractStatus;
        amount: Prisma.Decimal;
        startDate: Date;
        endDate: Date;
        clientId: string;
    }>;
    findAll(user: User, paginationQuery: PaginationQueryDto, filterSubsidiaryId?: string): Promise<PaginatedResult<Contract>>;
    findOne(id: string, user: User): Promise<{
        client: {
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
        };
    } & {
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ContractStatus;
        amount: Prisma.Decimal;
        startDate: Date;
        endDate: Date;
        clientId: string;
    }>;
    update(id: string, updateContractDto: UpdateContractDto, user: User): Promise<{
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ContractStatus;
        amount: Prisma.Decimal;
        startDate: Date;
        endDate: Date;
        clientId: string;
    }>;
    remove(id: string, user: User): Promise<{
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ContractStatus;
        amount: Prisma.Decimal;
        startDate: Date;
        endDate: Date;
        clientId: string;
    }>;
}
