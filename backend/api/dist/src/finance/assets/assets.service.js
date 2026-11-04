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
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const treasury_service_1 = require("../treasury/treasury.service");
const check_role_util_1 = require("../../common/auth/role/check-role.util");
const accounting_outbox_service_1 = require("../../accounting/outbox/accounting-outbox.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
let AssetsService = class AssetsService {
    prisma;
    treasuryService;
    accountingOutbox;
    constructor(prisma, treasuryService, accountingOutbox) {
        this.prisma = prisma;
        this.treasuryService = treasuryService;
        this.accountingOutbox = accountingOutbox;
    }
    async create(dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to create fixed assets.');
        const { treasuryAccountId, ...assetData } = dto;
        return this.prisma.$transaction(async (tx) => {
            const asset = await tx.fixedAsset.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.FIXEDASSET),
                    ...assetData,
                    acquisitionDate: new Date(dto.acquisitionDate),
                    subsidiaryId: user.subsidiaryId,
                },
            });
            await this.treasuryService.createExpenseTransactionWithTx(tx, {
                transactionDate: new Date(dto.acquisitionDate).toISOString(),
                description: `Achat immobilisation: ${asset.fixedAssetsName}`,
                amount: dto.acquisitionCost,
                treasuryAccountId,
                relatedDocumentId: asset.id,
            }, user.subsidiaryId);
            await this.accountingOutbox.enqueue(tx, {
                eventType: 'FIXED_ASSET_ACQUISITION',
                subsidiaryId: user.subsidiaryId,
                payload: {
                    userId: user.id,
                    operationDate: new Date(dto.acquisitionDate).toISOString(),
                    amount: dto.acquisitionCost,
                    description: `Acquisition: ${asset.fixedAssetsName}`,
                    sourceId: asset.id,
                },
            });
            return asset;
        });
    }
    async findAll(user, paginationQuery = {}) {
        return (0, pagination_1.paginate)(this.prisma.fixedAsset, {
            where: { subsidiaryId: user.subsidiaryId },
            orderBy: { acquisitionDate: 'desc' },
        }, paginationQuery);
    }
    async findOne(id, user) {
        const asset = await this.prisma.fixedAsset.findFirst({
            where: { id, subsidiaryId: user.subsidiaryId },
        });
        if (!asset)
            throw new common_1.NotFoundException(`Fixed asset with ID "${id}" not found.`);
        return asset;
    }
    async update(id, dto, user) {
        const asset = await this.findOne(id, user);
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to update fixed assets.');
        if (asset.status === client_1.FixedAssetStatus.DISPOSED) {
            throw new common_1.BadRequestException('Cette immobilisation a été cédée et ne peut plus être modifiée.');
        }
        return this.prisma.fixedAsset.update({
            where: { id },
            data: {
                ...dto,
                acquisitionDate: dto.acquisitionDate
                    ? new Date(dto.acquisitionDate)
                    : undefined,
            },
        });
    }
    async remove(id, user) {
        const asset = await this.findOne(id, user);
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to delete fixed assets.');
        if (asset.status === client_1.FixedAssetStatus.DISPOSED) {
            throw new common_1.BadRequestException('Cette immobilisation a été cédée et ne peut plus être supprimée.');
        }
        return this.prisma.fixedAsset.delete({ where: { id } });
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        treasury_service_1.TreasuryService,
        accounting_outbox_service_1.AccountingOutboxService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map