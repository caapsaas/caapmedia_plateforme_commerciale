import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateSupplierDto, UpdateSupplierDto } from './dto/create-supplier.dto';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import { PaginatedResult } from "../../common/pagination/pagination";
import type { Supplier } from '@prisma/client';
import type { ScopableUser } from "../../common/utils/subsidiary-scope";
export declare class SuppliersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createSupplierDto: CreateSupplierDto, user: ScopableUser): Promise<{
        id: string;
        address: string;
        phone: string;
        email: string;
        subsidiaryId: string;
        company: string;
        supplierName: string;
    }>;
    findAll(user: ScopableUser, paginationQuery: PaginationQueryDto, subsidiaryId?: string): Promise<PaginatedResult<Supplier>>;
    findOne(id: string, user: ScopableUser): Promise<{
        id: string;
        address: string;
        phone: string;
        email: string;
        subsidiaryId: string;
        company: string;
        supplierName: string;
    }>;
    update(id: string, updateSupplierDto: UpdateSupplierDto, user: ScopableUser): Promise<{
        id: string;
        address: string;
        phone: string;
        email: string;
        subsidiaryId: string;
        company: string;
        supplierName: string;
    }>;
    remove(id: string, user: ScopableUser): Promise<{
        id: string;
        address: string;
        phone: string;
        email: string;
        subsidiaryId: string;
        company: string;
        supplierName: string;
    }>;
}
