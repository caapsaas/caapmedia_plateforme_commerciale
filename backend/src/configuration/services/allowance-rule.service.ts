import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  CreateAllowanceRuleDto,
  UpdateAllowanceRuleDto,
} from '../dto/allowance-rule.dto';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

@Injectable()
export class AllowanceRuleService {
  private readonly logger = new Logger(AllowanceRuleService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    subsidiaryId: string,
    dto: CreateAllowanceRuleDto,
    user?: JwtUser,
  ) {
    const config = await this.prisma.payrollConfiguration.findUnique({
      where: { subsidiaryId },
    });

    if (!config) {
      throw new NotFoundException('Payroll configuration not found');
    }

    const rule = await this.prisma.allowanceRule.create({
      data: {
        id: `allow_${Date.now()}_${Math.random()}`,
        payrollConfigId: config.id,
        ...dto,
      },
    });

    this.logger.warn(
      `[AUDIT] Allowance rule created for subsidiary ${subsidiaryId}: ${dto.name}. Created by: ${user?.email || 'unknown'}`,
    );

    return rule;
  }

  async getByConfigId(configId: string) {
    return this.prisma.allowanceRule.findMany({
      where: { payrollConfigId: configId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveRules(configId: string) {
    const now = new Date();
    return this.prisma.allowanceRule.findMany({
      where: {
        payrollConfigId: configId,
        isActive: true,
        effectiveDate: { lte: now },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      orderBy: { name: 'asc' },
    });
  }

  async getApplicableAllowances(
    configId: string,
    employeeAge?: number,
    salary?: number,
    numberOfDependents?: number,
  ) {
    const activeRules = await this.getActiveRules(configId);

    return activeRules.filter((rule) => {
      if (rule.minAge && employeeAge && employeeAge < rule.minAge) return false;
      if (rule.maxAge && employeeAge && employeeAge > rule.maxAge) return false;
      if (rule.minSalary && salary && salary < rule.minSalary.toNumber())
        return false;
      if (
        rule.numberOfDependents &&
        numberOfDependents &&
        numberOfDependents < rule.numberOfDependents
      )
        return false;
      return true;
    });
  }

  async calculateAllowances(
    configId: string,
    salary: number,
    employeeAge?: number,
    numberOfDependents?: number,
  ) {
    const applicableRules = await this.getApplicableAllowances(
      configId,
      employeeAge,
      salary,
      numberOfDependents,
    );

    let totalAllowance = 0;
    const allowanceDetails = [];

    for (const rule of applicableRules) {
      let amount = 0;
      if (rule.amount) {
        amount = rule.amount.toNumber();
      } else if (rule.percentageOfSalary) {
        amount = (salary * rule.percentageOfSalary.toNumber()) / 100;
      }
      totalAllowance += amount;
      allowanceDetails.push({
        name: rule.name,
        amount,
      });
    }

    return { totalAllowance, details: allowanceDetails };
  }

  async update(ruleId: string, dto: UpdateAllowanceRuleDto, user?: JwtUser) {
    const rule = await this.prisma.allowanceRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException('Allowance rule not found');
    }

    const updated = await this.prisma.allowanceRule.update({
      where: { id: ruleId },
      data: dto,
    });

    this.logger.warn(
      `[AUDIT] Allowance rule updated: ${rule.name}. Updated by: ${user?.email || 'unknown'}`,
    );

    return updated;
  }

  async delete(ruleId: string, user?: JwtUser) {
    const rule = await this.prisma.allowanceRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException('Allowance rule not found');
    }

    await this.prisma.allowanceRule.delete({
      where: { id: ruleId },
    });

    this.logger.warn(
      `[AUDIT] Allowance rule deleted: ${rule.name}. Deleted by: ${user?.email || 'unknown'}`,
    );

    return rule;
  }

  async deactivate(ruleId: string, user?: JwtUser) {
    return this.update(ruleId, { isActive: false }, user);
  }
}
