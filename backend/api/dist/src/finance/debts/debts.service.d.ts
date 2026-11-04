import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { Prisma } from '@prisma/client';
import { PaySupplierDebtDto } from './dto/pay-supplier-debt.dto';
import { CreateLongTermDebtDto } from './dto/create-long-term-debt.dto';
import { UpdateLongTermDebtDto } from './dto/update-long-term-debt.dto';
import { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { AccountingOutboxService } from "../../accounting/outbox/accounting-outbox.service";
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class DebtsService {
    private readonly prisma;
    private readonly accountingOutbox;
    constructor(prisma: PrismaService, accountingOutbox: AccountingOutboxService);
    findAllSupplierDebts(user: JwtUser, paginationQuery?: PaginationQueryDto): Promise<{
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
    paySupplierDebt(id: string, dto: PaySupplierDebtDto, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.DebtStatus;
        supplierName: string;
        purchaseOrderId: string;
        invoiceId: string;
        dueDate: Date;
        amount: Prisma.Decimal;
        invoiceUrl: string | null;
    }>;
    createLongTermDebt(dto: CreateLongTermDebtDto, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        debtsName: string;
        initialAmount: Prisma.Decimal;
        interestRate: Prisma.Decimal;
        maturityDate: Date;
        currentBalance: Prisma.Decimal;
    }>;
    findAllLongTermDebts(user: JwtUser, paginationQuery?: PaginationQueryDto): Promise<{
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
    updateLongTermDebt(id: string, dto: UpdateLongTermDebtDto, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        debtsName: string;
        initialAmount: Prisma.Decimal;
        interestRate: Prisma.Decimal;
        maturityDate: Date;
        currentBalance: Prisma.Decimal;
    }>;
}
