import { DebtsService } from './debts.service';
import type { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import { PaySupplierDebtDto } from './dto/pay-supplier-debt.dto';
import { CreateLongTermDebtDto } from './dto/create-long-term-debt.dto';
import { UpdateLongTermDebtDto } from './dto/update-long-term-debt.dto';
export declare class DebtsController {
    private readonly debtsService;
    constructor(debtsService: DebtsService);
    findAllSupplierDebts(user: JwtUser, paginationQuery: PaginationQueryDto): Promise<{
        data: {
            amount: number;
            subsidiary: {
                subsidiaryName: string;
            };
            purchaseOrder: {
                totalAmount: number;
                amountPaid: number;
            };
            id: string;
            subsidiaryId: string;
            status: import("@prisma/client").$Enums.DebtStatus;
            supplierName: string;
            purchaseOrderId: string;
            invoiceId: string;
            dueDate: Date;
            invoiceUrl: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    paySupplierDebt(id: string, payDto: PaySupplierDebtDto, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.DebtStatus;
        supplierName: string;
        purchaseOrderId: string;
        invoiceId: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        invoiceUrl: string | null;
    }>;
    createLongTermDebt(createDto: CreateLongTermDebtDto, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        debtsName: string;
        initialAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
        maturityDate: Date;
        currentBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAllLongTermDebts(user: JwtUser, paginationQuery: PaginationQueryDto): Promise<{
        data: {
            initialAmount: number;
            currentBalance: number;
            interestRate: number;
            id: string;
            subsidiaryId: string;
            debtsName: string;
            maturityDate: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    updateLongTermDebt(id: string, updateDto: UpdateLongTermDebtDto, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        debtsName: string;
        initialAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
        maturityDate: Date;
        currentBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
}
