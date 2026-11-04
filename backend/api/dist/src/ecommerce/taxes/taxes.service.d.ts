import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateTaxDto, UpdateTaxDto } from './dto/create-taxe.dto';
import { Prisma } from '@prisma/client';
export declare class TaxesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createTaxDto: CreateTaxDto): Promise<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: Prisma.Decimal;
        isDefault: boolean;
    }>;
    findAll(): Prisma.PrismaPromise<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: Prisma.Decimal;
        isDefault: boolean;
    }[]>;
    findOne(id: string): Prisma.Prisma__TaxRateClient<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: Prisma.Decimal;
        isDefault: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    update(id: string, updateTaxDto: UpdateTaxDto): Promise<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: Prisma.Decimal;
        isDefault: boolean;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        taxRatesName: string;
        rate: Prisma.Decimal;
        isDefault: boolean;
    }>;
}
