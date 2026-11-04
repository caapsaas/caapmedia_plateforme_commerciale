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
var PayrollRecordService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollRecordService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const journalization_service_1 = require("../../accounting/journalization/journalization.service");
const accounting_outbox_service_1 = require("../../accounting/outbox/accounting-outbox.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const cameroonpayrollcalculator_service_1 = require("./cameroonpayrollcalculator.service");
const payroll_cumulative_service_1 = require("./payroll-cumulative.service");
let PayrollRecordService = PayrollRecordService_1 = class PayrollRecordService {
    prisma;
    calculator;
    journalization;
    outbox;
    cumulative;
    logger = new common_1.Logger(PayrollRecordService_1.name);
    constructor(prisma, calculator, journalization, outbox, cumulative) {
        this.prisma = prisma;
        this.calculator = calculator;
        this.journalization = journalization;
        this.outbox = outbox;
        this.cumulative = cumulative;
    }
    async create(dto, employeeId, subsidiaryId) {
        this.logger.log(`Création fiche de paie pour employé ${employeeId} - période ${dto.payrollPeriod}`);
        const existing = await this.prisma.payrollRecord.findUnique({
            where: {
                employeeId_payrollPeriod: {
                    employeeId,
                    payrollPeriod: dto.payrollPeriod,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Une fiche de paie existe déjà pour cet employé sur la période ${dto.payrollPeriod}`);
        }
        let calculated = null;
        if (!dto.grossSalary || dto.grossSalary === 0) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: employeeId },
            });
            if (!employee) {
                throw new common_1.NotFoundException(`Employé ${employeeId} introuvable`);
            }
            const payrollConfig = await this.prisma.payrollConfiguration.findUnique({
                where: { subsidiaryId },
            });
            calculated = this.calculator.calculate({
                baseSalary: Number(employee.baseSalary),
                bonus: Number(employee.bonus || 0),
                allowances: Number(dto.allowances || 0),
                overtime: Number(dto.overtime || 0),
                riskGroup: 'A',
                applyCfc: true,
                applyFne: true,
                payrollConfig: this.getCalculatorConfig(payrollConfig),
            });
        }
        const data = {
            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL),
            employeeName: dto.employeeName,
            payrollPeriod: dto.payrollPeriod,
            baseSalary: dto.baseSalary ?? calculated?.grossSalary ?? 0,
            bonus: dto.bonus ?? 0,
            allowances: dto.allowances ?? 0,
            overtime: dto.overtime ?? 0,
            otherEarnings: dto.otherEarnings ?? 0,
            grossSalary: dto.grossSalary ?? calculated?.grossSalary ?? 0,
            cnpsEmployee: dto.cnpsEmployee ?? calculated?.cnpsEmployee ?? 0,
            cfcEmployee: dto.cfcEmployee ?? calculated?.cfcEmployee ?? 0,
            irpp: dto.irpp ?? calculated?.irpp ?? 0,
            cac: dto.cac ?? calculated?.cac ?? 0,
            otherDeductions: dto.otherDeductions ?? 0,
            deductions: dto.deductions ?? calculated?.totalDeductions ?? 0,
            netSalary: dto.netSalary ?? calculated?.netSalary ?? 0,
            cnpsEmployer: dto.cnpsEmployer ?? calculated?.totalEmployerCharges ?? 0,
            cfcEmployer: dto.cfcEmployer ?? calculated?.cfcEmployer ?? 0,
            fne: dto.fne ?? calculated?.fne ?? 0,
            totalEmployerCost: dto.totalEmployerCost ?? calculated?.totalEmployerCost ?? 0,
            deductionsDetail: calculated?.deductionsDetail ?? dto.deductionsDetail ?? null,
            calculationMeta: calculated
                ? {
                    riskGroup: 'A',
                    cnpsCap: 750000,
                    calculatedAt: new Date().toISOString(),
                }
                : null,
            paymentDate: dto.paymentDate,
            signature: dto.signature,
            status: dto.status ?? client_1.PayrollStatus.PENDING,
            notes: dto.notes,
            employee: { connect: { id: employeeId } },
            subsidiary: { connect: { id: subsidiaryId } },
        };
        return this.prisma.payrollRecord.create({
            data,
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        baseSalary: true,
                        bonus: true,
                    },
                },
            },
        });
    }
    async findAll(subsidiaryId, paginationQuery = {}) {
        const where = subsidiaryId
            ? { subsidiaryId }
            : {};
        if (paginationQuery.search) {
            where.OR = [
                {
                    employeeName: {
                        contains: paginationQuery.search,
                        mode: 'insensitive',
                    },
                },
                {
                    payrollPeriod: {
                        contains: paginationQuery.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        return (0, pagination_1.paginate)(this.prisma.payrollRecord, {
            where,
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        baseSalary: true,
                        bonus: true,
                    },
                },
            },
            orderBy: [{ payrollPeriod: 'desc' }, { employeeName: 'asc' }],
        }, paginationQuery);
    }
    async findAllGlobal() {
        return this.prisma.payrollRecord.findMany({
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        baseSalary: true,
                        bonus: true,
                    },
                },
                subsidiary: {
                    select: {
                        id: true,
                        subsidiaryName: true,
                    },
                },
            },
            orderBy: [{ payrollPeriod: 'desc' }, { employeeName: 'asc' }],
        });
    }
    async findOne(id) {
        const record = await this.prisma.payrollRecord.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        baseSalary: true,
                        bonus: true,
                    },
                },
            },
        });
        if (!record) {
            throw new common_1.NotFoundException(`Fiche de paie ${id} introuvable`);
        }
        return record;
    }
    async update(id, dto) {
        await this.findOne(id);
        const current = await this.prisma.payrollRecord.findUnique({
            where: { id },
        });
        if (current?.status === client_1.PayrollStatus.PAID) {
            throw new common_1.BadRequestException('Impossible de modifier une fiche de paie déjà payée');
        }
        const { employeeId, ...updateData } = dto;
        const gross = updateData.grossSalary ?? Number(current.grossSalary);
        const deductions = updateData.deductions ?? Number(current.deductions);
        return this.prisma.payrollRecord.update({
            where: { id },
            data: {
                ...updateData,
                deductions: updateData.deductions,
                netSalary: updateData.netSalary ??
                    (gross !== undefined && deductions !== undefined
                        ? Number(gross) - Number(deductions)
                        : undefined),
            },
        });
    }
    async remove(id) {
        const record = await this.findOne(id);
        if (record.status === client_1.PayrollStatus.PAID) {
            throw new common_1.BadRequestException('Impossible de supprimer une fiche de paie déjà payée');
        }
        return this.prisma.payrollRecord.delete({ where: { id } });
    }
    async signPayrollRecord(id, signature, userId = 'system') {
        this.logger.log(`Signature de la fiche de paie ${id}`);
        const record = await this.findOne(id);
        if (record.status === client_1.PayrollStatus.PAID) {
            throw new common_1.BadRequestException('Cette fiche de paie est déjà signée/payée');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const payroll = await tx.payrollRecord.update({
                where: { id },
                data: {
                    signature,
                    status: client_1.PayrollStatus.PAID,
                    paymentDate: new Date(),
                },
                include: {
                    employee: {
                        select: {
                            firstName: true,
                            lastName: true,
                            baseSalary: true,
                            bonus: true,
                        },
                    },
                    subsidiary: { select: { id: true, subsidiaryName: true } },
                },
            });
            await this.outbox.enqueue(tx, {
                eventType: 'PAYROLL_ENTRY',
                subsidiaryId: payroll.subsidiaryId,
                payload: {
                    userId,
                    operationDate: payroll.paymentDate?.toISOString() || new Date().toISOString(),
                    amount: Number(payroll.grossSalary),
                    description: `Paie ${payroll.payrollPeriod} - ${payroll.employeeName}`,
                    sourceId: payroll.id,
                },
            });
            this.logger.log(`✅ Fiche signée + intention comptable enqueuée pour ${payroll.id}`);
            return payroll;
        });
        return updated;
    }
    async processPayroll(subsidiaryId, period, options) {
        this.logger.log(`Traitement de la paie - Filiale: ${subsidiaryId} | Période: ${period}`);
        if (!subsidiaryId?.trim()) {
            throw new common_1.BadRequestException('subsidiaryId manquant');
        }
        if (!/^\d{4}-\d{2}$/.test(period)) {
            throw new common_1.BadRequestException('Format de période invalide. Utilisez YYYY-MM (ex: 2026-07)');
        }
        const payrollConfig = await this.prisma.payrollConfiguration.findUnique({
            where: { subsidiaryId },
        });
        const activeEmployees = await this.prisma.employee.findMany({
            where: {
                subsidiaryId,
                status: client_1.EmployeeStatus.ACTIVE,
            },
        });
        if (activeEmployees.length === 0) {
            const allEmployees = await this.prisma.employee.findMany({
                where: { subsidiaryId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    status: true,
                },
            });
            this.logger.warn(`Aucun employé ACTIVE pour subsidiaryId=${subsidiaryId}. ` +
                `Total employés de la filiale: ${allEmployees.length}`);
            this.logger.warn(`Détail statuts: ${JSON.stringify(allEmployees.map((e) => ({
                name: `${e.firstName} ${e.lastName}`,
                status: e.status,
            })))}`);
            if (allEmployees.length === 0) {
                return {
                    count: 0,
                    message: `Aucun employé trouvé pour cette filiale (subsidiaryId=${subsidiaryId}). Vérifiez que les employés sont bien rattachés à cette filiale.`,
                };
            }
            const statuses = [...new Set(allEmployees.map((e) => e.status))];
            return {
                count: 0,
                message: `Aucun employé actif trouvé. ${allEmployees.length} employé(s) présent(s) avec le(s) statut(s): ${statuses.join(', ')}. Passez leur statut à ACTIVE pour générer la paie.`,
            };
        }
        const existingPayrolls = await this.prisma.payrollRecord.findMany({
            where: {
                subsidiaryId,
                payrollPeriod: period,
                employeeId: { in: activeEmployees.map((e) => e.id) },
            },
            select: { id: true, employeeId: true, status: true },
        });
        const existingEmployeeIds = new Set(existingPayrolls.map((p) => p.employeeId));
        let employeesToProcess = activeEmployees.filter((e) => !existingEmployeeIds.has(e.id));
        let regenerated = 0;
        if (options?.forceRegenerate && existingPayrolls.length > 0) {
            const protectedPayrolls = existingPayrolls.filter((payroll) => [client_1.PayrollStatus.SIGNED, client_1.PayrollStatus.PAID].includes(payroll.status));
            if (protectedPayrolls.length > 0) {
                throw new common_1.ConflictException(`Régénération refusée : ${protectedPayrolls.length} fiche(s) sont signées ou payées. Corrigez-les par un processus de régularisation.`);
            }
            this.logger.log(`🔄 Mode régénération: suppression de ${existingPayrolls.length} fiche(s) existante(s)`);
            await this.prisma.payrollRecord.deleteMany({
                where: {
                    id: { in: existingPayrolls.map((p) => p.id) },
                },
            });
            regenerated = existingPayrolls.length;
            employeesToProcess = activeEmployees;
        }
        if (employeesToProcess.length === 0) {
            this.logger.log(`Tous les employés actifs ont déjà une fiche de paie pour ${period}`);
            return {
                count: 0,
                message: `Tous les employés actifs ont déjà une fiche pour ${period}. Utilisez forceRegenerate=true pour regénérer.`,
                regenerated: 0,
            };
        }
        const riskGroup = options?.riskGroup ?? 'A';
        const applyCfc = options?.applyCfc ?? true;
        const applyFne = options?.applyFne ?? true;
        const year = period.substring(0, 4);
        const previousPayrolls = await this.prisma.payrollRecord.findMany({
            where: {
                subsidiaryId,
                payrollPeriod: { gte: `${year}-01`, lt: period },
                employeeId: { in: employeesToProcess.map((e) => e.id) },
            },
            select: { employeeId: true, grossSalary: true, cnpsEmployee: true, irpp: true },
        });
        const cumulativesMap = new Map();
        previousPayrolls.forEach((payroll) => {
            const previous = cumulativesMap.get(payroll.employeeId) ?? { gross: 0, cnps: 0, irpp: 0 };
            previous.gross += Number(payroll.grossSalary);
            previous.cnps += Number(payroll.cnpsEmployee);
            previous.irpp += Number(payroll.irpp);
            cumulativesMap.set(payroll.employeeId, previous);
        });
        const newPayrollsData = employeesToProcess.map((employee) => {
            const employeeCumulative = cumulativesMap.get(employee.id);
            const previousCnpsCumulative = employeeCumulative?.cnps ?? 0;
            const previousIrppCumulative = employeeCumulative?.irpp ?? 0;
            const previousGrossCumulative = employeeCumulative?.gross ?? 0;
            const totalIndemnities = Array.isArray(employee.indemnities)
                ? employee.indemnities.reduce((sum, ind) => sum + (Number(ind.amount) || 0), 0)
                : 0;
            const calc = this.calculator.calculate({
                baseSalary: Number(employee.baseSalary),
                bonus: Number(employee.bonus || 0),
                allowances: totalIndemnities,
                riskGroup,
                applyCfc,
                applyFne,
                previousCnpsCumulative,
                previousIrppCumulative,
                previousGrossCumulative,
                payrollConfig: this.getCalculatorConfig(payrollConfig),
            });
            return {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL),
                employeeId: employee.id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                payrollPeriod: period,
                baseSalary: employee.baseSalary,
                bonus: employee.bonus || 0,
                allowances: totalIndemnities,
                overtime: 0,
                otherEarnings: 0,
                grossSalary: calc.grossSalary,
                cnpsEmployee: calc.cnpsEmployee,
                cfcEmployee: calc.cfcEmployee,
                irpp: calc.irpp,
                cac: calc.cac,
                otherDeductions: 0,
                deductions: calc.totalDeductions,
                netSalary: calc.netSalary,
                cnpsEmployer: calc.cnpsEmployerPension +
                    calc.cnpsFamilyBenefits +
                    calc.cnpsAccidentRisk,
                cfcEmployer: calc.cfcEmployer,
                fne: calc.fne,
                totalEmployerCost: calc.totalEmployerCost,
                deductionsDetail: [
                    ...calc.deductionsDetail,
                    ...(Array.isArray(employee.indemnities) &&
                        employee.indemnities.length > 0
                        ? employee.indemnities.map((ind) => ({
                            label: `Indemnité - ${ind.type}`,
                            amount: Number(ind.amount),
                            type: 'INDEMNITIES',
                        }))
                        : []),
                ],
                calculationMeta: {
                    riskGroup,
                    cnpsCap: Number(payrollConfig?.cnpsCap ?? 750000),
                    cnpsEmployeeRate: Number(payrollConfig?.cnpsEmployeeRate ?? 0.042),
                    cfcEmployeeRate: applyCfc ? 0.01 : 0,
                    totalIndemnities,
                    calculatedAt: new Date().toISOString(),
                },
                status: client_1.PayrollStatus.PENDING,
                subsidiaryId,
            };
        });
        const result = await this.prisma.payrollRecord.createMany({
            data: newPayrollsData,
            skipDuplicates: true,
        });
        this.logger.log(`✅ ${result.count} fiche(s) de paie créée(s) pour la période ${period}`);
        try {
            await this.updateCumulativesForPeriod(subsidiaryId, period);
        }
        catch (error) {
            this.logger.warn(`⚠️ Erreur lors de la mise à jour des cumuls: ${error.message}`);
        }
        let message = `${result.count} fiche(s) de paie générée(s) avec succès pour ${period}`;
        if (regenerated > 0) {
            message = `🔄 ${regenerated} fiche(s) régénérée(s) + ${result.count} nouvelle(s) créée(s) pour ${period}`;
        }
        return {
            count: result.count,
            message,
            regenerated,
        };
    }
    async updateCumulativesForPeriod(subsidiaryId, period) {
        const newPayrolls = await this.prisma.payrollRecord.findMany({
            where: {
                subsidiaryId,
                payrollPeriod: period,
                status: client_1.PayrollStatus.PENDING,
            },
        });
        this.logger.log(`📊 Mise à jour des cumuls pour ${newPayrolls.length} fiche(s)`);
        for (const payroll of newPayrolls) {
            try {
                const year = payroll.payrollPeriod.substring(0, 4);
                const annualRecords = await this.prisma.payrollRecord.findMany({
                    where: { employeeId: payroll.employeeId, payrollPeriod: { startsWith: year } },
                    orderBy: { payrollPeriod: 'desc' },
                });
                const totals = annualRecords.reduce((acc, record) => ({
                    gross: acc.gross + Number(record.grossSalary),
                    deductions: acc.deductions + Number(record.deductions),
                    net: acc.net + Number(record.netSalary),
                    cnps: acc.cnps + Number(record.cnpsEmployee),
                    cfc: acc.cfc + Number(record.cfcEmployee),
                    irpp: acc.irpp + Number(record.irpp),
                    cac: acc.cac + Number(record.cac),
                }), { gross: 0, deductions: 0, net: 0, cnps: 0, cfc: 0, irpp: 0, cac: 0 });
                await this.prisma.payrollCumulative.upsert({
                    where: { employeeId_year_month: { employeeId: payroll.employeeId, year, month: null } },
                    create: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_CUMULATIVE),
                        employeeId: payroll.employeeId,
                        subsidiaryId: payroll.subsidiaryId,
                        year,
                        month: null,
                        grossCumululative: new client_1.Prisma.Decimal(totals.gross),
                        deductionsCumululative: new client_1.Prisma.Decimal(totals.deductions),
                        netCumululative: new client_1.Prisma.Decimal(totals.net),
                        cnpsCumulative: new client_1.Prisma.Decimal(totals.cnps),
                        cfcCumulative: new client_1.Prisma.Decimal(totals.cfc),
                        irppCumulative: new client_1.Prisma.Decimal(totals.irpp),
                        cacCumulative: new client_1.Prisma.Decimal(totals.cac),
                        lastPayrollId: annualRecords[0]?.id ?? null,
                    },
                    update: {
                        grossCumululative: new client_1.Prisma.Decimal(totals.gross),
                        deductionsCumululative: new client_1.Prisma.Decimal(totals.deductions),
                        netCumululative: new client_1.Prisma.Decimal(totals.net),
                        cnpsCumulative: new client_1.Prisma.Decimal(totals.cnps),
                        cfcCumulative: new client_1.Prisma.Decimal(totals.cfc),
                        irppCumulative: new client_1.Prisma.Decimal(totals.irpp),
                        cacCumulative: new client_1.Prisma.Decimal(totals.cac),
                        lastPayrollId: annualRecords[0]?.id ?? null,
                    },
                });
                await this.prisma.payrollDeductionDetail.deleteMany({ where: { payrollRecordId: payroll.id } });
                await this.cumulative.createDeductionDetails(this.prisma, payroll.id, {
                    cnpsEmployee: Number(payroll.cnpsEmployee),
                    cfcEmployee: Number(payroll.cfcEmployee),
                    irpp: Number(payroll.irpp),
                    cac: Number(payroll.cac),
                    otherDeductions: Number(payroll.otherDeductions),
                }, Number(payroll.grossSalary));
            }
            catch (error) {
                this.logger.warn(`⚠️ Erreur cumul pour ${payroll.id}: ${error.message}`);
            }
        }
        this.logger.log(`✅ Cumuls et détails mis à jour`);
    }
    async simulatePayroll(employeeId, options) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Employé ${employeeId} introuvable`);
        }
        const payrollConfig = await this.prisma.payrollConfiguration.findUnique({
            where: { subsidiaryId: employee.subsidiaryId },
        });
        const result = this.calculator.calculate({
            baseSalary: Number(employee.baseSalary),
            bonus: options?.bonus ?? Number(employee.bonus || 0),
            allowances: options?.allowances ?? 0,
            overtime: options?.overtime ?? 0,
            riskGroup: options?.riskGroup ?? 'A',
            applyCfc: true,
            applyFne: true,
            payrollConfig: this.getCalculatorConfig(payrollConfig),
        });
        return {
            employee: {
                id: employee.id,
                fullName: `${employee.firstName} ${employee.lastName}`,
                baseSalary: employee.baseSalary,
            },
            simulation: result,
        };
    }
    async findByEmployee(employeeId, subsidiaryId) {
        return this.prisma.payrollRecord.findMany({
            where: { employeeId, ...(subsidiaryId ? { subsidiaryId } : {}) },
            orderBy: { payrollPeriod: 'desc' },
        });
    }
    async findEmployeeForScope(employeeId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            select: { subsidiaryId: true },
        });
        if (!employee)
            throw new common_1.NotFoundException(`Employé ${employeeId} introuvable`);
        return employee;
    }
    async findByPeriod(subsidiaryId, period) {
        return this.prisma.payrollRecord.findMany({
            where: {
                subsidiaryId,
                payrollPeriod: period,
            },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        baseSalary: true,
                        bonus: true,
                    },
                },
            },
            orderBy: { employeeName: 'asc' },
        });
    }
    getCalculatorConfig(config) {
        if (!config)
            return undefined;
        return {
            cnpsEmployeeRate: Number(config.cnpsEmployeeRate),
            cnpsEmployerRate: Number(config.cnpsEmployerRate),
            cfcEmployeeRate: Number(config.cfcEmployeeRate),
            cfcEmployerRate: Number(config.cfcEmployerRate),
            fneRate: Number(config.fneRate),
            cnpsCap: Number(config.cnpsCap),
            professionalExpenseRate: Number(config.professionalExpenseRate),
            fixedAbatementAnnual: Number(config.fixedAbatementAnnual),
            riskGroupARate: Number(config.riskGroupARate),
            riskGroupBRate: Number(config.riskGroupBRate),
            riskGroupCRate: Number(config.riskGroupCRate),
        };
    }
};
exports.PayrollRecordService = PayrollRecordService;
exports.PayrollRecordService = PayrollRecordService = PayrollRecordService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cameroonpayrollcalculator_service_1.CameroonPayrollCalculatorService,
        journalization_service_1.JournalizationService,
        accounting_outbox_service_1.AccountingOutboxService,
        payroll_cumulative_service_1.PayrollCumulativeService])
], PayrollRecordService);
//# sourceMappingURL=payrollrecord.service.js.map