"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingAccessModule = void 0;
const common_1 = require("@nestjs/common");
const accounting_access_service_1 = require("./accounting-access.service");
const accounting_access_controller_1 = require("./accounting-access.controller");
const accounting_access_guard_1 = require("./accounting-access.guard");
const email_service_1 = require("../common/utils/email/email.service");
const notifications_module_1 = require("../notifications/notifications.module");
let AccountingAccessModule = class AccountingAccessModule {
};
exports.AccountingAccessModule = AccountingAccessModule;
exports.AccountingAccessModule = AccountingAccessModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        controllers: [accounting_access_controller_1.AccountingAccessController],
        providers: [accounting_access_service_1.AccountingAccessService, accounting_access_guard_1.AccountingAccessGuard, email_service_1.EmailService],
        exports: [accounting_access_service_1.AccountingAccessService, accounting_access_guard_1.AccountingAccessGuard],
    })
], AccountingAccessModule);
//# sourceMappingURL=accounting-access.module.js.map