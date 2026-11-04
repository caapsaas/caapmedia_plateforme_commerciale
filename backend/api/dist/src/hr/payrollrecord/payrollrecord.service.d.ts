import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JournalizationService } from '../../accounting/journalization/journalization.service';
import { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import { CreatePayrollRecordDto, UpdatePayrollRecordDto } from './dto/payrollrecord.dto';
import { PayrollRecord, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';
import { PaginatedResult } from '../../common/pagination/pagination';
import { CameroonPayrollCalculatorService } from './cameroonpayrollcalculator.service';
import { PayrollCumulativeService } from './payroll-cumulative.service';
type PayrollRecordWithDetails = PayrollRecord & {
    employee?: {
        firstName: string;
        lastName: string;
        baseSalary: Decimal;
        bonus: Decimal | null;
    };
    subsidiary?: {
        id: string;
        subsidiaryName: string;
    };
};
export declare class PayrollRecordService {
    private readonly prisma;
    private readonly calculator;
    private readonly journalization;
    private readonly outbox;
    private readonly cumulative;
    private readonly logger;
    constructor(prisma: PrismaService, calculator: CameroonPayrollCalculatorService, journalization: JournalizationService, outbox: AccountingOutboxService, cumulative: PayrollCumulativeService);
    create(dto: CreatePayrollRecordDto, employeeId: string, subsidiaryId: string): Promise<PayrollRecord>;
    findAll(subsidiaryId?: string, paginationQuery?: PaginationQueryDto): Promise<PaginatedResult<PayrollRecordWithDetails>>;
    findAllGlobal(): Promise<PayrollRecordWithDetails[]>;
    findOne(id: string): Promise<PayrollRecordWithDetails>;
    update(id: string, dto: UpdatePayrollRecordDto): Promise<PayrollRecord>;
    remove(id: string): Promise<PayrollRecord>;
    signPayrollRecord(id: string, signature: string, userId?: string): Promise<PayrollRecordWithDetails>;
    processPayroll(subsidiaryId: string, period: string, options?: {
        riskGroup?: 'A' | 'B' | 'C';
        applyCfc?: boolean;
        applyFne?: boolean;
        forceRegenerate?: boolean;
    }): Promise<{
        count: number;
        message: string;
        regenerated?: number;
    }>;
    private updateCumulativesForPeriod;
    simulatePayroll(employeeId: string, options?: {
        bonus?: number;
        allowances?: number;
        overtime?: number;
        riskGroup?: 'A' | 'B' | 'C';
    }): Promise<{
        employee: {
            id: string;
            fullName: string;
            baseSalary: Prisma.Decimal;
        };
        simulation: import("./cameroonpayrollcalculator.service").CameroonPayrollResult;
    }>;
    findByEmployee(employeeId: string, subsidiaryId?: string): Promise<PayrollRecord[]>;
    findEmployeeForScope(employeeId: string): Promise<{
        subsidiaryId: string;
    }>;
    findByPeriod(subsidiaryId: string, period: string): Promise<PayrollRecordWithDetails[]>;
    private getCalculatorConfig;
}
export {};
