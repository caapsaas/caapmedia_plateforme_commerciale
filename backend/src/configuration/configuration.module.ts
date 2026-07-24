import { Module } from '@nestjs/common';
import { PrismaService } from '../common/utils/prisma/prisma.service';
import { PayrollConfigurationService } from './services/payroll-configuration.service';
import { SalaryComponentService } from './services/salary-component.service';
import { TaxBracketService } from './services/tax-bracket.service';
import { AllowanceRuleService } from './services/allowance-rule.service';
import { PayrollConfigurationController } from './controllers/payroll-configuration.controller';
import { SalaryComponentController } from './controllers/salary-component.controller';
import { TaxBracketController } from './controllers/tax-bracket.controller';
import { AllowanceRuleController } from './controllers/allowance-rule.controller';

@Module({
  providers: [
    PrismaService,
    PayrollConfigurationService,
    SalaryComponentService,
    TaxBracketService,
    AllowanceRuleService,
  ],
  controllers: [
    PayrollConfigurationController,
    SalaryComponentController,
    TaxBracketController,
    AllowanceRuleController,
  ],
  exports: [
    PayrollConfigurationService,
    SalaryComponentService,
    TaxBracketService,
    AllowanceRuleService,
  ],
})
export class ConfigurationModule {}
