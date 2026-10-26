import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { PrismaService } from '../../common/utils/prisma/prisma.service';

/** Enforce payroll configuration ownership for routes addressed by object ID. */
@Injectable()
export class ConfigurationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  private assertSubsidiaryAccess(user: JwtUser, subsidiaryId: string): void {
    const isGlobalAdmin =
      user.role === UserRole.ADMIN ||
      user.activeRole === UserRole.SUPER_ADMIN ||
      user.roles?.includes(UserRole.SUPER_ADMIN);

    if (!isGlobalAdmin && user.subsidiaryId !== subsidiaryId) {
      throw new ForbiddenException("Vous n'avez pas accès à cette filiale");
    }
  }

  async assertConfigAccess(configId: string, user: JwtUser): Promise<void> {
    const config = await this.prisma.payrollConfiguration.findUnique({
      where: { id: configId },
      select: { subsidiaryId: true },
    });
    if (!config) throw new NotFoundException('Payroll configuration not found');
    this.assertSubsidiaryAccess(user, config.subsidiaryId);
  }

  async assertSubsidiaryConfigAccess(subsidiaryId: string, user: JwtUser): Promise<void> {
    this.assertSubsidiaryAccess(user, subsidiaryId);
  }

  async assertTaxBracketAccess(bracketId: string, user: JwtUser): Promise<void> {
    const bracket = await this.prisma.taxBracket.findUnique({
      where: { id: bracketId },
      select: { payrollConfig: { select: { subsidiaryId: true } } },
    });
    if (!bracket) throw new NotFoundException('Tax bracket not found');
    this.assertSubsidiaryAccess(user, bracket.payrollConfig.subsidiaryId);
  }

  async assertSalaryComponentAccess(componentId: string, user: JwtUser): Promise<void> {
    const component = await this.prisma.salaryComponent.findUnique({
      where: { id: componentId },
      select: { payrollConfig: { select: { subsidiaryId: true } } },
    });
    if (!component) throw new NotFoundException('Salary component not found');
    this.assertSubsidiaryAccess(user, component.payrollConfig.subsidiaryId);
  }

  async assertAllowanceRuleAccess(ruleId: string, user: JwtUser): Promise<void> {
    const rule = await this.prisma.allowanceRule.findUnique({
      where: { id: ruleId },
      select: { payrollConfig: { select: { subsidiaryId: true } } },
    });
    if (!rule) throw new NotFoundException('Allowance rule not found');
    this.assertSubsidiaryAccess(user, rule.payrollConfig.subsidiaryId);
  }
}
