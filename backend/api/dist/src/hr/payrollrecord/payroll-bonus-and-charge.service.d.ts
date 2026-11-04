import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { PayrollBonus, Employee, PayrollChargePayment } from '@prisma/client';
import { CameroonPayrollCalculatorService } from './cameroonpayrollcalculator.service';
import { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
export declare class PayrollBonusAndChargeService {
    private readonly prisma;
    private readonly calculator;
    private readonly outbox;
    private readonly logger;
    private readonly CNPS_PAYABLE_ACCOUNT;
    private readonly CFC_PAYABLE_ACCOUNT;
    private readonly IRPP_PAYABLE_ACCOUNT;
    private readonly CAC_PAYABLE_ACCOUNT;
    private readonly FNE_PAYABLE_ACCOUNT;
    private readonly BANK_ACCOUNT;
    constructor(prisma: PrismaService, calculator: CameroonPayrollCalculatorService, outbox: AccountingOutboxService);
    getBonusSubsidiaryId(bonusId: string): Promise<string>;
    getChargeSubsidiaryId(chargeId: string): Promise<string>;
    generateThirteenthMonth(employeeId: string, month: string, year: string): Promise<PayrollBonus>;
    approveBonus(bonusId: string, approvedBy: string): Promise<PayrollBonus>;
    recordBonusPayment(bonusId: string, bankTransferId: string, paymentDate?: Date): Promise<PayrollBonus>;
    cancelBonus(bonusId: string, reason: string): Promise<PayrollBonus>;
    extractBonusesFromPayroll(subsidiaryId: string, month: string): Promise<{
        created: number;
        skipped: number;
        total: number;
    }>;
    getPendingBonuses(subsidiaryId: string): Promise<(PayrollBonus & {
        employee: Employee;
        bonusType: {
            label: string;
            code: string;
        };
    })[]>;
    getApprovedBonuses(subsidiaryId: string): Promise<(PayrollBonus & {
        employee: Employee;
        bonusType: {
            label: string;
            code: string;
        };
    })[]>;
    accumulateEmployerCharges(subsidiaryId: string | undefined, month: string): Promise<{
        month: string;
        totalPayrolls: number;
        employerCharges: Record<string, {
            amount: number;
            dueDate: string;
            status: string;
        }>;
        salaryDeductions: {
            byPaymentMethod: Record<string, {
                grossSalary: number;
                netSalary: number;
                cnps: number;
                cfc: number;
                irpp: number;
                cac: number;
                other: number;
                total: number;
            }>;
            grandTotal: number;
        };
        monthlyPrimes: {
            totalPrimes: number;
            averagePrimePerEmployee: number;
            employeesWithPrimes: number;
        };
        bonusCharges: {
            totalBonuses: number;
            deductionsTotal: {
                cnps: number;
                cfc: number;
                irpp: number;
                cac: number;
                other: number;
            };
            netBonusesTotal: number;
        };
        grandTotalAllCharges: number;
    }>;
    recordChargePayment(chargePaymentId: string, bankTransferId: string, paidAmount: number, declarationNumber?: string): Promise<PayrollChargePayment>;
    getOverdueCharges(subsidiaryId: string): Promise<PayrollChargePayment[]>;
    getChargesDueThisMonth(subsidiaryId: string): Promise<PayrollChargePayment[]>;
    createSalaryCharge(subsidiaryId: string, month: string, paymentMethod: string): Promise<PayrollChargePayment>;
    updateChargeStatusesCron(): Promise<number>;
    getChargesSummary(subsidiaryId: string, startMonth: string, endMonth: string): Promise<{
        byChargeType: Record<string, {
            total: number;
            paid: number;
            pending: number;
            overdue: number;
        }>;
        overallTotal: number;
        overallPaid: number;
        overallPending: number;
        overallOverdue: number;
    }>;
    private getOrCreateBonusTypeId;
    private calculateDueDate;
}
