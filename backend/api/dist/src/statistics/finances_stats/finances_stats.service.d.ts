import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { PeriodFilterDto } from '../analytics/dto/period-filter.dto';
import { User } from '@prisma/client';
export declare class FinancesStatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getDateFilter;
    getPnlStatement(user: User, periodFilterDto: PeriodFilterDto): Promise<{
        revenue: number;
        cogs: number;
        grossProfit: number;
        operatingExpenses: number;
        taxes: number;
        netIncome: number;
    }>;
    getCrmAnalysis(user: User, periodFilterDto: PeriodFilterDto): Promise<{
        pipelineValue: number;
        conversionRate: number;
        newOpportunities: number;
        webOpportunities: number;
    }>;
}
