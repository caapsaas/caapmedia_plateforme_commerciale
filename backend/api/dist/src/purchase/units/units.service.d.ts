import { Prisma } from '@prisma/client';
import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
export declare class UnitsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Prisma.PrismaPromise<{
        symbol: string | null;
        id: string;
        name: string;
    }[]>;
    findOne(id: string): Promise<{
        symbol: string | null;
        id: string;
        name: string;
    }>;
    create(dto: CreateUnitDto): Prisma.Prisma__UnitClient<{
        symbol: string | null;
        id: string;
        name: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateUnitDto): Promise<{
        symbol: string | null;
        id: string;
        name: string;
    }>;
    remove(id: string): Promise<{
        id: string;
    }>;
}
