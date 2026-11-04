import { TaxBracketService } from '../services/tax-bracket.service';
import { CreateTaxBracketDto, UpdateTaxBracketDto } from '../dto/tax-bracket.dto';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { ConfigurationAccessService } from '../services/configuration-access.service';
export declare class TaxBracketController {
    private readonly service;
    private readonly access;
    constructor(service: TaxBracketService, access: ConfigurationAccessService);
    create(subsidiaryId: string, dto: CreateTaxBracketDto, user: JwtUser): Promise<{
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
    getByConfigId(configId: string, user: JwtUser): Promise<{
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
    getActiveBrackets(configId: string, user: JwtUser): Promise<{
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
    calculateTax(configId: string, user: JwtUser, grossSalary: number, deductions?: number): Promise<{
        taxableIncome: number;
        tax: number;
    }>;
    update(bracketId: string, dto: UpdateTaxBracketDto, user: JwtUser): Promise<{
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
    delete(bracketId: string, user: JwtUser): Promise<{
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
}
