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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalsController = void 0;
const common_1 = require("@nestjs/common");
const journals_service_1 = require("./journals.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const accounting_access_guard_1 = require("../../accounting-access/accounting-access.guard");
let JournalsController = class JournalsController {
    journalsService;
    constructor(journalsService) {
        this.journalsService = journalsService;
    }
    findAll() {
        return this.journalsService.findAll();
    }
    async seed() {
        await this.journalsService.seedDefaultJournals();
        return { message: 'Journaux SYSCOHADA initialisés avec succès.' };
    }
};
exports.JournalsController = JournalsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JournalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JournalsController.prototype, "seed", null);
exports.JournalsController = JournalsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, accounting_access_guard_1.AccountingAccessGuard),
    (0, common_1.Controller)('accounting/journals'),
    __metadata("design:paramtypes", [journals_service_1.JournalsService])
], JournalsController);
//# sourceMappingURL=journals.controller.js.map