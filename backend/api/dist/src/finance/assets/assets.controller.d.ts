import { AssetsService } from './assets.service';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import type { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    create(createDto: CreateFixedAssetDto, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.FixedAssetStatus;
        acquisitionDate: Date;
        disposalDate: Date | null;
        disposalAmount: import("@prisma/client/runtime/library").Decimal | null;
        fixedAssetsName: string;
        acquisitionCost: import("@prisma/client/runtime/library").Decimal;
        depreciationRate: import("@prisma/client/runtime/library").Decimal;
        residualValue: import("@prisma/client/runtime/library").Decimal;
        cumulativeAmortization: import("@prisma/client/runtime/library").Decimal;
        lastAmortizationYear: number | null;
    }>;
    findAll(user: JwtUser, paginationQuery: PaginationQueryDto): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.FixedAssetStatus;
        acquisitionDate: Date;
        disposalDate: Date | null;
        disposalAmount: import("@prisma/client/runtime/library").Decimal | null;
        fixedAssetsName: string;
        acquisitionCost: import("@prisma/client/runtime/library").Decimal;
        depreciationRate: import("@prisma/client/runtime/library").Decimal;
        residualValue: import("@prisma/client/runtime/library").Decimal;
        cumulativeAmortization: import("@prisma/client/runtime/library").Decimal;
        lastAmortizationYear: number | null;
    }>>;
    findOne(id: string, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.FixedAssetStatus;
        acquisitionDate: Date;
        disposalDate: Date | null;
        disposalAmount: import("@prisma/client/runtime/library").Decimal | null;
        fixedAssetsName: string;
        acquisitionCost: import("@prisma/client/runtime/library").Decimal;
        depreciationRate: import("@prisma/client/runtime/library").Decimal;
        residualValue: import("@prisma/client/runtime/library").Decimal;
        cumulativeAmortization: import("@prisma/client/runtime/library").Decimal;
        lastAmortizationYear: number | null;
    }>;
    update(id: string, updateDto: UpdateFixedAssetDto, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.FixedAssetStatus;
        acquisitionDate: Date;
        disposalDate: Date | null;
        disposalAmount: import("@prisma/client/runtime/library").Decimal | null;
        fixedAssetsName: string;
        acquisitionCost: import("@prisma/client/runtime/library").Decimal;
        depreciationRate: import("@prisma/client/runtime/library").Decimal;
        residualValue: import("@prisma/client/runtime/library").Decimal;
        cumulativeAmortization: import("@prisma/client/runtime/library").Decimal;
        lastAmortizationYear: number | null;
    }>;
    remove(id: string, user: JwtUser): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.FixedAssetStatus;
        acquisitionDate: Date;
        disposalDate: Date | null;
        disposalAmount: import("@prisma/client/runtime/library").Decimal | null;
        fixedAssetsName: string;
        acquisitionCost: import("@prisma/client/runtime/library").Decimal;
        depreciationRate: import("@prisma/client/runtime/library").Decimal;
        residualValue: import("@prisma/client/runtime/library").Decimal;
        cumulativeAmortization: import("@prisma/client/runtime/library").Decimal;
        lastAmortizationYear: number | null;
    }>;
}
