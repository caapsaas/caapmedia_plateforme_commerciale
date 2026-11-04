import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateSalaryComponentDto, UpdateSalaryComponentDto } from '../dto/salary-component.dto';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
export declare class SalaryComponentService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(subsidiaryId: string, dto: CreateSalaryComponentDto, user?: JwtUser): Promise<{
        type: import("@prisma/client").$Enums.SalaryComponentType;
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        payrollConfigId: string;
        fixedAmount: import("@prisma/client/runtime/library").Decimal | null;
        contributionType: import("@prisma/client").$Enums.ContributionType | null;
    }>;
    getByConfigId(configId: string): Promise<{
        type: import("@prisma/client").$Enums.SalaryComponentType;
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        payrollConfigId: string;
        fixedAmount: import("@prisma/client/runtime/library").Decimal | null;
        contributionType: import("@prisma/client").$Enums.ContributionType | null;
    }[]>;
    getActiveByConfigId(configId: string): Promise<{
        type: import("@prisma/client").$Enums.SalaryComponentType;
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        payrollConfigId: string;
        fixedAmount: import("@prisma/client/runtime/library").Decimal | null;
        contributionType: import("@prisma/client").$Enums.ContributionType | null;
    }[]>;
    update(componentId: string, dto: UpdateSalaryComponentDto, user?: JwtUser): Promise<{
        type: import("@prisma/client").$Enums.SalaryComponentType;
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        payrollConfigId: string;
        fixedAmount: import("@prisma/client/runtime/library").Decimal | null;
        contributionType: import("@prisma/client").$Enums.ContributionType | null;
    }>;
    delete(componentId: string, user?: JwtUser): Promise<{
        type: import("@prisma/client").$Enums.SalaryComponentType;
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        payrollConfigId: string;
        fixedAmount: import("@prisma/client/runtime/library").Decimal | null;
        contributionType: import("@prisma/client").$Enums.ContributionType | null;
    }>;
    deactivate(componentId: string, user?: JwtUser): Promise<{
        type: import("@prisma/client").$Enums.SalaryComponentType;
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        payrollConfigId: string;
        fixedAmount: import("@prisma/client/runtime/library").Decimal | null;
        contributionType: import("@prisma/client").$Enums.ContributionType | null;
    }>;
    reorder(components: {
        id: string;
        displayOrder: number;
    }[], user?: JwtUser): Promise<{
        type: import("@prisma/client").$Enums.SalaryComponentType;
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        updatedAt: Date;
        rate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        payrollConfigId: string;
        fixedAmount: import("@prisma/client/runtime/library").Decimal | null;
        contributionType: import("@prisma/client").$Enums.ContributionType | null;
    }[]>;
}
