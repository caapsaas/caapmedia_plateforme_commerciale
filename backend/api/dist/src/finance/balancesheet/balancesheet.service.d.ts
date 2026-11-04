import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { BalanceSheetDto } from './dto/balance-sheet.dto';
import { AccountingBalanceService } from '../../accounting/shared/accounting-balance.service';
export declare class BalancesheetService {
    private prisma;
    private readonly balanceService;
    constructor(prisma: PrismaService, balanceService: AccountingBalanceService);
    getBalanceSheet(subsidiaryId?: string): Promise<BalanceSheetDto>;
    getTreasuryData(subsidiaryId?: string): Promise<number>;
    getCustomerReceivables(subsidiaryId?: string): Promise<number>;
    getInventoryValue(): number;
    getEquipmentsValue(subsidiaryId?: string): Promise<number>;
    getFixedAssetsValue(subsidiaryId?: string): Promise<number>;
    getUnpaidSupplierDebts(subsidiaryId?: string): Promise<number>;
    getLongTermDebtsBalance(subsidiaryId?: string): Promise<number>;
    getShareCapital(subsidiaryId?: string): Promise<number>;
    getRetainedEarnings(subsidiaryId?: string): Promise<number>;
    getSupplierDebts(subsidiaryId?: string): Promise<number>;
    getAccumulatedNetIncome(subsidiaryId?: string): Promise<number>;
}
