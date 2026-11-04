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
var PayrollBonusAndChargeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollBonusAndChargeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const cameroonpayrollcalculator_service_1 = require("./cameroonpayrollcalculator.service");
const accounting_outbox_service_1 = require("../../accounting/outbox/accounting-outbox.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
let PayrollBonusAndChargeService = PayrollBonusAndChargeService_1 = class PayrollBonusAndChargeService {
    prisma;
    calculator;
    outbox;
    logger = new common_1.Logger(PayrollBonusAndChargeService_1.name);
    CNPS_PAYABLE_ACCOUNT = '424100';
    CFC_PAYABLE_ACCOUNT = '424200';
    IRPP_PAYABLE_ACCOUNT = '441000';
    CAC_PAYABLE_ACCOUNT = '441001';
    FNE_PAYABLE_ACCOUNT = '441002';
    BANK_ACCOUNT = '521000';
    constructor(prisma, calculator, outbox) {
        this.prisma = prisma;
        this.calculator = calculator;
        this.outbox = outbox;
    }
    async getBonusSubsidiaryId(bonusId) {
        const bonus = await this.prisma.payrollBonus.findUnique({
            where: { id: bonusId }, select: { subsidiaryId: true },
        });
        if (!bonus)
            throw new common_1.NotFoundException(`Bonus ${bonusId} introuvable`);
        return bonus.subsidiaryId;
    }
    async getChargeSubsidiaryId(chargeId) {
        const charge = await this.prisma.payrollChargePayment.findUnique({
            where: { id: chargeId }, select: { subsidiaryId: true },
        });
        if (!charge)
            throw new common_1.NotFoundException(`Charge ${chargeId} introuvable`);
        return charge.subsidiaryId;
    }
    async generateThirteenthMonth(employeeId, month, year) {
        this.logger.log(`🎁 Génération 13e mois: Employé ${employeeId}, mois ${month}`);
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            include: { subsidiary: true },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Employé ${employeeId} introuvable`);
        }
        const payrolls = await this.prisma.payrollRecord.findMany({
            where: {
                employeeId,
                payrollPeriod: { startsWith: year },
                status: { in: [client_1.PayrollStatus.SIGNED, client_1.PayrollStatus.PAID] },
            },
            orderBy: { payrollPeriod: 'asc' },
        });
        if (!payrolls.length) {
            throw new common_1.BadRequestException(`Aucune fiche paie trouvée pour employé ${employeeId} en ${year}`);
        }
        this.logger.log(`📊 ${payrolls.length} fiches paie trouvées pour calcul 13e mois`);
        const totalGross = payrolls.reduce((sum, p) => sum + Number(p.grossSalary), 0);
        const thirteenthGross = Math.round(totalGross / payrolls.length);
        this.logger.log(`💰 13e mois brut = ${totalGross} / ${payrolls.length} = ${thirteenthGross} FCFA`);
        const result = this.calculator.calculate({
            baseSalary: thirteenthGross,
            riskGroup: employee.categoryCodeCNPS === 'C' ? 'C' : 'A',
            applyCfc: true,
            applyFne: true,
        });
        const existingBonus = await this.prisma.payrollBonus.findFirst({
            where: {
                employeeId,
                bonusTypeId: await this.getOrCreateBonusTypeId(employee.subsidiaryId, '13e_mois'),
                period: month,
            },
        });
        if (existingBonus) {
            throw new common_1.ConflictException(`Un bonus 13e mois existe déjà pour ${employeeId} en ${month}`);
        }
        const bonus = await this.prisma.payrollBonus.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_BONUS),
                employeeId,
                bonusTypeId: await this.getOrCreateBonusTypeId(employee.subsidiaryId, '13e_mois'),
                grossAmount: new client_1.Prisma.Decimal(result.grossSalary),
                netAmount: new client_1.Prisma.Decimal(result.netSalary),
                cnpsDeduction: new client_1.Prisma.Decimal(result.cnpsEmployee),
                cfcDeduction: new client_1.Prisma.Decimal(result.cfcEmployee),
                irppDeduction: new client_1.Prisma.Decimal(result.irpp),
                cacDeduction: new client_1.Prisma.Decimal(result.cac),
                period: month,
                status: client_1.PayrollBonusStatus.PENDING,
                subsidiaryId: employee.subsidiaryId,
                notes: `Calculé sur moyenne ${payrolls.length} mois (total ${totalGross} FCFA)`,
            },
        });
        this.logger.log(`✅ 13e mois créé: ${bonus.id} - Brut ${result.grossSalary} FCFA, Net ${result.netSalary} FCFA`);
        return bonus;
    }
    async approveBonus(bonusId, approvedBy) {
        this.logger.log(`✅ Approbation bonus: ${bonusId} par ${approvedBy}`);
        const bonus = await this.prisma.payrollBonus.findUnique({
            where: { id: bonusId },
        });
        if (!bonus) {
            throw new common_1.NotFoundException(`Bonus ${bonusId} introuvable`);
        }
        if (bonus.status !== client_1.PayrollBonusStatus.PENDING) {
            throw new common_1.ConflictException(`Bonus n'est pas en statut PENDING (actuellement: ${bonus.status})`);
        }
        const updated = await this.prisma.payrollBonus.update({
            where: { id: bonusId },
            data: {
                status: client_1.PayrollBonusStatus.APPROVED,
                approvedBy,
                approvedAt: new Date(),
            },
        });
        this.logger.log(`✅ Bonus ${bonusId} approuvé`);
        return updated;
    }
    async recordBonusPayment(bonusId, bankTransferId, paymentDate = new Date()) {
        this.logger.log(`💳 Enregistrement paiement bonus: ${bonusId}`);
        const bonus = await this.prisma.payrollBonus.findUnique({
            where: { id: bonusId },
            include: { employee: true },
        });
        if (!bonus) {
            throw new common_1.NotFoundException(`Bonus ${bonusId} introuvable`);
        }
        if (bonus.status !== client_1.PayrollBonusStatus.APPROVED) {
            throw new common_1.ConflictException(`Bonus doit être en statut APPROVED avant paiement (actuellement: ${bonus.status})`);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const paid = await tx.payrollBonus.update({
                where: { id: bonusId },
                data: {
                    status: client_1.PayrollBonusStatus.PAID,
                    paymentDate,
                    bankTransferId,
                },
            });
            await this.outbox.enqueue(tx, {
                eventType: 'BONUS_ENTRY',
                subsidiaryId: bonus.subsidiaryId,
                payload: {
                    userId: 'system',
                    operationDate: paymentDate.toISOString(),
                    amount: Number(bonus.grossAmount),
                    description: `Paiement bonus - ${bonus.employee.firstName} ${bonus.employee.lastName}`,
                    sourceId: bonusId,
                },
            });
            return paid;
        });
        this.logger.log(`✅ Paiement bonus ${bonusId} enregistré (Virement: ${bankTransferId}) + intention comptable enqueuée`);
        return updated;
    }
    async cancelBonus(bonusId, reason) {
        this.logger.warn(`❌ Annulation bonus: ${bonusId} - Raison: ${reason}`);
        const bonus = await this.prisma.payrollBonus.findUnique({
            where: { id: bonusId },
        });
        if (!bonus) {
            throw new common_1.NotFoundException(`Bonus ${bonusId} introuvable`);
        }
        if (bonus.status === client_1.PayrollBonusStatus.PAID) {
            throw new common_1.ConflictException(`Impossible d'annuler un bonus PAID. Créer une écriture de contre-passation au lieu.`);
        }
        const updated = await this.prisma.payrollBonus.update({
            where: { id: bonusId },
            data: {
                status: client_1.PayrollBonusStatus.CANCELLED,
                notes: `${bonus.notes || ''}\n--- ANNULÉ: ${reason}`,
            },
        });
        this.logger.log(`✅ Bonus ${bonusId} annulé`);
        return updated;
    }
    async extractBonusesFromPayroll(subsidiaryId, month) {
        this.logger.log(`🎁 Extraction des bonus des fiches de paie: ${month} pour filiale ${subsidiaryId}`);
        const payrolls = await this.prisma.payrollRecord.findMany({
            where: {
                subsidiaryId,
                payrollPeriod: month,
                bonus: { gt: 0 },
                status: { in: [client_1.PayrollStatus.SIGNED, client_1.PayrollStatus.PAID] },
            },
            include: { employee: true },
        });
        if (!payrolls.length) {
            this.logger.log(`⚠️ Aucune fiche paie avec bonus pour ${month}`);
            return { created: 0, skipped: 0, total: 0 };
        }
        this.logger.log(`📊 ${payrolls.length} fiche(s) paie avec bonus trouvée(s)`);
        let created = 0;
        let skipped = 0;
        for (const payroll of payrolls) {
            try {
                const bonusAmount = Number(payroll.bonus);
                const bonusTypeId = await this.getOrCreateBonusTypeId(subsidiaryId, 'payroll_bonus');
                const existing = await this.prisma.payrollBonus.findFirst({
                    where: {
                        employeeId: payroll.employeeId,
                        bonusTypeId,
                        period: month,
                    },
                });
                if (existing) {
                    this.logger.log(`⏭️ Bonus existant pour ${payroll.employee.firstName} ${payroll.employee.lastName} - skippé`);
                    skipped++;
                    continue;
                }
                const result = this.calculator.calculate({
                    baseSalary: bonusAmount,
                    riskGroup: 'A',
                    applyCfc: true,
                    applyFne: true,
                });
                const bonus = await this.prisma.payrollBonus.create({
                    data: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_BONUS),
                        employeeId: payroll.employeeId,
                        bonusTypeId,
                        grossAmount: new client_1.Prisma.Decimal(bonusAmount),
                        netAmount: new client_1.Prisma.Decimal(result.netSalary),
                        cnpsDeduction: new client_1.Prisma.Decimal(result.cnpsEmployee),
                        cfcDeduction: new client_1.Prisma.Decimal(result.cfcEmployee),
                        irppDeduction: new client_1.Prisma.Decimal(result.irpp),
                        cacDeduction: new client_1.Prisma.Decimal(result.cac),
                        period: month,
                        status: client_1.PayrollBonusStatus.PENDING,
                        subsidiaryId,
                        notes: `Extrait de fiche paie ${payroll.id}`,
                    },
                });
                this.logger.log(`✅ Bonus créé pour ${payroll.employee.firstName} ${payroll.employee.lastName}: ${bonusAmount} FCFA`);
                created++;
            }
            catch (error) {
                this.logger.error(`❌ Erreur lors de l'extraction bonus pour ${payroll.employeeId}: ${error.message}`);
                skipped++;
            }
        }
        this.logger.log(`✅ Extraction terminée: ${created} bonus créé(s), ${skipped} skippé(s)`);
        return {
            created,
            skipped,
            total: payrolls.length,
        };
    }
    async getPendingBonuses(subsidiaryId) {
        return this.prisma.payrollBonus.findMany({
            where: {
                subsidiaryId,
                status: client_1.PayrollBonusStatus.PENDING,
            },
            include: {
                employee: true,
                bonusType: { select: { label: true, code: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getApprovedBonuses(subsidiaryId) {
        return this.prisma.payrollBonus.findMany({
            where: {
                subsidiaryId,
                status: client_1.PayrollBonusStatus.APPROVED,
            },
            include: {
                employee: true,
                bonusType: { select: { label: true, code: true } },
            },
            orderBy: { approvedAt: 'asc' },
        });
    }
    async accumulateEmployerCharges(subsidiaryId, month) {
        this.logger.log(`📊 Accumulation charges complètes: ${month}`);
        if (!subsidiaryId) {
            throw new common_1.BadRequestException("SubsidiaryId manquant - impossible d'accumuler les charges");
        }
        const payrolls = await this.prisma.payrollRecord.findMany({
            where: {
                subsidiaryId,
                payrollPeriod: month,
                status: { in: [client_1.PayrollStatus.PENDING, client_1.PayrollStatus.SIGNED, client_1.PayrollStatus.PAID] },
            },
            include: {
                employee: { select: { paymentMethod: true } },
            },
        });
        if (!payrolls.length) {
            this.logger.warn(`⚠️ Aucune fiche paie pour ${month}`);
            return {
                month,
                totalPayrolls: 0,
                employerCharges: {},
                salaryDeductions: { byPaymentMethod: {}, grandTotal: 0 },
                monthlyPrimes: {
                    totalPrimes: 0,
                    averagePrimePerEmployee: 0,
                    employeesWithPrimes: 0,
                },
                bonusCharges: {
                    totalBonuses: 0,
                    deductionsTotal: { cnps: 0, cfc: 0, irpp: 0, cac: 0, other: 0 },
                    netBonusesTotal: 0,
                },
                grandTotalAllCharges: 0,
            };
        }
        const employerChargesMap = {
            CNPS: payrolls.reduce((sum, p) => sum + Number(p.cnpsEmployer), 0),
            CFC: payrolls.reduce((sum, p) => sum + Number(p.cfcEmployer), 0),
            FNE: payrolls.reduce((sum, p) => sum + Number(p.fne), 0),
        };
        const salaryDeductionsByMethod = {};
        for (const payroll of payrolls) {
            const method = payroll.employee?.paymentMethod || 'UNKNOWN';
            if (!salaryDeductionsByMethod[method]) {
                salaryDeductionsByMethod[method] = {
                    grossSalary: 0,
                    netSalary: 0,
                    cnps: 0,
                    cfc: 0,
                    irpp: 0,
                    cac: 0,
                    other: 0,
                    total: 0,
                };
            }
            salaryDeductionsByMethod[method].grossSalary += Number(payroll.grossSalary || 0);
            salaryDeductionsByMethod[method].netSalary += Number(payroll.netSalary || 0);
            salaryDeductionsByMethod[method].cnps += Number(payroll.cnpsEmployee || 0);
            salaryDeductionsByMethod[method].cfc += Number(payroll.cfcEmployee || 0);
            salaryDeductionsByMethod[method].irpp += Number(payroll.irpp || 0);
            salaryDeductionsByMethod[method].cac += Number(payroll.cac || 0);
            salaryDeductionsByMethod[method].other += Number(payroll.otherDeductions || 0);
            salaryDeductionsByMethod[method].total =
                salaryDeductionsByMethod[method].cnps +
                    salaryDeductionsByMethod[method].cfc +
                    salaryDeductionsByMethod[method].irpp +
                    salaryDeductionsByMethod[method].cac +
                    salaryDeductionsByMethod[method].other;
        }
        const totalSalaryDeductions = Object.values(salaryDeductionsByMethod).reduce((sum, deductions) => sum +
            deductions.cnps +
            deductions.cfc +
            deductions.irpp +
            deductions.cac +
            deductions.other, 0);
        const totalMonthlyPrimes = payrolls.reduce((sum, p) => sum + Number(p.bonus || 0), 0);
        const employeesWithPrimes = payrolls.filter((p) => Number(p.bonus || 0) > 0).length;
        const averagePrimePerEmployee = employeesWithPrimes > 0
            ? Math.round(totalMonthlyPrimes / employeesWithPrimes)
            : 0;
        const monthlyPrimesData = {
            totalPrimes: totalMonthlyPrimes,
            averagePrimePerEmployee,
            employeesWithPrimes,
        };
        const approvedBonuses = await this.prisma.payrollBonus.findMany({
            where: {
                subsidiaryId,
                period: month,
                status: { in: [client_1.PayrollBonusStatus.APPROVED, client_1.PayrollBonusStatus.PAID] },
            },
        });
        const bonusChargesData = {
            totalBonuses: approvedBonuses.length,
            deductionsTotal: {
                cnps: 0,
                cfc: 0,
                irpp: 0,
                cac: 0,
                other: 0,
            },
            netBonusesTotal: 0,
        };
        for (const bonus of approvedBonuses) {
            bonusChargesData.deductionsTotal.cnps += Number(bonus.cnpsDeduction || 0);
            bonusChargesData.deductionsTotal.cfc += Number(bonus.cfcDeduction || 0);
            bonusChargesData.deductionsTotal.irpp += Number(bonus.irppDeduction || 0);
            bonusChargesData.deductionsTotal.cac += Number(bonus.cacDeduction || 0);
            bonusChargesData.deductionsTotal.other += Number(bonus.otherDeductions || 0);
            bonusChargesData.netBonusesTotal += Number(bonus.netAmount || 0);
        }
        this.logger.log(`📋 Totaux du mois ${month}: CNPS=${employerChargesMap.CNPS}, CFC=${employerChargesMap.CFC}, FNE=${employerChargesMap.FNE}`);
        const result = {
            month,
            totalPayrolls: payrolls.length,
            employerCharges: {},
            salaryDeductions: {
                byPaymentMethod: {},
                grandTotal: totalSalaryDeductions,
            },
            monthlyPrimes: monthlyPrimesData,
            bonusCharges: bonusChargesData,
            grandTotalAllCharges: 0,
        };
        let employerChargesTotal = 0;
        for (const [chargeType, amount] of Object.entries(employerChargesMap)) {
            if (amount > 0) {
                const dueDate = this.calculateDueDate(chargeType, month);
                try {
                    const charge = await this.prisma.payrollChargePayment.upsert({
                        where: {
                            subsidiaryId_chargeType_month: {
                                subsidiaryId,
                                chargeType,
                                month,
                            },
                        },
                        create: {
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_CHARGE),
                            subsidiaryId,
                            chargeType,
                            month,
                            grossAmount: new client_1.Prisma.Decimal(amount),
                            netAmount: new client_1.Prisma.Decimal(amount),
                            status: client_1.PayrollChargePaymentStatus.ACCRUED,
                            dueDate,
                        },
                        update: {
                            grossAmount: new client_1.Prisma.Decimal(amount),
                            netAmount: new client_1.Prisma.Decimal(amount),
                        },
                    });
                    result.employerCharges[chargeType] = {
                        amount,
                        dueDate: dueDate.toISOString().split('T')[0],
                        status: charge.status,
                    };
                    employerChargesTotal += amount;
                    this.logger.log(`✅ ${chargeType} accumulée pour ${month}: ${amount} FCFA (due ${dueDate.toLocaleDateString('fr-FR')})`);
                }
                catch (error) {
                    this.logger.error(`❌ Erreur lors de l'accumulation ${chargeType}: ${error.message}`);
                    throw error;
                }
            }
        }
        for (const [method, deductions] of Object.entries(salaryDeductionsByMethod)) {
            const total = deductions.cnps +
                deductions.cfc +
                deductions.irpp +
                deductions.cac +
                deductions.other;
            result.salaryDeductions.byPaymentMethod[method] = {
                ...deductions,
                total,
            };
        }
        const bonusDeductionsTotal = bonusChargesData.deductionsTotal.cnps +
            bonusChargesData.deductionsTotal.cfc +
            bonusChargesData.deductionsTotal.irpp +
            bonusChargesData.deductionsTotal.cac +
            bonusChargesData.deductionsTotal.other;
        result.grandTotalAllCharges =
            employerChargesTotal + totalSalaryDeductions + bonusDeductionsTotal;
        this.logger.log(`✅ Accumulation complète: Charges patronales=${employerChargesTotal}, Déductions salariales=${totalSalaryDeductions}, Déductions bonus=${bonusDeductionsTotal}`);
        return result;
    }
    async recordChargePayment(chargePaymentId, bankTransferId, paidAmount, declarationNumber) {
        this.logger.log(`💳 Enregistrement paiement charge: ${chargePaymentId}`);
        const charge = await this.prisma.payrollChargePayment.findUnique({
            where: { id: chargePaymentId },
            include: { subsidiary: true },
        });
        if (!charge) {
            throw new common_1.NotFoundException(`Charge ${chargePaymentId} introuvable`);
        }
        const grossAmount = Number(charge.grossAmount);
        const isPaid = paidAmount >= grossAmount;
        const isPartial = paidAmount > 0 && paidAmount < grossAmount;
        this.logger.log(`💰 ${charge.chargeType} ${charge.month}: ${paidAmount} FCFA payé`);
        const updated = await this.prisma.$transaction(async (tx) => {
            const newStatus = isPaid
                ? client_1.PayrollChargePaymentStatus.PAID
                : isPartial
                    ? client_1.PayrollChargePaymentStatus.PARTIAL
                    : client_1.PayrollChargePaymentStatus.PAID;
            const paid = await tx.payrollChargePayment.update({
                where: { id: chargePaymentId },
                data: {
                    paidAmount: new client_1.Prisma.Decimal(paidAmount),
                    paymentDate: new Date(),
                    bankTransferId,
                    status: newStatus,
                    declarationNumber,
                },
            });
            await this.outbox.enqueue(tx, {
                eventType: 'CHARGE_PAYMENT_ENTRY',
                subsidiaryId: charge.subsidiaryId,
                payload: {
                    userId: 'system',
                    operationDate: new Date().toISOString(),
                    amount: paidAmount,
                    description: `Paiement ${charge.chargeType} - ${charge.month}`,
                    sourceId: chargePaymentId,
                },
            });
            return paid;
        });
        this.logger.log(`✅ Paiement enregistré: ${charge.chargeType} ${charge.month} → ${updated.status} + intention comptable enqueuée`);
        return updated;
    }
    async getOverdueCharges(subsidiaryId) {
        return this.prisma.payrollChargePayment.findMany({
            where: {
                subsidiaryId,
                dueDate: { lte: new Date() },
                status: {
                    in: [
                        client_1.PayrollChargePaymentStatus.ACCRUED,
                        client_1.PayrollChargePaymentStatus.DUE,
                        client_1.PayrollChargePaymentStatus.PARTIAL,
                    ],
                },
            },
            orderBy: { dueDate: 'asc' },
        });
    }
    async getChargesDueThisMonth(subsidiaryId) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return this.prisma.payrollChargePayment.findMany({
            where: {
                subsidiaryId,
                dueDate: {
                    gte: firstDay,
                    lte: lastDay,
                },
                status: {
                    in: [
                        client_1.PayrollChargePaymentStatus.ACCRUED,
                        client_1.PayrollChargePaymentStatus.DUE,
                        client_1.PayrollChargePaymentStatus.PARTIAL,
                    ],
                },
            },
            orderBy: { dueDate: 'asc' },
        });
    }
    async createSalaryCharge(subsidiaryId, month, paymentMethod) {
        this.logger.log(`💰 Création charge salaire ${paymentMethod} pour ${month}`);
        if (!['BANK_TRANSFER', 'CHECK', 'CASH'].includes(paymentMethod)) {
            throw new common_1.BadRequestException(`Type de paiement invalide: ${paymentMethod}. Utilisez BANK_TRANSFER, CHECK, ou CASH.`);
        }
        const chargeTypeMap = {
            BANK_TRANSFER: 'SALAIRE_VIREMENT_BANCAIRE',
            CHECK: 'SALAIRE_CHEQUE',
            CASH: 'SALAIRE_ESPECE',
        };
        const chargeType = chargeTypeMap[paymentMethod];
        const accumulated = await this.accumulateEmployerCharges(subsidiaryId, month);
        const salaryData = accumulated.salaryDeductions.byPaymentMethod[paymentMethod];
        if (!salaryData) {
            throw new common_1.NotFoundException(`Aucune donnée salariale trouvée pour le type de paiement ${paymentMethod} en ${month}`);
        }
        const salaryAmount = salaryData.grossSalary;
        if (salaryAmount <= 0) {
            throw new common_1.BadRequestException(`Le montant du salaire pour ${paymentMethod} est 0 ou négatif en ${month}`);
        }
        this.logger.log(`📊 Montant récupéré pour ${paymentMethod}: ${salaryAmount} FCFA`);
        const existing = await this.prisma.payrollChargePayment.findFirst({
            where: {
                subsidiaryId,
                chargeType,
                month,
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Une charge ${chargeType} existe déjà pour ${month}`);
        }
        const dueDate = new Date(month + '-15');
        if (dueDate.getMonth() === 11) {
            dueDate.setFullYear(dueDate.getFullYear() + 1);
            dueDate.setMonth(0);
        }
        else {
            dueDate.setMonth(dueDate.getMonth() + 1);
        }
        const charge = await this.prisma.$transaction(async (tx) => {
            const created = await tx.payrollChargePayment.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PAYROLL_CHARGE),
                    subsidiaryId,
                    chargeType,
                    month,
                    grossAmount: new client_1.Prisma.Decimal(salaryAmount),
                    netAmount: new client_1.Prisma.Decimal(salaryAmount),
                    status: client_1.PayrollChargePaymentStatus.ACCRUED,
                    dueDate,
                },
            });
            await this.outbox.enqueue(tx, {
                eventType: 'CHARGE_PAYMENT_ENTRY',
                subsidiaryId,
                payload: {
                    userId: 'system',
                    operationDate: new Date().toISOString(),
                    amount: salaryAmount,
                    description: `Charge salaire ${paymentMethod} - ${month}`,
                    sourceId: created.id,
                },
            });
            return created;
        });
        this.logger.log(`✅ Charge ${chargeType} créée: ${charge.id} - ${salaryAmount} FCFA`);
        return charge;
    }
    async updateChargeStatusesCron() {
        const now = new Date();
        const result = await this.prisma.payrollChargePayment.updateMany({
            where: {
                dueDate: { lte: now },
                status: client_1.PayrollChargePaymentStatus.ACCRUED,
            },
            data: { status: client_1.PayrollChargePaymentStatus.DUE },
        });
        if (result.count > 0) {
            this.logger.log(`📌 ${result.count} charges ACCRUED → DUE`);
        }
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const overdueCharges = await this.prisma.payrollChargePayment.findMany({
            where: {
                dueDate: { lte: sevenDaysAgo },
                status: {
                    in: [
                        client_1.PayrollChargePaymentStatus.DUE,
                        client_1.PayrollChargePaymentStatus.PARTIAL,
                    ],
                },
            },
        });
        let overdueCount = 0;
        for (const charge of overdueCharges) {
            if (Number(charge.paidAmount) < Number(charge.grossAmount)) {
                await this.prisma.payrollChargePayment.update({
                    where: { id: charge.id },
                    data: { status: client_1.PayrollChargePaymentStatus.OVERDUE },
                });
                overdueCount++;
            }
        }
        if (overdueCount > 0) {
            this.logger.warn(`🚨 ${overdueCount} charges maintenant OVERDUE`);
        }
        return result.count + overdueCount;
    }
    async getChargesSummary(subsidiaryId, startMonth, endMonth) {
        const charges = await this.prisma.payrollChargePayment.findMany({
            where: {
                subsidiaryId,
                month: {
                    gte: startMonth,
                    lte: endMonth,
                },
            },
        });
        const summary = {
            byChargeType: {},
            overallTotal: 0,
            overallPaid: 0,
            overallPending: 0,
            overallOverdue: 0,
        };
        for (const charge of charges) {
            const chargeType = charge.chargeType;
            const grossAmount = Number(charge.grossAmount);
            const paidAmount = Number(charge.paidAmount);
            const isPaid = charge.status === client_1.PayrollChargePaymentStatus.PAID;
            const isOverdue = charge.status === client_1.PayrollChargePaymentStatus.OVERDUE;
            if (!summary.byChargeType[chargeType]) {
                summary.byChargeType[chargeType] = {
                    total: 0,
                    paid: 0,
                    pending: 0,
                    overdue: 0,
                };
            }
            summary.byChargeType[chargeType].total += grossAmount;
            summary.byChargeType[chargeType].paid += paidAmount;
            if (!isPaid) {
                summary.byChargeType[chargeType].pending += grossAmount - paidAmount;
            }
            if (isOverdue) {
                summary.byChargeType[chargeType].overdue += grossAmount - paidAmount;
            }
            summary.overallTotal += grossAmount;
            summary.overallPaid += paidAmount;
            if (!isPaid) {
                summary.overallPending += grossAmount - paidAmount;
            }
            if (isOverdue) {
                summary.overallOverdue += grossAmount - paidAmount;
            }
        }
        return summary;
    }
    async getOrCreateBonusTypeId(subsidiaryId, code) {
        let bonusType = await this.prisma.payrollBonusType.findFirst({
            where: { subsidiaryId, code },
        });
        if (!bonusType) {
            this.logger.log(`📝 Création type bonus: ${code}`);
            const labelMap = {
                '13e_mois': '13e Mois',
                performance_bonus: 'Prime de Performance',
                severance: 'Indemnité de Fin de Contrat',
                retention_bonus: 'Prime de Rétention',
                payroll_bonus: 'Bonus de Paie',
            };
            bonusType = await this.prisma.payrollBonusType.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.BONUS_TYPE),
                    code,
                    label: labelMap[code] || code,
                    isTaxable: true,
                    isSubjectToCnps: true,
                    isSubjectToCfc: true,
                    paymentTiming: code === '13e_mois' ? 'DECEMBER' : 'ON_TERMINATION',
                    subsidiaryId,
                },
            });
            this.logger.log(`✅ Type bonus créé: ${bonusType.id}`);
        }
        return bonusType.id;
    }
    calculateDueDate(chargeType, month) {
        const [year, monthNum] = month.split('-');
        const nextMonthDate = new Date(parseInt(year), parseInt(monthNum), 1);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        switch (chargeType) {
            case 'CNPS':
                nextMonthDate.setDate(7);
                break;
            case 'IRPP':
            case 'CAC':
                nextMonthDate.setDate(15);
                break;
            case 'CFC':
            case 'FNE':
                nextMonthDate.setDate(0);
                break;
            default:
                nextMonthDate.setDate(0);
        }
        return nextMonthDate;
    }
};
exports.PayrollBonusAndChargeService = PayrollBonusAndChargeService;
exports.PayrollBonusAndChargeService = PayrollBonusAndChargeService = PayrollBonusAndChargeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cameroonpayrollcalculator_service_1.CameroonPayrollCalculatorService,
        accounting_outbox_service_1.AccountingOutboxService])
], PayrollBonusAndChargeService);
//# sourceMappingURL=payroll-bonus-and-charge.service.js.map