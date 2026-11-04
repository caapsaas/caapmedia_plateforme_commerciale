import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/create-supplier.dto';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import type { ScopableUser } from "../../common/utils/subsidiary-scope";
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    create(createSupplierDto: CreateSupplierDto, req: {
        user: ScopableUser;
    }): Promise<{
        id: string;
        address: string;
        phone: string;
        email: string;
        subsidiaryId: string;
        company: string;
        supplierName: string;
    }>;
    findAll(req: {
        user: ScopableUser;
    }, paginationQuery: PaginationQueryDto, subsidiaryId?: string): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        id: string;
        address: string;
        phone: string;
        email: string;
        subsidiaryId: string;
        company: string;
        supplierName: string;
    }>>;
    findOne(id: string, req: {
        user: ScopableUser;
    }): Promise<{
        id: string;
        address: string;
        phone: string;
        email: string;
        subsidiaryId: string;
        company: string;
        supplierName: string;
    }>;
    update(id: string, updateSupplierDto: UpdateSupplierDto, req: {
        user: ScopableUser;
    }): Promise<{
        id: string;
        address: string;
        phone: string;
        email: string;
        subsidiaryId: string;
        company: string;
        supplierName: string;
    }>;
    remove(id: string, req: {
        user: ScopableUser;
    }): Promise<{
        id: string;
        address: string;
        phone: string;
        email: string;
        subsidiaryId: string;
        company: string;
        supplierName: string;
    }>;
}
