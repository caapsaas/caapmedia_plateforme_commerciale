import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { FixedAsset } from '@prisma/client';
import { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { EntriesService } from '../entries/entries.service';
import { MappingsService } from '../accounts/mappings.service';
import { DisposeFixedAssetDto } from './dto/dispose-fixed-asset.dto';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
type DotationInput = Pick<FixedAsset, 'acquisitionCost' | 'residualValue' | 'cumulativeAmortization' | 'depreciationRate' | 'acquisitionDate'>;
export declare class ImmobilisationsService {
    private readonly prisma;
    private readonly entriesService;
    private readonly mappingsService;
    constructor(prisma: PrismaService, entriesService: EntriesService, mappingsService: MappingsService);
    computeAnnualDotation(asset: DotationInput, year: number): number;
    generateAnnualDepreciation(user: JwtUser, year: number, subsidiaryIdFilter?: string): Promise<{
        year: number;
        totalDotation: number;
        assets: {
            assetId: string;
            name: string;
            dotation: number;
            skipped?: string;
        }[];
    }>;
    dispose(id: string, dto: DisposeFixedAssetDto, user: JwtUser): Promise<{
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
    findAll(user: JwtUser, subsidiaryIdFilter?: string, paginationQuery?: PaginationQueryDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
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
}
export {};
