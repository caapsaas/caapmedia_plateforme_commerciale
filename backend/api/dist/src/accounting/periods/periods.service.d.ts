import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
export interface CreateFiscalYearDto {
    name: string;
    startDate: string;
    endDate: string;
}
export declare class PeriodsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOrCreateCurrentFiscalYear(subsidiaryId: string): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }>;
    create(dto: CreateFiscalYearDto, subsidiaryId: string): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }>;
    findAll(user: JwtUser): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }[]>;
    findActive(subsidiaryId: string): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }>;
    close(id: string, user: JwtUser): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }>;
    reopen(id: string, user: JwtUser): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }>;
}
