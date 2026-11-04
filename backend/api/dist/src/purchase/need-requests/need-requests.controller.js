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
exports.NeedRequestsController = void 0;
const pay_need_request_dto_1 = require("./dto/pay-need-request.dto");
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const need_request_dto_1 = require("./dto/need-request.dto");
const need_requests_service_1 = require("./need-requests.service");
let NeedRequestsController = class NeedRequestsController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(req) {
        return this.service.findAll(req.user);
    }
    create(req, dto) {
        return this.service.create(req.user, dto);
    }
    paymentAccount(req, id) {
        return this.service.paymentAccount(req.user, id);
    }
    pay(req, id, dto) {
        return this.service.pay(req.user, id, dto);
    }
    review(req, id, dto) {
        return this.service.review(req.user, id, dto);
    }
};
exports.NeedRequestsController = NeedRequestsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NeedRequestsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, need_request_dto_1.CreateNeedRequestDto]),
    __metadata("design:returntype", void 0)
], NeedRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id/payment-account'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NeedRequestsController.prototype, "paymentAccount", null);
__decorate([
    (0, common_1.Post)(':id/pay'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pay_need_request_dto_1.PayNeedRequestDto]),
    __metadata("design:returntype", void 0)
], NeedRequestsController.prototype, "pay", null);
__decorate([
    (0, common_1.Patch)(':id/review'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, need_request_dto_1.ReviewNeedRequestDto]),
    __metadata("design:returntype", void 0)
], NeedRequestsController.prototype, "review", null);
exports.NeedRequestsController = NeedRequestsController = __decorate([
    (0, common_1.Controller)('purchasing/need-requests'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [need_requests_service_1.NeedRequestsService])
], NeedRequestsController);
//# sourceMappingURL=need-requests.controller.js.map