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
exports.NotificationsSseController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const jwt_guard_1 = require("../common/auth/jwt/jwt.guard");
const role_decorator_1 = require("../common/auth/role/role.decorator");
const notifications_sse_service_1 = require("./notifications-sse.service");
let NotificationsSseController = class NotificationsSseController {
    sse;
    constructor(sse) {
        this.sse = sse;
    }
    stream(user) {
        return this.sse.subscribe(user.id, user.activeRole);
    }
};
exports.NotificationsSseController = NotificationsSseController;
__decorate([
    (0, common_1.Sse)('sse'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], NotificationsSseController.prototype, "stream", null);
exports.NotificationsSseController = NotificationsSseController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_sse_service_1.NotificationsSseService])
], NotificationsSseController);
//# sourceMappingURL=notifications-sse.controller.js.map