import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  CreatePayrollConfigDto,
  UpdatePayrollConfigDto,
} from '../dto/payroll-configuration.dto';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

@Injectable()
export class PayrollConfigurationService {
  private readonly logger = new Logger(PayrollConfigurationService.name);

  constructor(private prisma: PrismaService) {}

  async getOrCreateBySubsidiary(subsidiaryId: string) {
    let config = await this.prisma.payrollConfiguration.findUnique({
      where: { subsidiaryId },
      include: {
        salaryComponents: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        taxBrackets: {
          where: {
            effectiveDate: { lte: new Date() },
            OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
          },
          orderBy: { minSalary: 'asc' },
        },
        allowanceRules: {
          where: {
            isActive: true,
            effectiveDate: { lte: new Date() },
            OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
          },
        },
      },
    });

    if (!config) {
      config = await this.createDefaultConfiguration(subsidiaryId);
    }

    return config;
  }

  async createDefaultConfiguration(subsidiaryId: string) {
    const now = new Date();
    const config = await this.prisma.payrollConfiguration.create({
      data: {
        id: `config_${subsidiaryId}_${Date.now()}`,
        subsidiaryId,
        minWage: 60000, // SMIG Cameroun
        minWagePeriod: 'monthly',
        minWageEffectiveDate: now,
        cnpsEmployeeRate: 5.4,
        cnpsEmployerRate: 6.4,
        cfcEmployeeRate: 0.01,
        cfcEmployerRate: 0.015,
        fneRate: 0.01,
        cnpsCap: 750000,
        professionalExpenseRate: 0.30,
        fixedAbatementAnnual: 500000,
        riskGroupARate: 0.0175,
        riskGroupBRate: 0.025,
        riskGroupCRate: 0.05,
      },
      include: {
        salaryComponents: true,
        taxBrackets: true,
        allowanceRules: true,
      },
    });

    // Create default salary components (SYSCOHADA Cameroon)
    await this.createDefaultComponents(config.id);
    await this.createDefaultTaxBrackets(config.id);

    return this.getOrCreateBySubsidiary(subsidiaryId);
  }

  private async createDefaultComponents(configId: string) {
    const components = [
      {
        name: 'Salaire de Base',
        description: 'Salaire mensuel de base',
        type: 'EARNING' as const,
        displayOrder: 1,
      },
      {
        name: 'CNPS Employé',
        description: 'Cotisation CNPS employee (5.4%)',
        type: 'CONTRIBUTION' as const,
        rate: 5.4,
        contributionType: 'EMPLOYEE' as const,
        displayOrder: 2,
      },
      {
        name: 'CNPS Employeur',
        description: 'Cotisation CNPS employeur (6.4%)',
        type: 'CONTRIBUTION' as const,
        rate: 6.4,
        contributionType: 'EMPLOYER' as const,
        displayOrder: 3,
      },
      {
        name: 'IRC',
        description: 'Impôt sur les revenus',
        type: 'TAX' as const,
        displayOrder: 4,
      },
      {
        name: 'Allocations Familiales',
        description: 'Allocations familiales',
        type: 'EARNING' as const,
        displayOrder: 5,
      },
    ];

    for (const component of components) {
      await this.prisma.salaryComponent.create({
        data: {
          id: `comp_${Date.now()}_${Math.random()}`,
          payrollConfigId: configId,
          ...component,
          isActive: true,
        },
      });
    }
  }

  private async createDefaultTaxBrackets(configId: string) {
    const now = new Date();
    const brackets = [
      { minSalary: 0, maxSalary: 355000, rate: 0, deductible: 0 },
      { minSalary: 355000, maxSalary: 545000, rate: 10, deductible: 35500 },
      { minSalary: 545000, maxSalary: 1000000, rate: 15, deductible: 89000 },
      { minSalary: 1000000, maxSalary: null, rate: 20, deductible: 170000 },
    ];

    for (const bracket of brackets) {
      await this.prisma.taxBracket.create({
        data: {
          id: `bracket_${Date.now()}_${Math.random()}`,
          payrollConfigId: configId,
          minSalary: bracket.minSalary,
          maxSalary: bracket.maxSalary,
          rate: bracket.rate,
          deductible: bracket.deductible,
          effectiveDate: now,
          expiryDate: null,
        },
      });
    }
  }

  async updateConfiguration(
    subsidiaryId: string,
    dto: UpdatePayrollConfigDto,
    user?: JwtUser,
  ) {
    const config = await this.prisma.payrollConfiguration.findUnique({
      where: { subsidiaryId },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    const oldValues = {
      minWage: config.minWage,
      minWageEffectiveDate: config.minWageEffectiveDate,
      cnpsEmployeeRate: config.cnpsEmployeeRate,
      cnpsEmployerRate: config.cnpsEmployerRate,
      cfcEmployeeRate: config.cfcEmployeeRate,
      cfcEmployerRate: config.cfcEmployerRate,
      fneRate: config.fneRate,
      cnpsCap: config.cnpsCap,
      professionalExpenseRate: config.professionalExpenseRate,
      fixedAbatementAnnual: config.fixedAbatementAnnual,
      riskGroupARate: config.riskGroupARate,
      riskGroupBRate: config.riskGroupBRate,
      riskGroupCRate: config.riskGroupCRate,
    };

    const updateData: any = {
      minWage: dto.minWage ?? config.minWage,
      minWageEffectiveDate: dto.minWageEffectiveDate
        ? new Date(dto.minWageEffectiveDate)
        : config.minWageEffectiveDate,
      cnpsEmployeeRate: dto.cnpsEmployeeRate ?? config.cnpsEmployeeRate,
      cnpsEmployerRate: dto.cnpsEmployerRate ?? config.cnpsEmployerRate,
      cfcEmployeeRate: dto.cfcEmployeeRate ?? config.cfcEmployeeRate,
      cfcEmployerRate: dto.cfcEmployerRate ?? config.cfcEmployerRate,
      fneRate: dto.fneRate ?? config.fneRate,
      cnpsCap: dto.cnpsCap ?? config.cnpsCap,
      professionalExpenseRate: dto.professionalExpenseRate ?? config.professionalExpenseRate,
      fixedAbatementAnnual: dto.fixedAbatementAnnual ?? config.fixedAbatementAnnual,
      riskGroupARate: dto.riskGroupARate ?? config.riskGroupARate,
      riskGroupBRate: dto.riskGroupBRate ?? config.riskGroupBRate,
      riskGroupCRate: dto.riskGroupCRate ?? config.riskGroupCRate,
    };

    // Handle tax brackets update if provided
    if (dto.irppBrackets) {
      updateData.taxBrackets = {
        deleteMany: { payrollConfigId: config.id },
        create: dto.irppBrackets.map((bracket) => ({
          id: `bracket_${Date.now()}_${Math.random()}`,
          minSalary: bracket.minSalary,
          maxSalary: bracket.maxSalary,
          rate: bracket.rate,
          deductible: bracket.deductible,
          effectiveDate: new Date(),
          expiryDate: null,
        })),
      };
    }

    // Handle leave entitlements update if provided
    if (dto.leaveEntitlements) {
      updateData.leaveEntitlements = {
        deleteMany: { payrollConfigId: config.id },
        create: dto.leaveEntitlements.map((entitlement) => ({
          id: `entitlement_${Date.now()}_${Math.random()}`,
          type: entitlement.type,
          daysPerYear: entitlement.daysPerYear,
          isPaid: entitlement.isPaid,
          description: entitlement.description,
        })),
      };
    }

    const updated = await this.prisma.payrollConfiguration.update({
      where: { subsidiaryId },
      data: updateData,
      include: {
        salaryComponents: { where: { isActive: true } },
        taxBrackets: { orderBy: { minSalary: 'asc' } },
        allowanceRules: true,
        leaveEntitlements: true,
      },
    });

    // Log audit de la modification
    const changes = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${oldValues[key]} → ${value}`)
      .join(', ');

    this.logger.warn(
      `[AUDIT] Payroll configuration updated for subsidiary ${subsidiaryId}. Changes: ${changes}. Modified by: ${user?.email || 'unknown'}`,
      'PayrollConfigurationService',
    );

    return updated;
  }

  async getConfiguration(subsidiaryId: string) {
    return this.getOrCreateBySubsidiary(subsidiaryId);
  }
}
