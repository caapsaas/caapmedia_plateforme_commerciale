import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
export declare class UnitsController {
    private readonly unitsService;
    constructor(unitsService: UnitsService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        symbol: string | null;
        id: string;
        name: string;
    }[]>;
    create(dto: CreateUnitDto): import("@prisma/client").Prisma.Prisma__UnitClient<{
        symbol: string | null;
        id: string;
        name: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findOne(id: string): Promise<{
        symbol: string | null;
        id: string;
        name: string;
    }>;
    update(id: string, dto: UpdateUnitDto): Promise<{
        symbol: string | null;
        id: string;
        name: string;
    }>;
    remove(id: string): Promise<{
        id: string;
    }>;
}
