"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretariatModule = void 0;
const meeting_reports_service_1 = require("./meeting-reports.service");
const common_1 = require("@nestjs/common");
const secretariat_service_1 = require("./secretariat.service");
const secretariat_controller_1 = require("./secretariat.controller");
const logger_service_1 = require("../common/utils/logger/logger.service");
const email_service_1 = require("../common/utils/email/email.service");
let SecretariatModule = class SecretariatModule {
};
exports.SecretariatModule = SecretariatModule;
exports.SecretariatModule = SecretariatModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [secretariat_controller_1.SecretariatController],
        providers: [
            secretariat_service_1.SecretariatService,
            meeting_reports_service_1.MeetingReportsService,
            logger_service_1.LoggerService,
            email_service_1.EmailService,
        ],
    })
], SecretariatModule);
//# sourceMappingURL=secretariat.module.js.map