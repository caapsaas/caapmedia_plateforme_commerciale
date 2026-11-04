import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateTaxBracketDto, UpdateTaxBracketDto } from '../dto/tax-bracket.dto';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
export declare class TaxBracketService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(subsidiaryId: string, dto: CreateTaxBracketDto, user?: JwtUser): Promise<{
        id: string;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal | null;
        deductible: import("@prisma/client/runtime/library").Decimal;
        payrollConfigId: string;
        effectiveDate: Date;
        expiryDate: Date | null;
    }>;
    getByConfigId(configId: string): Promise<{
        id: string;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal | null;
        deductible: import("@prisma/client/runtime/library").Decimal;
        payrollConfigId: string;
        effectiveDate: Date;
        expiryDate: Date | null;
    }[]>;
    getActiveBrackets(configId: string): Promise<{
        id: string;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal | null;
        deductible: import("@prisma/client/runtime/library").Decimal;
        payrollConfigId: string;
        effectiveDate: Date;
        expiryDate: Date | null;
    }[]>;
    getTaxableIncome(grossSalary: number, configId: string, deductions?: number): Promise<{
        taxableIncome: number;
        tax: number;
    }>;
    update(bracketId: string, dto: UpdateTaxBracketDto, user?: JwtUser): Promise<{
        id: string;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal | null;
        deductible: import("@prisma/client/runtime/library").Decimal;
        payrollConfigId: string;
        effectiveDate: Date;
        expiryDate: Date | null;
    }>;
    delete(bracketId: string, user?: JwtUser): Promise<{
        id: string;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        minSalary: import("@prisma/client/runtime/library").Decimal;
        maxSalary: import("@prisma/client/runtime/library").Decimal | null;
        deductible: import("@prisma/client/runtime/library").Decimal;
        payrollConfigId: string;
        effectiveDate: Date;
        expiryDate: Date | null;
    }>;
    private validateNonOverlappingBrackets;
    private bracketsOverlap;
}
