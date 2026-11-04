import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { Prisma, Employee, DocumentType, LeaveType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';
import { PaginatedResult } from '../../common/pagination/pagination';
import { CameroonPayrollCalculatorService } from '../payrollrecord/cameroonpayrollcalculator.service';
export declare class EmployeeService {
    private readonly prisma;
    private readonly payrollCalculator;
    private readonly logger;
    constructor(prisma: PrismaService, payrollCalculator: CameroonPayrollCalculatorService);
    private calculateTotalIndemnities;
    private resolveSalaryIfNetMode;
    private convertEmployeeToDTO;
    private convertLeaveBalancesToFrontendFormat;
    private convertDocumentsToFrontendFormat;
    create(createEmployeeDto: CreateEmployeeDto, subsidiaryId: string, employeeId?: string): Promise<Employee>;
    findAll(subsidiaryId: string | null | undefined, includeRelations?: boolean, paginationQuery?: PaginationQueryDto): Promise<PaginatedResult<Employee>>;
    findOne(id: string, includeRelations?: boolean): Promise<Employee>;
    getLeaveBalances(employeeId: string): Promise<{
        annual: number;
        sick: number;
        personal: number;
        maternity: number;
        paternity: number;
        other: number;
        unpaid: number;
    }>;
    updateLeaveBalance(employeeId: string, leaveType: LeaveType, days: number, operation?: 'set' | 'add' | 'subtract'): Promise<{
        id: string;
        employeeId: string;
        leaveType: import("@prisma/client").$Enums.LeaveType;
        days: Prisma.Decimal;
        lastUpdated: Date;
    }>;
    updateAllLeaveBalances(employeeId: string, leaveBalance: {
        annual: number;
        sick: number;
        personal: number;
        maternity: number;
        paternity: number;
        other: number;
        unpaid?: number;
    }): Promise<{
        annual: number;
        sick: number;
        personal: number;
        maternity: number;
        paternity: number;
        other: number;
        unpaid: number;
    }>;
    addLeaveRecord(employeeId: string, leaveData: {
        startDate: Date;
        endDate: Date;
        days: number;
        leaveRecordType: LeaveType;
    }): Promise<any>;
    update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee>;
    remove(id: string): Promise<Employee>;
    addDocument(employeeId: string, documentName: string, url: string, docType: DocumentType): Promise<any>;
    addPositionHistory(employeeId: string, positionData: {
        employeePosition: string;
        department?: string;
        startDate: Date;
        endDate?: Date;
    }): Promise<any>;
    addTraining(employeeId: string, trainingData: {
        trainingName: string;
        trainingDate: Date;
        provider?: string;
    }): Promise<any>;
    addPerformanceReview(employeeId: string, reviewData: {
        reviewDate: Date;
        reviewer?: string;
        rating?: number;
        reviewComments?: string;
    }): Promise<any>;
}
