import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { IncomeStatementDto } from './dto/income-statement.dto';
export declare class IncomestatementService {
    private prisma;
    constructor(prisma: PrismaService);
    getIncomeStatement(subsidiaryId?: string, startDate?: string, endDate?: string): Promise<IncomeStatementDto>;
    private getRevenue;
    private getCostOfGoodsSold;
    private getOperatingExpenses;
    private getTaxes;
    private buildDateRange;
    getRevenueData(subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number>;
    getCogsData(subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number>;
    getOperatingExpensesData(subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number>;
    getTaxesData(subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number>;
}
