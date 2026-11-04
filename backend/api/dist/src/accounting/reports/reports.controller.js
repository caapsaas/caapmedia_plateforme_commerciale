"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const accounting_access_guard_1 = require("../../accounting-access/accounting-access.guard");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getGrandLivre(fiscalYearId, req, accountNumber, journalCode, subsidiaryId, startDate, endDate) {
        return this.reportsService.getGrandLivre(req.user, fiscalYearId, accountNumber, journalCode, subsidiaryId, startDate, endDate);
    }
    getBalance(fiscalYearId, req, subsidiaryId, startDate, endDate) {
        return this.reportsService.getBalanceGenerale(req.user, fiscalYearId, subsidiaryId, startDate, endDate);
    }
    getJournalCentralisateur(fiscalYearId, req, journalCode, subsidiaryId, startDate, endDate) {
        return this.reportsService.getJournalCentralisateur(req.user, fiscalYearId, journalCode, subsidiaryId, startDate, endDate);
    }
    getSyscohadaStatements(fiscalYearId, req, subsidiaryId) {
        return this.reportsService.getSyscohadaStatements(req.user, fiscalYearId, subsidiaryId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('grand-livre/:fiscalYearId'),
    __param(0, (0, common_1.Param)('fiscalYearId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('accountNumber')),
    __param(3, (0, common_1.Query)('journalCode')),
    __param(4, (0, common_1.Query)('subsidiaryId')),
    __param(5, (0, common_1.Query)('startDate')),
    __param(6, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getGrandLivre", null);
__decorate([
    (0, common_1.Get)('balance/:fiscalYearId'),
    __param(0, (0, common_1.Param)('fiscalYearId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('journal-centralisateur/:fiscalYearId'),
    __param(0, (0, common_1.Param)('fiscalYearId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('journalCode')),
    __param(3, (0, common_1.Query)('subsidiaryId')),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getJournalCentralisateur", null);
__decorate([
    (0, common_1.Get)('states/:fiscalYearId'),
    __param(0, (0, common_1.Param)('fiscalYearId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getSyscohadaStatements", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, accounting_access_guard_1.AccountingAccessGuard),
    (0, common_1.Controller)('accounting/reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map