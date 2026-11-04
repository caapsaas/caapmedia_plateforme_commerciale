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
exports.InteractionsController = void 0;
const common_1 = require("@nestjs/common");
const interactions_service_1 = require("./interactions.service");
const create_interaction_dto_1 = require("./dto/create-interaction.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const update_interaction_dto_1 = require("./dto/update-interaction.dto");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_2 = require("../../common/auth/role/role.decorator");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let InteractionsController = class InteractionsController {
    interactionsService;
    constructor(interactionsService) {
        this.interactionsService = interactionsService;
    }
    create(createInteractionDto, user) {
        return this.interactionsService.create(createInteractionDto, user);
    }
    findAll(user, paginationQuery) {
        return this.interactionsService.findAll(user, paginationQuery);
    }
    update(id, updateInteractionDto, user) {
        return this.interactionsService.update(id, updateInteractionDto, user);
    }
    remove(id, user) {
        return this.interactionsService.remove(id, user);
    }
};
exports.InteractionsController = InteractionsController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_2.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_interaction_dto_1.CreateInteractionDto, Object]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY),
    __param(0, (0, role_decorator_2.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_2.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_interaction_dto_1.UpdateInteractionDto, Object]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, role_decorator_2.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "remove", null);
exports.InteractionsController = InteractionsController = __decorate([
    (0, common_1.Controller)('crm/interactions'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [interactions_service_1.InteractionsService])
], InteractionsController);
//# sourceMappingURL=interactions.controller.js.map