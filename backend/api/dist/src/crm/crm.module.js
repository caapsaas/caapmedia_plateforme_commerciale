"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmModule = void 0;
const common_1 = require("@nestjs/common");
const leads_module_1 = require("./leads/leads.module");
const accounts_module_1 = require("./accounts/accounts.module");
const contacts_module_1 = require("./contacts/contacts.module");
const opportunities_module_1 = require("./opportunities/opportunities.module");
const crmtasks_module_1 = require("./crmtasks/crmtasks.module");
const interactions_module_1 = require("./interactions/interactions.module");
const contracts_module_1 = require("./contracts/contracts.module");
const proformas_module_1 = require("./proformas/proformas.module");
let CrmModule = class CrmModule {
};
exports.CrmModule = CrmModule;
exports.CrmModule = CrmModule = __decorate([
    (0, common_1.Module)({
        imports: [
            leads_module_1.LeadsModule,
            accounts_module_1.AccountsModule,
            contacts_module_1.ContactsModule,
            opportunities_module_1.OpportunitiesModule,
            crmtasks_module_1.CrmtasksModule,
            contracts_module_1.ContractsModule,
            interactions_module_1.InteractionsModule,
            proformas_module_1.ProformasModule,
        ],
        exports: [
            leads_module_1.LeadsModule,
            accounts_module_1.AccountsModule,
            contacts_module_1.ContactsModule,
            opportunities_module_1.OpportunitiesModule,
            crmtasks_module_1.CrmtasksModule,
            contracts_module_1.ContractsModule,
            interactions_module_1.InteractionsModule,
            proformas_module_1.ProformasModule,
        ],
    })
], CrmModule);
//# sourceMappingURL=crm.module.js.map