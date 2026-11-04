import { PrismaService } from "../../../common/utils/prisma/prisma.service";
import { UpsertCommercialParamsDto } from './dto/upsert-commercial-params.dto';
import { Prisma } from '@prisma/client';
import { JwtUser } from "../../../common/auth/jwt/jwt-user.interface";
export declare class CommercialParamsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsert(dto: UpsertCommercialParamsDto, user: JwtUser): Promise<{
        id: string;
        updatedAt: Date;
        updatedById: string | null;
        minMarginPercent: Prisma.Decimal;
        maxMarginPercent: Prisma.Decimal;
    }>;
    findGlobal(): Promise<{
        id: string;
        updatedAt: Date;
        updatedById: string | null;
        minMarginPercent: Prisma.Decimal;
        maxMarginPercent: Prisma.Decimal;
    }>;
}
