"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PayrollCumulativeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollCumulativeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
let PayrollCumulativeService = PayrollCumulativeService_1 = class PayrollCumulativeService {
    prisma;
    logger = new common_1.Logger(PayrollCumulativeService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateCumulatives(tx, payrollRecord) {
        const year = payrollRecord.payrollPeriod.substring(0, 4);
        const month = payrollRecord.payrollPeriod;
        this.logger.log(`📊 Mise à jour cumuls: Employé ${payrollRecord.employeeId} - ${month}`);
        const currentCumulative = await tx.payrollCumulative.findUnique({
            where: {
                employeeId_year_month: {
                    employeeId: payrollRecord.employeeId,
                    year,
                    month: null,
                },
            },
        });
        const previousGross = currentCumulative?.grossCumululative || 0;
        const previousCNPS = currentCumulative?.cnpsCumulative || 0;
        const previousIRPP = currentCumulative?.irppCumulative || 0;
        const newGross = Number(previousGross) + Number(payrollRecord.grossSalary);
        const newCNPS = Number(previousCNPS) + Number(payrollRecord.cnpsEmployee);
        const newIRPP = Number(previousIRPP) + Number(payrollRecord.irpp);
        const newCFC = Number(currentCumulative?.cfcCumulative || 0) +
            Number(payrollRecord.cfcEmployee);
        const newCAC = Number(currentCumulative?.cacCumulative || 0) + Number(payrollRecord.cac);
        const newDeductions = Number(currentCumulative?.deductionsCumululative || 0) +
            Number(payrollRecord.deductions);
        const newNet = Number(currentCumulative?.netCumululative || 0) +
            Number(payrollRecord.netSalary);
        this.logger.log(`💰 Cumuls annuels: Brut=${newGross}, CNPS=${newCNPS}, IRPP=${newIRPP}`);
        const cumulative = await tx.payrollCumulative.upsert({
            where: {
                employeeId_year_month: {
                    employeeId: payrollRecord.employeeId,
                    year,
                    month: null,
                },
            },
            create: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_CUMULATIVE),
                employeeId: payrollRecord.employeeId,
                subsidiaryId: payrollRecord.subsidiaryId,
                year,
                month: null,
                grossCumululative: new client_1.Prisma.Decimal(newGross),
                deductionsCumululative: new client_1.Prisma.Decimal(newDeductions),
                netCumululative: new client_1.Prisma.Decimal(newNet),
                cnpsCumulative: new client_1.Prisma.Decimal(newCNPS),
                cfcCumulative: new client_1.Prisma.Decimal(newCFC),
                irppCumulative: new client_1.Prisma.Decimal(newIRPP),
                cacCumulative: new client_1.Prisma.Decimal(newCAC),
                lastPayrollId: payrollRecord.id,
            },
            update: {
                grossCumululative: new client_1.Prisma.Decimal(newGross),
                deductionsCumululative: new client_1.Prisma.Decimal(newDeductions),
                netCumululative: new client_1.Prisma.Decimal(newNet),
                cnpsCumulative: new client_1.Prisma.Decimal(newCNPS),
                cfcCumulative: new client_1.Prisma.Decimal(newCFC),
                irppCumulative: new client_1.Prisma.Decimal(newIRPP),
                cacCumulative: new client_1.Prisma.Decimal(newCAC),
                lastPayrollId: payrollRecord.id,
            },
        });
        this.logger.log(`✅ Cumuls mis à jour pour ${payrollRecord.employeeId}`);
        return cumulative;
    }
    async createDeductionDetails(tx, payrollRecordId, deductions, grossSalary) {
        const details = [];
        if (deductions.cnpsEmployee > 0) {
            const rate = deductions.cnpsEmployee / grossSalary;
            details.push({
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
                payrollRecordId,
                deductionType: 'CNPS',
                description: 'CNPS salarié 4.2% (plafonné)',
                baseAmount: new client_1.Prisma.Decimal(grossSalary),
                rateApplied: new client_1.Prisma.Decimal(rate),
                amount: new client_1.Prisma.Decimal(deductions.cnpsEmployee),
            });
        }
        if (deductions.cfcEmployee > 0) {
            const rate = deductions.cfcEmployee / grossSalary;
            details.push({
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
                payrollRecordId,
                deductionType: 'CFC',
                description: 'CFC salarié 1%',
                baseAmount: new client_1.Prisma.Decimal(grossSalary),
                rateApplied: new client_1.Prisma.Decimal(rate),
                amount: new client_1.Prisma.Decimal(deductions.cfcEmployee),
            });
        }
        if (deductions.irpp > 0) {
            const rate = deductions.irpp / grossSalary;
            details.push({
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
                payrollRecordId,
                deductionType: 'IRPP',
                description: 'Impôt sur le revenu progressif',
                baseAmount: new client_1.Prisma.Decimal(grossSalary),
                rateApplied: new client_1.Prisma.Decimal(rate),
                amount: new client_1.Prisma.Decimal(deductions.irpp),
            });
        }
        if (deductions.cac > 0) {
            const rate = deductions.cac / deductions.irpp;
            details.push({
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
                payrollRecordId,
                deductionType: 'CAC',
                description: "CAC 10% de l'IRPP",
                baseAmount: new client_1.Prisma.Decimal(deductions.irpp),
                rateApplied: new client_1.Prisma.Decimal(rate),
                amount: new client_1.Prisma.Decimal(deductions.cac),
            });
        }
        if (deductions.otherDeductions > 0) {
            details.push({
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
                payrollRecordId,
                deductionType: 'OTHER',
                description: 'Autres retenues (avances, prêts, absences)',
                baseAmount: new client_1.Prisma.Decimal(deductions.otherDeductions),
                rateApplied: new client_1.Prisma.Decimal(1),
                amount: new client_1.Prisma.Decimal(deductions.otherDeductions),
            });
        }
        if (details.length > 0) {
            await tx.payrollDeductionDetail.createMany({
                data: details,
            });
            this.logger.log(`✅ ${details.length} détails de déduction créés`);
        }
    }
    async getAnnualCumulative(employeeId, year) {
        return this.prisma.payrollCumulative.findUnique({
            where: {
                employeeId_year_month: {
                    employeeId,
                    year,
                    month: null,
                },
            },
        });
    }
    async getDeductionDetails(payrollRecordId) {
        return this.prisma.payrollDeductionDetail.findMany({
            where: { payrollRecordId },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.PayrollCumulativeService = PayrollCumulativeService;
exports.PayrollCumulativeService = PayrollCumulativeService = PayrollCumulativeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollCumulativeService);
//# sourceMappingURL=payroll-cumulative.service.js.map