import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import type { User } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class ContractsController {
    private readonly contractsService;
    constructor(contractsService: ContractsService);
    create(createContractDto: CreateContractDto, user: User): Promise<{
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ContractStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date;
        clientId: string;
    }>;
    findAll(user: User, paginationQuery: PaginationQueryDto, filterSubsidiaryId?: string): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ContractStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date;
        clientId: string;
    }>>;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date;
        clientId: string;
    }>;
    update(id: string, updateContractDto: UpdateContractDto, user: User): Promise<{
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ContractStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date;
        clientId: string;
    }>;
    remove(id: string, user: User): Promise<{
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ContractStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date;
        clientId: string;
    }>;
}
