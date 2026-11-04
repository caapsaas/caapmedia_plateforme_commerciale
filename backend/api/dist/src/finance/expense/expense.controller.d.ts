import { ExpensesService } from './expense.service';
import type { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    create(createExpenseDto: CreateExpenseDto, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>;
    findAll(user: JwtUser, paginationQuery: PaginationQueryDto): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>>;
    findOne(id: string, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>;
    update(id: string, updateExpenseDto: UpdateExpenseDto, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>;
    remove(id: string, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        category: import("@prisma/client").$Enums.ExpenseCategory;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseRecordType: import("@prisma/client").$Enums.ExpenseType;
        expenseDate: Date;
    }>;
}
