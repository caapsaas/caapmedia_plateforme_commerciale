import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { PayrollRecord, PayrollCumulative, Prisma } from '@prisma/client';
export declare class PayrollCumulativeService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    updateCumulatives(tx: Prisma.TransactionClient, payrollRecord: PayrollRecord): Promise<PayrollCumulative>;
    createDeductionDetails(tx: Prisma.TransactionClient, payrollRecordId: string, deductions: {
        cnpsEmployee: number;
        cfcEmployee: number;
        irpp: number;
        cac: number;
        otherDeductions: number;
    }, grossSalary: number): Promise<void>;
    getAnnualCumulative(employeeId: string, year: string): Promise<PayrollCumulative | null>;
    getDeductionDetails(payrollRecordId: string): Promise<{
        description: string;
        id: string;
        notes: string | null;
        amount: Prisma.Decimal;
        createdAt: Date;
        payrollRecordId: string;
        deductionType: string;
        baseAmount: Prisma.Decimal;
        rateApplied: Prisma.Decimal;
    }[]>;
}
