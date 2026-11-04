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
exports.AccountingAccessController = void 0;
const common_1 = require("@nestjs/common");
const accounting_access_service_1 = require("./accounting-access.service");
const create_access_request_dto_1 = require("./dto/create-access-request.dto");
const approve_access_request_dto_1 = require("./dto/approve-access-request.dto");
const reject_access_request_dto_1 = require("./dto/reject-access-request.dto");
const jwt_guard_1 = require("../common/auth/jwt/jwt.guard");
const pagination_query_dto_1 = require("../common/pagination/dto/pagination-query.dto");
let AccountingAccessController = class AccountingAccessController {
    accessService;
    constructor(accessService) {
        this.accessService = accessService;
    }
    findAll(req, paginationQuery) {
        return this.accessService.findAll(req.user, paginationQuery);
    }
    myStatus(req) {
        return this.accessService.myStatus(req.user);
    }
    countPending(req) {
        return this.accessService.countPending(req.user);
    }
    createRequest(dto, req) {
        return this.accessService.createRequest(req.user, dto);
    }
    approve(id, dto, req) {
        return this.accessService.approve(id, dto, req.user);
    }
    reject(id, dto, req) {
        return this.accessService.reject(id, dto, req.user);
    }
};
exports.AccountingAccessController = AccountingAccessController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], AccountingAccessController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountingAccessController.prototype, "myStatus", null);
__decorate([
    (0, common_1.Get)('pending-count'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountingAccessController.prototype, "countPending", null);
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_access_request_dto_1.CreateAccessRequestDto, Object]),
    __metadata("design:returntype", void 0)
], AccountingAccessController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_access_request_dto_1.ApproveAccessRequestDto, Object]),
    __metadata("design:returntype", void 0)
], AccountingAccessController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_access_request_dto_1.RejectAccessRequestDto, Object]),
    __metadata("design:returntype", void 0)
], AccountingAccessController.prototype, "reject", null);
exports.AccountingAccessController = AccountingAccessController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('accounting-access'),
    __metadata("design:paramtypes", [accounting_access_service_1.AccountingAccessService])
], AccountingAccessController);
//# sourceMappingURL=accounting-access.controller.js.map