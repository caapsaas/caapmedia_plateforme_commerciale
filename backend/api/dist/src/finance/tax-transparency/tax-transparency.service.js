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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxTransparencyService = void 0;
const common_1 = require("@nestjs/common");
const date_fns_1 = require("date-fns");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let TaxTransparencyService = class TaxTransparencyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    payrollPeriodWhere(dto, user) {
        const scope = (0, subsidiary_scope_1.resolveScopeContext)(user, [client_1.UserRole.FINANCIAL_DIRECTOR]);
        const payrollPeriod = `${dto.year}-${String(dto.month).padStart(2, '0')}`;
        return {
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ payrollPeriod }, scope, dto.subsidiaryId),
            payrollPeriod,
        };
    }
    async getPayrollSummary(dto, user) {
        const { where, payrollPeriod } = this.payrollPeriodWhere(dto, user);
        const records = await this.prisma.payrollRecord.findMany({
            where,
            select: {
                grossSalary: true,
                netSalary: true,
                cnpsEmployee: true,
                cnpsEmployer: true,
                cfcEmployee: true,
                cfcEmployer: true,
                irpp: true,
                cac: true,
                fne: true,
                totalEmployerCost: true,
            },
        });
        const sum = (field) => records.reduce((acc, r) => acc + Number(r[field]), 0);
        return {
            period: payrollPeriod,
            employeeCount: records.length,
            grossSalary: sum('grossSalary'),
            netSalary: sum('netSalary'),
            cnpsEmployee: sum('cnpsEmployee'),
            cnpsEmployer: sum('cnpsEmployer'),
            cnpsTotal: sum('cnpsEmployee') + sum('cnpsEmployer'),
            cfcEmployee: sum('cfcEmployee'),
            cfcEmployer: sum('cfcEmployer'),
            cfcTotal: sum('cfcEmployee') + sum('cfcEmployer'),
            irpp: sum('irpp'),
            cac: sum('cac'),
            irppTotal: sum('irpp') + sum('cac'),
            fne: sum('fne'),
            totalEmployerCost: sum('totalEmployerCost'),
        };
    }
    async getIrppDetail(dto, user) {
        const { where, payrollPeriod } = this.payrollPeriodWhere(dto, user);
        const records = await this.prisma.payrollRecord.findMany({
            where,
            select: {
                employeeName: true,
                grossSalary: true,
                irpp: true,
                cac: true,
                employee: { select: { socialSecurityNumber: true } },
            },
            orderBy: { employeeName: 'asc' },
        });
        const details = records.map((r) => ({
            employeeName: r.employeeName,
            matricule: r.employee?.socialSecurityNumber ?? '—',
            baseAmount: Number(r.grossSalary),
            irppAmount: Number(r.irpp) + Number(r.cac),
        }));
        return {
            period: payrollPeriod,
            details,
            totalAmount: details.reduce((acc, d) => acc + d.irppAmount, 0),
        };
    }
    async getCnpsDetail(dto, user) {
        const { where, payrollPeriod } = this.payrollPeriodWhere(dto, user);
        const records = await this.prisma.payrollRecord.findMany({
            where,
            select: {
                employeeName: true,
                grossSalary: true,
                cnpsEmployee: true,
                cnpsEmployer: true,
                employee: { select: { socialSecurityNumber: true } },
            },
            orderBy: { employeeName: 'asc' },
        });
        const details = records.map((r) => ({
            employeeName: r.employeeName,
            matricule: r.employee?.socialSecurityNumber ?? '—',
            baseAmount: Number(r.grossSalary),
            employeeShare: Number(r.cnpsEmployee),
            employerShare: Number(r.cnpsEmployer),
            total: Number(r.cnpsEmployee) + Number(r.cnpsEmployer),
        }));
        return {
            period: payrollPeriod,
            details,
            totalEmployee: details.reduce((acc, d) => acc + d.employeeShare, 0),
            totalEmployer: details.reduce((acc, d) => acc + d.employerShare, 0),
            total: details.reduce((acc, d) => acc + d.total, 0),
        };
    }
    async getCfcFneDetail(dto, user) {
        const { where, payrollPeriod } = this.payrollPeriodWhere(dto, user);
        const records = await this.prisma.payrollRecord.findMany({
            where,
            select: {
                employeeName: true,
                grossSalary: true,
                cfcEmployee: true,
                cfcEmployer: true,
                fne: true,
                employee: { select: { socialSecurityNumber: true } },
            },
            orderBy: { employeeName: 'asc' },
        });
        const cfcDetails = records.map((r) => ({
            employeeName: r.employeeName,
            matricule: r.employee?.socialSecurityNumber ?? '—',
            baseAmount: Number(r.grossSalary),
            amount: Number(r.cfcEmployee) + Number(r.cfcEmployer),
        }));
        const fneDetails = records.map((r) => ({
            employeeName: r.employeeName,
            matricule: r.employee?.socialSecurityNumber ?? '—',
            baseAmount: Number(r.grossSalary),
            amount: Number(r.fne),
        }));
        return {
            period: payrollPeriod,
            cfc: {
                details: cfcDetails,
                totalAmount: cfcDetails.reduce((acc, d) => acc + d.amount, 0),
            },
            fne: {
                details: fneDetails,
                totalAmount: fneDetails.reduce((acc, d) => acc + d.amount, 0),
            },
        };
    }
    async getVatSummary(dto, user) {
        const scope = (0, subsidiary_scope_1.resolveScopeContext)(user, [client_1.UserRole.FINANCIAL_DIRECTOR]);
        const monthStart = (0, date_fns_1.startOfMonth)(new Date(dto.year, dto.month - 1, 1));
        const monthEnd = (0, date_fns_1.endOfMonth)(monthStart);
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({
            orderDate: { gte: monthStart, lte: monthEnd },
            applyTax: true,
        }, scope, dto.subsidiaryId);
        const aggregate = await this.prisma.order.aggregate({
            where,
            _sum: { taxAmount: true, subtotal: true, totalAmount: true },
            _count: true,
        });
        return {
            period: `${dto.year}-${String(dto.month).padStart(2, '0')}`,
            orderCount: aggregate._count,
            taxableSubtotal: Number(aggregate._sum.subtotal ?? 0),
            vatCollected: Number(aggregate._sum.taxAmount ?? 0),
            totalWithTax: Number(aggregate._sum.totalAmount ?? 0),
        };
    }
    async getVatDetail(dto, user) {
        const scope = (0, subsidiary_scope_1.resolveScopeContext)(user, [client_1.UserRole.FINANCIAL_DIRECTOR]);
        const monthStart = (0, date_fns_1.startOfMonth)(new Date(dto.year, dto.month - 1, 1));
        const monthEnd = (0, date_fns_1.endOfMonth)(monthStart);
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({
            orderDate: { gte: monthStart, lte: monthEnd },
            applyTax: true,
        }, scope, dto.subsidiaryId);
        const orders = await this.prisma.order.findMany({
            where,
            select: {
                id: true,
                orderDate: true,
                customerName: true,
                subtotal: true,
                taxAmount: true,
                totalAmount: true,
            },
            orderBy: { orderDate: 'desc' },
        });
        return {
            period: `${dto.year}-${String(dto.month).padStart(2, '0')}`,
            details: orders.map((o) => ({
                orderId: o.id,
                date: o.orderDate,
                clientName: o.customerName,
                taxableAmount: Number(o.subtotal),
                vatAmount: Number(o.taxAmount),
                totalAmount: Number(o.totalAmount),
            })),
        };
    }
};
exports.TaxTransparencyService = TaxTransparencyService;
exports.TaxTransparencyService = TaxTransparencyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxTransparencyService);
//# sourceMappingURL=tax-transparency.service.js.map