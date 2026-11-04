import { CashRemittanceService } from './cash-remittance.service';
import { CreateCashRemittanceDto } from './dto/create-cash-remittance.dto';
import { ReceiveCashRemittanceDto } from './dto/receive-cash-remittance.dto';
import type { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
export declare class CashRemittanceController {
    private readonly cashRemittanceService;
    constructor(cashRemittanceService: CashRemittanceService);
    create(dto: CreateCashRemittanceDto, user: JwtUser): Promise<{
        createdByUser: {
            userName: string;
        };
        sourceCashRegister: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: import("@prisma/client/runtime/library").Decimal | null;
        };
        destinationSafe: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: import("@prisma/client/runtime/library").Decimal | null;
        };
        receivedByUser: {
            userName: string;
        };
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.CashRemittanceStatus;
        notes: string | null;
        updatedAt: Date;
        createdAt: Date;
        reference: string;
        declaredAmount: import("@prisma/client/runtime/library").Decimal;
        receivedAmount: import("@prisma/client/runtime/library").Decimal | null;
        discrepancy: import("@prisma/client/runtime/library").Decimal | null;
        remittanceDate: Date;
        sourceCashRegisterId: string;
        destinationSafeId: string;
        createdByUserId: string;
        receivedByUserId: string | null;
    }>;
    findAll(user: JwtUser): Promise<({
        createdByUser: {
            userName: string;
        };
        sourceCashRegister: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: import("@prisma/client/runtime/library").Decimal | null;
        };
        destinationSafe: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: import("@prisma/client/runtime/library").Decimal | null;
        };
        receivedByUser: {
            userName: string;
        };
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.CashRemittanceStatus;
        notes: string | null;
        updatedAt: Date;
        createdAt: Date;
        reference: string;
        declaredAmount: import("@prisma/client/runtime/library").Decimal;
        receivedAmount: import("@prisma/client/runtime/library").Decimal | null;
        discrepancy: import("@prisma/client/runtime/library").Decimal | null;
        remittanceDate: Date;
        sourceCashRegisterId: string;
        destinationSafeId: string;
        createdByUserId: string;
        receivedByUserId: string | null;
    })[]>;
    receive(id: string, dto: ReceiveCashRemittanceDto, user: JwtUser): Promise<{
        createdByUser: {
            userName: string;
        };
        sourceCashRegister: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: import("@prisma/client/runtime/library").Decimal | null;
        };
        destinationSafe: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: import("@prisma/client/runtime/library").Decimal | null;
        };
        receivedByUser: {
            userName: string;
        };
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.CashRemittanceStatus;
        notes: string | null;
        updatedAt: Date;
        createdAt: Date;
        reference: string;
        declaredAmount: import("@prisma/client/runtime/library").Decimal;
        receivedAmount: import("@prisma/client/runtime/library").Decimal | null;
        discrepancy: import("@prisma/client/runtime/library").Decimal | null;
        remittanceDate: Date;
        sourceCashRegisterId: string;
        destinationSafeId: string;
        createdByUserId: string;
        receivedByUserId: string | null;
    }>;
}
