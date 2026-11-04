import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { TaxTransparencyPeriodDto } from './dto/tax-transparency-period.dto';
export declare class TaxTransparencyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private payrollPeriodWhere;
    getPayrollSummary(dto: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
        period: string;
        employeeCount: number;
        grossSalary: number;
        netSalary: number;
        cnpsEmployee: number;
        cnpsEmployer: number;
        cnpsTotal: number;
        cfcEmployee: number;
        cfcEmployer: number;
        cfcTotal: number;
        irpp: number;
        cac: number;
        irppTotal: number;
        fne: number;
        totalEmployerCost: number;
    }>;
    getIrppDetail(dto: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
        period: string;
        details: {
            employeeName: string;
            matricule: string;
            baseAmount: number;
            irppAmount: number;
        }[];
        totalAmount: number;
    }>;
    getCnpsDetail(dto: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
        period: string;
        details: {
            employeeName: string;
            matricule: string;
            baseAmount: number;
            employeeShare: number;
            employerShare: number;
            total: number;
        }[];
        totalEmployee: number;
        totalEmployer: number;
        total: number;
    }>;
    getCfcFneDetail(dto: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
        period: string;
        cfc: {
            details: {
                employeeName: string;
                matricule: string;
                baseAmount: number;
                amount: number;
            }[];
            totalAmount: number;
        };
        fne: {
            details: {
                employeeName: string;
                matricule: string;
                baseAmount: number;
                amount: number;
            }[];
            totalAmount: number;
        };
    }>;
    getVatSummary(dto: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
        period: string;
        orderCount: number;
        taxableSubtotal: number;
        vatCollected: number;
        totalWithTax: number;
    }>;
    getVatDetail(dto: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
        period: string;
        details: {
            orderId: string;
            date: Date;
            clientName: string;
            taxableAmount: number;
            vatAmount: number;
            totalAmount: number;
        }[];
    }>;
}
