import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { AccountingOutboxService } from "../../accounting/outbox/accounting-outbox.service";
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import type { Prisma } from '@prisma/client';
export declare class ExpensesService {
    private readonly prisma;
    private readonly accountingOutbox;
    constructor(prisma: PrismaService, accountingOutbox: AccountingOutboxService);
    create(createExpenseDto: CreateExpenseDto, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: Prisma.Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>;
    findAll(user: JwtUser, paginationQuery?: PaginationQueryDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: Prisma.Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>>;
    findOne(id: string, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: Prisma.Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>;
    update(id: string, updateExpenseDto: UpdateExpenseDto, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: Prisma.Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>;
    remove(id: string, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: Prisma.Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>;
}
