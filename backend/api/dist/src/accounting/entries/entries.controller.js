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
exports.EntriesController = void 0;
const common_1 = require("@nestjs/common");
const entries_service_1 = require("./entries.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const accounting_access_guard_1 = require("../../accounting-access/accounting-access.guard");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let EntriesController = class EntriesController {
    entriesService;
    constructor(entriesService) {
        this.entriesService = entriesService;
    }
    create(dto, req) {
        return this.entriesService.create(dto, req.user);
    }
    findAll(req, paginationQuery, fiscalYearId, status, startDate, endDate, subsidiaryId) {
        return this.entriesService.findAll(req.user, fiscalYearId, status, startDate, endDate, subsidiaryId, paginationQuery);
    }
    findOne(id, req) {
        return this.entriesService.findOne(id, req.user);
    }
    post(id, req) {
        return this.entriesService.post(id, req.user);
    }
    cancel(id, req) {
        return this.entriesService.cancel(id, req.user);
    }
    reverse(id, req) {
        return this.entriesService.reverse(id, req.user);
    }
};
exports.EntriesController = EntriesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EntriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('fiscalYearId')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __param(6, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], EntriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EntriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/post'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EntriesController.prototype, "post", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EntriesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/reverse'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EntriesController.prototype, "reverse", null);
exports.EntriesController = EntriesController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, accounting_access_guard_1.AccountingAccessGuard),
    (0, common_1.Controller)('accounting/entries'),
    __metadata("design:paramtypes", [entries_service_1.EntriesService])
], EntriesController);
//# sourceMappingURL=entries.controller.js.map