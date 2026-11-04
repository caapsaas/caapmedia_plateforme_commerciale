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
exports.ImmobilisationsController = void 0;
const common_1 = require("@nestjs/common");
const immobilisations_service_1 = require("./immobilisations.service");
const dispose_fixed_asset_dto_1 = require("./dto/dispose-fixed-asset.dto");
const generate_depreciation_dto_1 = require("./dto/generate-depreciation.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const accounting_access_guard_1 = require("../../accounting-access/accounting-access.guard");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let ImmobilisationsController = class ImmobilisationsController {
    immobilisationsService;
    constructor(immobilisationsService) {
        this.immobilisationsService = immobilisationsService;
    }
    findAll(req, subsidiaryId, paginationQuery) {
        return this.immobilisationsService.findAll(req.user, subsidiaryId, paginationQuery);
    }
    generateAnnualDepreciation(dto, req) {
        return this.immobilisationsService.generateAnnualDepreciation(req.user, dto.year, dto.subsidiaryId);
    }
    dispose(id, dto, req) {
        return this.immobilisationsService.dispose(id, dto, req.user);
    }
};
exports.ImmobilisationsController = ImmobilisationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], ImmobilisationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('generate-depreciation'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_depreciation_dto_1.GenerateDepreciationDto, Object]),
    __metadata("design:returntype", void 0)
], ImmobilisationsController.prototype, "generateAnnualDepreciation", null);
__decorate([
    (0, common_1.Post)(':id/dispose'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispose_fixed_asset_dto_1.DisposeFixedAssetDto, Object]),
    __metadata("design:returntype", void 0)
], ImmobilisationsController.prototype, "dispose", null);
exports.ImmobilisationsController = ImmobilisationsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, accounting_access_guard_1.AccountingAccessGuard),
    (0, common_1.Controller)('accounting/immobilisations'),
    __metadata("design:paramtypes", [immobilisations_service_1.ImmobilisationsService])
], ImmobilisationsController);
//# sourceMappingURL=immobilisations.controller.js.map