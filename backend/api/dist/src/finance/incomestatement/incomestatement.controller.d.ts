import { IncomestatementService } from './incomestatement.service';
import { IncomeStatementDto } from './dto/income-statement.dto';
import { ScopableUser } from '../../common/utils/subsidiary-scope';
export declare class IncomestatementController {
    private readonly incomestatementService;
    constructor(incomestatementService: IncomestatementService);
    private resolveSubsidiaryId;
    getIncomeStatement(req: {
        user: ScopableUser;
    }, subsidiaryId?: string, startDate?: string, endDate?: string): Promise<IncomeStatementDto>;
    getRevenue(req: {
        user: ScopableUser;
    }, subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number>;
    getCogs(req: {
        user: ScopableUser;
    }, subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number>;
    getOperatingExpenses(req: {
        user: ScopableUser;
    }, subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number>;
    getTaxes(req: {
        user: ScopableUser;
    }, subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number>;
}
