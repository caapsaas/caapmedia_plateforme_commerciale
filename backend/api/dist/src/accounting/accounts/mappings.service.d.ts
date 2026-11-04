import { PrismaService } from "../../common/utils/prisma/prisma.service";
export declare class MappingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        key: string;
        accountCode: string;
    }[]>;
    getMap(): Promise<Record<string, string>>;
    update(key: string, accountCode: string): Promise<{
        id: string;
        key: string;
        accountCode: string;
    }>;
    seedDefaultMappings(): Promise<{
        imported: number;
        skipped: number;
    }>;
}
