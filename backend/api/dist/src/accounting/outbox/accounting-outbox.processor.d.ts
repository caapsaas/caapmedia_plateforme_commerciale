import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JournalizationService } from '../journalization/journalization.service';
export declare class AccountingOutboxProcessor {
    private readonly prisma;
    private readonly journalizationService;
    private readonly logger;
    private readonly MAX_ATTEMPTS;
    private readonly BATCH_SIZE;
    constructor(prisma: PrismaService, journalizationService: JournalizationService);
    processPending(): Promise<void>;
    private processEntry;
    private dispatch;
    private handlePayrollEntry;
    private handleBonusEntry;
    private handleChargePaymentEntry;
    private handleError;
}
