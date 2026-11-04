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
exports.MappingsController = void 0;
const common_1 = require("@nestjs/common");
const mappings_service_1 = require("./mappings.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const accounting_access_guard_1 = require("../../accounting-access/accounting-access.guard");
let MappingsController = class MappingsController {
    mappingsService;
    constructor(mappingsService) {
        this.mappingsService = mappingsService;
    }
    findAll() {
        return this.mappingsService.findAll();
    }
    update(key, accountCode) {
        return this.mappingsService.update(key, accountCode);
    }
    async seed() {
        const result = await this.mappingsService.seedDefaultMappings();
        return {
            message: `${result.imported} mapping(s) importé(s) avec succès${result.skipped > 0 ? `, ${result.skipped} ignoré(s) (compte introuvable — initialisez le plan comptable d'abord)` : ''}.`,
        };
    }
};
exports.MappingsController = MappingsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MappingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)('accountCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MappingsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MappingsController.prototype, "seed", null);
exports.MappingsController = MappingsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, accounting_access_guard_1.AccountingAccessGuard),
    (0, common_1.Controller)('accounting/mappings'),
    __metadata("design:paramtypes", [mappings_service_1.MappingsService])
], MappingsController);
//# sourceMappingURL=mappings.controller.js.map