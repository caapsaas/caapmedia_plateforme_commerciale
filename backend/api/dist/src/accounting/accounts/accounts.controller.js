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
exports.AccountsController = void 0;
const common_1 = require("@nestjs/common");
const accounts_service_1 = require("./accounts.service");
const journals_service_1 = require("../journals/journals.service");
const mappings_service_1 = require("./mappings.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const accounting_access_guard_1 = require("../../accounting-access/accounting-access.guard");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let AccountsController = class AccountsController {
    accountsService;
    journalsService;
    mappingsService;
    constructor(accountsService, journalsService, mappingsService) {
        this.accountsService = accountsService;
        this.journalsService = journalsService;
        this.mappingsService = mappingsService;
    }
    async seed() {
        await this.accountsService.seedSyscohada();
        await this.journalsService.seedDefaultJournals();
        await this.mappingsService.seedDefaultMappings();
        return {
            message: 'Plan comptable SYSCOHADA, journaux et mappings initialisés avec succès.',
        };
    }
    create(dto) {
        return this.accountsService.create(dto);
    }
    findAll(paginationQuery, type, includeInactive) {
        return this.accountsService.findAll(paginationQuery, type, includeInactive === 'true');
    }
    findOne(id) {
        return this.accountsService.findOne(id);
    }
    update(id, dto) {
        return this.accountsService.update(id, dto);
    }
    deactivate(id) {
        return this.accountsService.deactivate(id);
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "seed", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto, String, String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "deactivate", null);
exports.AccountsController = AccountsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, accounting_access_guard_1.AccountingAccessGuard),
    (0, common_1.Controller)('accounting/accounts'),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService,
        journals_service_1.JournalsService,
        mappings_service_1.MappingsService])
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map