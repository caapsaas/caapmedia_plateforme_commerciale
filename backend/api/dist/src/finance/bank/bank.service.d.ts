import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
export declare class BankService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateBankDto, user: JwtUser): Promise<{
        type: import("@prisma/client").$Enums.BankType;
        id: string;
        address: string;
        phone: string;
        name: string;
    }>;
    findAll(): Promise<{
        type: import("@prisma/client").$Enums.BankType;
        id: string;
        address: string;
        phone: string;
        name: string;
    }[]>;
    findOne(id: string): Promise<{
        type: import("@prisma/client").$Enums.BankType;
        id: string;
        address: string;
        phone: string;
        name: string;
    }>;
    update(id: string, dto: UpdateBankDto, user: JwtUser): Promise<{
        type: import("@prisma/client").$Enums.BankType;
        id: string;
        address: string;
        phone: string;
        name: string;
    }>;
    remove(id: string, user: JwtUser): Promise<{
        type: import("@prisma/client").$Enums.BankType;
        id: string;
        address: string;
        phone: string;
        name: string;
    }>;
}
