import { CommercialParamsService } from './commercial-params.service';
import { UpsertCommercialParamsDto } from './dto/upsert-commercial-params.dto';
import type { JwtUser } from "../../../common/auth/jwt/jwt-user.interface";
export declare class CommercialParamsController {
    private readonly service;
    constructor(service: CommercialParamsService);
    findGlobal(): Promise<{
        id: string;
        updatedAt: Date;
        updatedById: string | null;
        minMarginPercent: import("@prisma/client/runtime/library").Decimal;
        maxMarginPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    upsert(dto: UpsertCommercialParamsDto, user: JwtUser): Promise<{
        id: string;
        updatedAt: Date;
        updatedById: string | null;
        minMarginPercent: import("@prisma/client/runtime/library").Decimal;
        maxMarginPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
}
