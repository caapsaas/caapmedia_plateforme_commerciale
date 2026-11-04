import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { Prisma } from '@prisma/client';
import { CreateCashRemittanceDto } from './dto/create-cash-remittance.dto';
import { ReceiveCashRemittanceDto } from './dto/receive-cash-remittance.dto';
import { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { AccountingOutboxService } from "../../accounting/outbox/accounting-outbox.service";
export declare class CashRemittanceService {
    private readonly prisma;
    private readonly accountingOutbox;
    constructor(prisma: PrismaService, accountingOutbox: AccountingOutboxService);
    create(dto: CreateCashRemittanceDto, user: JwtUser): Promise<{
        createdByUser: {
            userName: string;
        };
        sourceCashRegister: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: Prisma.Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: Prisma.Decimal | null;
        };
        destinationSafe: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: Prisma.Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: Prisma.Decimal | null;
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
        declaredAmount: Prisma.Decimal;
        receivedAmount: Prisma.Decimal | null;
        discrepancy: Prisma.Decimal | null;
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
            balance: Prisma.Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: Prisma.Decimal | null;
        };
        destinationSafe: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: Prisma.Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: Prisma.Decimal | null;
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
        declaredAmount: Prisma.Decimal;
        receivedAmount: Prisma.Decimal | null;
        discrepancy: Prisma.Decimal | null;
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
            balance: Prisma.Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: Prisma.Decimal | null;
        };
        destinationSafe: {
            id: string;
            accountNumber: string | null;
            subsidiaryId: string;
            accountName: string;
            balance: Prisma.Decimal;
            currency: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            cashierId: string | null;
            accountCode: string | null;
            bankId: string | null;
            initialBalance: Prisma.Decimal | null;
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
        declaredAmount: Prisma.Decimal;
        receivedAmount: Prisma.Decimal | null;
        discrepancy: Prisma.Decimal | null;
        remittanceDate: Date;
        sourceCashRegisterId: string;
        destinationSafeId: string;
        createdByUserId: string;
        receivedByUserId: string | null;
    }>;
}
