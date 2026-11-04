"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeedRequestsModule = void 0;
const accounting_outbox_module_1 = require("../../accounting/outbox/accounting-outbox.module");
const notifications_module_1 = require("../../notifications/notifications.module");
const common_1 = require("@nestjs/common");
const need_requests_controller_1 = require("./need-requests.controller");
const need_requests_service_1 = require("./need-requests.service");
let NeedRequestsModule = class NeedRequestsModule {
};
exports.NeedRequestsModule = NeedRequestsModule;
exports.NeedRequestsModule = NeedRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule, accounting_outbox_module_1.AccountingOutboxModule],
        controllers: [need_requests_controller_1.NeedRequestsController],
        providers: [need_requests_service_1.NeedRequestsService],
    })
], NeedRequestsModule);
//# sourceMappingURL=need-requests.module.js.map