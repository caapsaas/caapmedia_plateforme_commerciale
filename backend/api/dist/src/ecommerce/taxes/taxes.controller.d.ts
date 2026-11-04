import { TaxesService } from './taxes.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/create-taxe.dto';
export declare class TaxesController {
    private readonly taxesService;
    constructor(taxesService: TaxesService);
    create(createTaxDto: CreateTaxDto): Promise<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: import("@prisma/client/runtime/library").Decimal;
        isDefault: boolean;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: import("@prisma/client/runtime/library").Decimal;
        isDefault: boolean;
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__TaxRateClient<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: import("@prisma/client/runtime/library").Decimal;
        isDefault: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, updateTaxDto: UpdateTaxDto): Promise<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: import("@prisma/client/runtime/library").Decimal;
        isDefault: boolean;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: import("@prisma/client/runtime/library").Decimal;
        isDefault: boolean;
    }>;
}
