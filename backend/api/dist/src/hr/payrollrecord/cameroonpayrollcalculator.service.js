"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameroonPayrollCalculatorService = void 0;
const common_1 = require("@nestjs/common");
let CameroonPayrollCalculatorService = class CameroonPayrollCalculatorService {
    CNPS_EMPLOYEE_RATE = 0.042;
    CNPS_EMPLOYER_PENSION = 0.042;
    CNPS_FAMILY = 0.07;
    CNPS_CAP = 750_000;
    CFC_EMPLOYEE = 0.01;
    CFC_EMPLOYER = 0.015;
    FNE_RATE = 0.01;
    PROFESSIONAL_EXPENSE_RATE = 0.3;
    FIXED_ABATEMENT_ANNUAL = 500_000;
    RISK_RATES = {
        A: 0.0175,
        B: 0.025,
        C: 0.05,
    };
    calculate(input) {
        const config = input.payrollConfig;
        const cnpsCap = config?.cnpsCap ?? this.CNPS_CAP;
        const cnpsEmployeeRate = config?.cnpsEmployeeRate ?? this.CNPS_EMPLOYEE_RATE;
        const cnpsEmployerRate = config?.cnpsEmployerRate ?? this.CNPS_EMPLOYER_PENSION;
        const cfcEmployeeRate = config?.cfcEmployeeRate ?? this.CFC_EMPLOYEE;
        const cfcEmployerRate = config?.cfcEmployerRate ?? this.CFC_EMPLOYER;
        const fneRate = config?.fneRate ?? this.FNE_RATE;
        const professionalExpenseRate = config?.professionalExpenseRate ?? this.PROFESSIONAL_EXPENSE_RATE;
        const fixedAbatementAnnual = config?.fixedAbatementAnnual ?? this.FIXED_ABATEMENT_ANNUAL;
        const gross = (input.baseSalary || 0) +
            (input.bonus || 0) +
            (input.allowances || 0) +
            (input.overtime || 0) +
            (input.otherTaxable || 0);
        const cnpsBase = Math.min(gross, cnpsCap);
        const cnpsEmployee = this.calculateCnpsEmployee(gross, cnpsEmployeeRate, cnpsCap);
        const cfcEmployee = input.applyCfc !== false ? this.round(gross * cfcEmployeeRate) : 0;
        const professionalExpense = this.round(gross * professionalExpenseRate);
        const grossCumulativeAnnual = (input.previousGrossCumulative || 0) + gross;
        const cnpsCumulativeAnnual = (input.previousCnpsCumulative || 0) + cnpsEmployee;
        const { irpp, cac } = this.calculateIrppWithCumulative(grossCumulativeAnnual, cnpsCumulativeAnnual, input.previousIrppCumulative || 0, professionalExpenseRate, fixedAbatementAnnual);
        const totalDeductions = cnpsEmployee + cfcEmployee + irpp + cac;
        const netSalary = this.round(gross - totalDeductions);
        const cnpsEmployerPension = this.round(cnpsBase * cnpsEmployerRate);
        const cnpsFamilyBenefits = this.round(cnpsBase * this.CNPS_FAMILY);
        const riskRate = input.riskGroup === 'B'
            ? config?.riskGroupBRate ?? this.RISK_RATES.B
            : input.riskGroup === 'C'
                ? config?.riskGroupCRate ?? this.RISK_RATES.C
                : config?.riskGroupARate ?? this.RISK_RATES.A;
        const cnpsAccidentRisk = this.round(gross * riskRate);
        const cfcEmployer = input.applyCfc !== false ? this.round(gross * cfcEmployerRate) : 0;
        const fne = input.applyFne !== false ? this.round(gross * fneRate) : 0;
        const totalEmployerCharges = cnpsEmployerPension +
            cnpsFamilyBenefits +
            cnpsAccidentRisk +
            cfcEmployer +
            fne;
        const totalEmployerCost = this.round(gross + totalEmployerCharges);
        const deductionsDetail = [
            { label: 'CNPS Pension (4,2%)', amount: cnpsEmployee, type: 'STATUTORY' },
            { label: 'Crédit Foncier (1%)', amount: cfcEmployee, type: 'STATUTORY' },
            { label: 'IRPP', amount: irpp, type: 'STATUTORY' },
            { label: 'CAC (10% IRPP)', amount: cac, type: 'STATUTORY' },
        ].filter((d) => d.amount > 0);
        return {
            baseSalary: input.baseSalary || 0,
            grossSalary: this.round(gross),
            cnpsEmployee,
            cfcEmployee,
            irpp,
            cac,
            otherDeductions: 0,
            totalDeductions,
            netSalary,
            cnpsEmployerPension,
            cnpsFamilyBenefits,
            cnpsAccidentRisk,
            cfcEmployer,
            fne,
            totalEmployerCharges,
            totalEmployerCost,
            deductionsDetail,
        };
    }
    calculateCnpsEmployee(gross, cnpsEmployeeRate, cnpsCap) {
        const cnpsBase = Math.min(gross, cnpsCap);
        return this.round(cnpsBase * cnpsEmployeeRate);
    }
    calculateIrppWithCumulative(grossCumulativeAnnual, cnpsCumulativeAnnual, previousIrppCumulative, professionalExpenseRate, fixedAbatementAnnual) {
        const taxableAnnual = Math.max(0, grossCumulativeAnnual * (1 - professionalExpenseRate) -
            cnpsCumulativeAnnual -
            fixedAbatementAnnual);
        const { irppAnnual: totalIrppOnCumulative } = this.calculateIrppAndCac(taxableAnnual);
        const irppThisMonth = this.round(Math.max(0, totalIrppOnCumulative - previousIrppCumulative));
        const cac = this.round(irppThisMonth * 0.1);
        return { irpp: irppThisMonth, cac };
    }
    calculateIrppAndCac(taxableAnnual) {
        let tax = 0;
        let remaining = taxableAnnual;
        const brackets = [
            { limit: 2_000_000, rate: 0.1 },
            { limit: 1_000_000, rate: 0.15 },
            { limit: 2_000_000, rate: 0.25 },
            { limit: Infinity, rate: 0.35 },
        ];
        for (const bracket of brackets) {
            if (remaining <= 0)
                break;
            const taxableInBracket = Math.min(remaining, bracket.limit);
            tax += taxableInBracket * bracket.rate;
            remaining -= taxableInBracket;
        }
        const irppAnnual = this.round(tax);
        const cacAnnual = this.round(irppAnnual * 0.1);
        return { irppAnnual, cacAnnual };
    }
    calculateFromNetSalary(input) {
        const targetNet = input.targetNetSalary;
        const tolerance = 1;
        const maxIterations = 50;
        let low = 0;
        let high = targetNet;
        let iterations = 0;
        while (this.calculate({
            ...input,
            baseSalary: high,
        }).netSalary < targetNet &&
            iterations < 10) {
            high *= 2;
            iterations++;
        }
        iterations = 0;
        let result = this.calculate({ ...input, baseSalary: low });
        while (iterations < maxIterations) {
            const mid = (low + high) / 2;
            result = this.calculate({ ...input, baseSalary: mid });
            const currentNet = result.netSalary;
            if (Math.abs(currentNet - targetNet) <= tolerance) {
                break;
            }
            if (currentNet < targetNet) {
                low = mid;
            }
            else {
                high = mid;
            }
            iterations++;
        }
        result = this.calculate({
            ...input,
            baseSalary: Math.round(result.baseSalary),
        });
        return result;
    }
    round(value) {
        return Math.round(value);
    }
};
exports.CameroonPayrollCalculatorService = CameroonPayrollCalculatorService;
exports.CameroonPayrollCalculatorService = CameroonPayrollCalculatorService = __decorate([
    (0, common_1.Injectable)()
], CameroonPayrollCalculatorService);
//# sourceMappingURL=cameroonpayrollcalculator.service.js.map