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
exports.ExternalTransactionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const external_transaction_service_1 = require("./external-transaction.service");
const create_external_transaction_dto_1 = require("./dto/create-external-transaction.dto");
const update_external_transaction_dto_1 = require("./dto/update-external-transaction.dto");
const find_external_transactions_dto_1 = require("./dto/find-external-transactions.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
let ExternalTransactionController = class ExternalTransactionController {
    externalTransactionService;
    constructor(externalTransactionService) {
        this.externalTransactionService = externalTransactionService;
    }
    async create(createDto) {
        return await this.externalTransactionService.create(createDto);
    }
    async findAll(query) {
        return await this.externalTransactionService.findAll(query);
    }
    async getStatistics(subsidiaryId) {
        return await this.externalTransactionService.getStatistics(subsidiaryId);
    }
    async findOne(id) {
        return await this.externalTransactionService.findOne(id);
    }
    async update(id, updateDto) {
        return await this.externalTransactionService.update(id, updateDto);
    }
    async validate(id, req) {
        const userId = req.user?.id;
        return await this.externalTransactionService.validate(id, userId);
    }
    async cancel(id) {
        return await this.externalTransactionService.cancel(id);
    }
    async remove(id) {
        return await this.externalTransactionService.remove(id);
    }
    async adminUpdate(id, updateDto, req) {
        const userId = req.user?.id;
        return await this.externalTransactionService.adminUpdate(id, updateDto, userId);
    }
    async adminRemove(id, req) {
        const userId = req.user?.id;
        return await this.externalTransactionService.adminRemove(id, userId);
    }
};
exports.ExternalTransactionController = ExternalTransactionController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Créer une nouvelle transaction externe' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Transaction créée avec succès.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Données invalides.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_external_transaction_dto_1.CreateExternalTransactionDto]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer toutes les transactions externes' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des transactions récupérée avec succès.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: false,
        description: 'Filtrer par type de transaction',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'category',
        required: false,
        description: 'Filtrer par catégorie',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        description: 'Filtrer par statut',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'startDate',
        required: false,
        description: 'Date de début (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endDate',
        required: false,
        description: 'Date de fin (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        description: 'Rechercher dans description ou référence',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_external_transactions_dto_1.FindExternalTransactionsDto]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer les statistiques des transactions externes',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistiques récupérées avec succès.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'subsidiaryId',
        required: true,
        description: 'ID de la filiale',
    }),
    __param(0, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer une transaction externe par son ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transaction récupérée avec succès.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transaction non trouvée.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la transaction' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour une transaction externe' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transaction mise à jour avec succès.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transaction non trouvée.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la transaction' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_external_transaction_dto_1.UpdateExternalTransactionDto]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Valider une transaction externe' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction validée avec succès.' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Transaction déjà validée ou annulée.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transaction non trouvée.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la transaction' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "validate", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Annuler une transaction externe' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction annulée avec succès.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Transaction déjà annulée.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transaction non trouvée.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la transaction' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "cancel", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer une transaction externe' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transaction supprimée avec succès.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Impossible de supprimer une transaction validée.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transaction non trouvée.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la transaction' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/admin-update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour une transaction validée (Admin/Directeur Financier uniquement)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transaction mise à jour avec succès.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Accès refusé ou transaction non trouvée.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transaction non trouvée.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la transaction' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_external_transaction_dto_1.UpdateExternalTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "adminUpdate", null);
__decorate([
    (0, common_1.Delete)(':id/admin-delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Supprimer une transaction validée (Admin/Directeur Financier uniquement)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transaction supprimée avec succès.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Accès refusé ou transaction non trouvée.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transaction non trouvée.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la transaction' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExternalTransactionController.prototype, "adminRemove", null);
exports.ExternalTransactionController = ExternalTransactionController = __decorate([
    (0, swagger_1.ApiTags)('external-transactions'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('finance/external-transactions'),
    __metadata("design:paramtypes", [external_transaction_service_1.ExternalTransactionService])
], ExternalTransactionController);
//# sourceMappingURL=external-transaction.controller.js.map