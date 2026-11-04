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
exports.ImmobilisationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const check_role_util_1 = require("../../common/auth/role/check-role.util");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const entries_service_1 = require("../entries/entries.service");
const mappings_service_1 = require("../accounts/mappings.service");
const pagination_1 = require("../../common/pagination/pagination");
const ACCOUNTING_GLOBAL_SCOPE_ROLES = [client_1.UserRole.FINANCIAL_DIRECTOR];
let ImmobilisationsService = class ImmobilisationsService {
    prisma;
    entriesService;
    mappingsService;
    constructor(prisma, entriesService, mappingsService) {
        this.prisma = prisma;
        this.entriesService = entriesService;
        this.mappingsService = mappingsService;
    }
    computeAnnualDotation(asset, year) {
        const base = Number(asset.acquisitionCost) - Number(asset.residualValue);
        const remaining = base - Number(asset.cumulativeAmortization);
        if (remaining <= 0)
            return 0;
        const acquisitionYear = asset.acquisitionDate.getFullYear();
        if (year < acquisitionYear)
            return 0;
        let dotation = base * (Number(asset.depreciationRate) / 100);
        if (year === acquisitionYear) {
            const monthsRemaining = 12 - asset.acquisitionDate.getMonth();
            dotation = dotation * (monthsRemaining / 12);
        }
        return Math.min(dotation, remaining);
    }
    async generateAnnualDepreciation(user, year, subsidiaryIdFilter) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission refusée pour générer les dotations aux amortissements.');
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
        const effectiveSubsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, subsidiaryIdFilter);
        const assets = await this.prisma.fixedAsset.findMany({
            where: {
                status: client_1.FixedAssetStatus.ACTIVE,
                acquisitionDate: { lte: new Date(`${year}-12-31`) },
                ...(effectiveSubsidiaryId
                    ? { subsidiaryId: effectiveSubsidiaryId }
                    : {}),
            },
        });
        const mappings = await this.mappingsService.getMap();
        const amortExpenseAccount = mappings['AMORTIZATION_EXPENSE'] || '681000';
        const amortAccount = mappings['AMORTIZATION_ACCOUNT'] || '281000';
        const results = [];
        for (const asset of assets) {
            if (asset.lastAmortizationYear && asset.lastAmortizationYear >= year) {
                results.push({
                    assetId: asset.id,
                    name: asset.fixedAssetsName,
                    dotation: 0,
                    skipped: 'déjà traité pour cet exercice',
                });
                continue;
            }
            const dotation = this.computeAnnualDotation(asset, year);
            if (dotation <= 0) {
                results.push({
                    assetId: asset.id,
                    name: asset.fixedAssetsName,
                    dotation: 0,
                    skipped: 'entièrement amorti ou hors période',
                });
                continue;
            }
            await this.entriesService.createAutomaticEntry({
                date: new Date(`${year}-12-31`),
                reference: `AMORT-${asset.id}-${year}`,
                description: `Dotation aux amortissements ${year} — ${asset.fixedAssetsName}`,
                journalCode: 'JOD',
                subsidiaryId: asset.subsidiaryId,
                sourceType: 'FIXED_ASSET_AMORTIZATION',
                sourceId: asset.id,
                lines: [
                    {
                        accountNumber: amortExpenseAccount,
                        description: 'Dotation aux amortissements',
                        debitAmount: dotation,
                        creditAmount: 0,
                    },
                    {
                        accountNumber: amortAccount,
                        description: 'Amortissements cumulés',
                        debitAmount: 0,
                        creditAmount: dotation,
                    },
                ],
            });
            await this.prisma.fixedAsset.update({
                where: { id: asset.id },
                data: {
                    cumulativeAmortization: { increment: dotation },
                    lastAmortizationYear: year,
                },
            });
            results.push({
                assetId: asset.id,
                name: asset.fixedAssetsName,
                dotation,
            });
        }
        return {
            year,
            totalDotation: results.reduce((s, r) => s + r.dotation, 0),
            assets: results,
        };
    }
    async dispose(id, dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission refusée pour céder une immobilisation.');
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
        const asset = await this.prisma.fixedAsset.findUnique({ where: { id } });
        if (!asset)
            throw new common_1.NotFoundException(`Immobilisation "${id}" introuvable.`);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(asset.subsidiaryId, ctx);
        if (asset.status === client_1.FixedAssetStatus.DISPOSED) {
            throw new common_1.BadRequestException('Cette immobilisation a déjà été cédée.');
        }
        const mappings = await this.mappingsService.getMap();
        const assetAccount = mappings['FIXED_ASSET'] || '215000';
        const amortAccount = mappings['AMORTIZATION_ACCOUNT'] || '281000';
        const nbvChargeAccount = mappings['DISPOSAL_NBV_CHARGE'] || '671000';
        const receivableAccount = mappings['DISPOSAL_RECEIVABLE'] || '462000';
        const proceedsAccount = mappings['DISPOSAL_PROCEEDS'] || '771000';
        const cumulativeAmortization = Number(asset.cumulativeAmortization);
        const netBookValue = Number(asset.acquisitionCost) - cumulativeAmortization;
        const disposalAmount = dto.disposalAmount;
        const lines = [
            {
                accountNumber: amortAccount,
                description: 'Solde amortissement cumulé',
                debitAmount: cumulativeAmortization,
                creditAmount: 0,
            },
            {
                accountNumber: nbvChargeAccount,
                description: 'Valeur nette comptable de la cession',
                debitAmount: netBookValue,
                creditAmount: 0,
            },
            {
                accountNumber: assetAccount,
                description: 'Sortie du bien (valeur brute)',
                debitAmount: 0,
                creditAmount: Number(asset.acquisitionCost),
            },
        ].filter((l) => l.debitAmount > 0 || l.creditAmount > 0);
        if (disposalAmount > 0) {
            lines.push({
                accountNumber: receivableAccount,
                description: 'Créance sur cession',
                debitAmount: disposalAmount,
                creditAmount: 0,
            }, {
                accountNumber: proceedsAccount,
                description: 'Produit de cession',
                debitAmount: 0,
                creditAmount: disposalAmount,
            });
        }
        const disposalDate = new Date(dto.disposalDate);
        await this.entriesService.createAutomaticEntry({
            date: disposalDate,
            reference: `DISPOSAL-${asset.id}`,
            description: `Cession — ${asset.fixedAssetsName}`,
            journalCode: 'JOD',
            subsidiaryId: asset.subsidiaryId,
            sourceType: 'FIXED_ASSET_DISPOSAL',
            sourceId: asset.id,
            lines,
        });
        return this.prisma.fixedAsset.update({
            where: { id },
            data: {
                status: client_1.FixedAssetStatus.DISPOSED,
                disposalDate,
                disposalAmount,
            },
        });
    }
    async findAll(user, subsidiaryIdFilter, paginationQuery = {}) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
        const effectiveSubsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, subsidiaryIdFilter);
        return (0, pagination_1.paginate)(this.prisma.fixedAsset, {
            where: effectiveSubsidiaryId
                ? { subsidiaryId: effectiveSubsidiaryId }
                : {},
            orderBy: { acquisitionDate: 'desc' },
        }, paginationQuery);
    }
};
exports.ImmobilisationsService = ImmobilisationsService;
exports.ImmobilisationsService = ImmobilisationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        entries_service_1.EntriesService,
        mappings_service_1.MappingsService])
], ImmobilisationsService);
//# sourceMappingURL=immobilisations.service.js.map