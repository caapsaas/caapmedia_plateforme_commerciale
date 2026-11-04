import { ImmobilisationsService } from './immobilisations.service';
import { DisposeFixedAssetDto } from './dto/dispose-fixed-asset.dto';
import { GenerateDepreciationDto } from './dto/generate-depreciation.dto';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class ImmobilisationsController {
    private readonly immobilisationsService;
    constructor(immobilisationsService: ImmobilisationsService);
    findAll(req: any, subsidiaryId: string | undefined, paginationQuery: PaginationQueryDto): Promise<import("../../common/pagination/pagination").PaginatedResult<{
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
    generateAnnualDepreciation(dto: GenerateDepreciationDto, req: any): Promise<{
        year: number;
        totalDotation: number;
        assets: {
            assetId: string;
            name: string;
            dotation: number;
            skipped?: string;
        }[];
    }>;
    dispose(id: string, dto: DisposeFixedAssetDto, req: any): Promise<{
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
