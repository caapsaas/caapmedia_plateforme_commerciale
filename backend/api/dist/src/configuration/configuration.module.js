"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/utils/prisma/prisma.service");
const payroll_configuration_service_1 = require("./services/payroll-configuration.service");
const salary_component_service_1 = require("./services/salary-component.service");
const tax_bracket_service_1 = require("./services/tax-bracket.service");
const allowance_rule_service_1 = require("./services/allowance-rule.service");
const configuration_access_service_1 = require("./services/configuration-access.service");
const payroll_configuration_controller_1 = require("./controllers/payroll-configuration.controller");
const salary_component_controller_1 = require("./controllers/salary-component.controller");
const tax_bracket_controller_1 = require("./controllers/tax-bracket.controller");
const allowance_rule_controller_1 = require("./controllers/allowance-rule.controller");
let ConfigurationModule = class ConfigurationModule {
};
exports.ConfigurationModule = ConfigurationModule;
exports.ConfigurationModule = ConfigurationModule = __decorate([
    (0, common_1.Module)({
        providers: [
            prisma_service_1.PrismaService,
            payroll_configuration_service_1.PayrollConfigurationService,
            salary_component_service_1.SalaryComponentService,
            tax_bracket_service_1.TaxBracketService,
            allowance_rule_service_1.AllowanceRuleService,
            configuration_access_service_1.ConfigurationAccessService,
        ],
        controllers: [
            payroll_configuration_controller_1.PayrollConfigurationController,
            salary_component_controller_1.SalaryComponentController,
            tax_bracket_controller_1.TaxBracketController,
            allowance_rule_controller_1.AllowanceRuleController,
        ],
        exports: [
            payroll_configuration_service_1.PayrollConfigurationService,
            salary_component_service_1.SalaryComponentService,
            tax_bracket_service_1.TaxBracketService,
            allowance_rule_service_1.AllowanceRuleService,
        ],
    })
], ConfigurationModule);
//# sourceMappingURL=configuration.module.js.map