import { FinancesStatsService } from './finances_stats.service';
import { PeriodFilterDto } from '../analytics/dto/period-filter.dto';
export declare class FinancesStatsController {
    private readonly financesStatsService;
    constructor(financesStatsService: FinancesStatsService);
    getPnlStatement(req: any, periodFilterDto: PeriodFilterDto): Promise<{
        revenue: number;
        cogs: number;
        grossProfit: number;
        operatingExpenses: number;
        taxes: number;
        netIncome: number;
    }>;
    getCrmAnalysis(req: any, periodFilterDto: PeriodFilterDto): Promise<{
        pipelineValue: number;
        conversionRate: number;
        newOpportunities: number;
        webOpportunities: number;
    }>;
}
