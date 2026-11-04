import { BankService } from './bank.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import type { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
export declare class BankController {
    private readonly bankService;
    constructor(bankService: BankService);
    create(createDto: CreateBankDto, user: JwtUser): Promise<{
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
    update(id: string, updateDto: UpdateBankDto, user: JwtUser): Promise<{
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
