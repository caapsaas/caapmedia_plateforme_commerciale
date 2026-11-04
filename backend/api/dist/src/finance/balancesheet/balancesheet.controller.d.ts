import { BalancesheetService } from './balancesheet.service';
import { BalanceSheetDto } from './dto/balance-sheet.dto';
import { ScopableUser } from '../../common/utils/subsidiary-scope';
export declare class BalancesheetController {
    private readonly balancesheetService;
    constructor(balancesheetService: BalancesheetService);
    private resolveSubsidiaryId;
    getBalanceSheet(req: {
        user: ScopableUser;
    }, subsidiaryId?: string): Promise<BalanceSheetDto>;
    getTreasuryData(req: {
        user: ScopableUser;
    }, subsidiaryId?: string): Promise<number>;
    getCustomerReceivables(req: {
        user: ScopableUser;
    }, subsidiaryId?: string): Promise<{
        totalReceivables: number;
    }>;
    getInventoryValue(): number;
    getEquipmentsValue(req: {
        user: ScopableUser;
    }, subsidiaryId?: string): Promise<number>;
    getFixedAssetsValue(req: {
        user: ScopableUser;
    }, subsidiaryId?: string): Promise<number>;
    getSupplierDebts(req: {
        user: ScopableUser;
    }, subsidiaryId?: string): Promise<{
        totalDebts: number;
    }>;
    getShareCapital(req: {
        user: ScopableUser;
    }, subsidiaryId?: string): Promise<number>;
    getAccumulatedNetIncome(req: {
        user: ScopableUser;
    }, subsidiaryId?: string): Promise<number>;
}
