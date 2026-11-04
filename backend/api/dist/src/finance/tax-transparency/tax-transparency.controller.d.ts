import { TaxTransparencyService } from './tax-transparency.service';
import { TaxTransparencyPeriodDto } from './dto/tax-transparency-period.dto';
import type { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
export declare class TaxTransparencyController {
    private readonly taxTransparencyService;
    constructor(taxTransparencyService: TaxTransparencyService);
    getPayrollSummary(query: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
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
    getVatSummary(query: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
        period: string;
        orderCount: number;
        taxableSubtotal: number;
        vatCollected: number;
        totalWithTax: number;
    }>;
    getIrppDetail(query: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
        period: string;
        details: {
            employeeName: string;
            matricule: string;
            baseAmount: number;
            irppAmount: number;
        }[];
        totalAmount: number;
    }>;
    getCnpsDetail(query: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
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
    getCfcFneDetail(query: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
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
    getVatDetail(query: TaxTransparencyPeriodDto, user: JwtUser): Promise<{
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
