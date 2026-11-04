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
exports.OpportunitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const role_identity_1 = require("../../common/auth/role/role-identity");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const safeRelations = {
    contact: {
        select: {
            id: true,
            contactName: true,
            company: true,
            email: true,
            phone: true,
            address: true,
            accountId: true,
            subsidiaryId: true,
            salesRepId: true,
            status: true,
        },
    },
    account: {
        select: {
            id: true,
            accountName: true,
            industry: true,
            phone: true,
            address: true,
            subsidiaryId: true,
            salesRepId: true,
        },
    },
    user: { select: { id: true, userName: true, email: true } },
};
const listRelations = {
    ...safeRelations,
    products: { include: { product: true } },
};
const detailRelations = {
    ...listRelations,
    crmTasks: true,
};
let OpportunitiesService = class OpportunitiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toResponse(opportunity) {
        return {
            ...opportunity,
            opportunityValue: opportunity.opportunityValue.toNumber(),
            productIds: opportunity.products.map((link) => link.productId),
            products: opportunity.products.map((link) => link.product),
        };
    }
    accessWhere(user) {
        const scope = (0, subsidiary_scope_1.resolveScopeContext)(user);
        if (!user.id?.trim())
            throw new common_1.ForbiddenException('Identité utilisateur requise.');
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({}, scope);
        const activeRole = (0, role_identity_1.getActiveRole)(user);
        if (!scope.hasGlobalScope &&
            activeRole !== client_1.UserRole.ADMIN &&
            activeRole !== client_1.UserRole.SECRETARY) {
            where.userId = user.id;
        }
        return where;
    }
    async findAccessible(id, user, db = this.prisma) {
        const opportunity = await db.opportunity.findUnique({
            where: { ...this.accessWhere(user), id },
            include: detailRelations,
        });
        if (!opportunity)
            throw new common_1.NotFoundException(`Opportunity with ID "${id}" not found.`);
        return opportunity;
    }
    async validateReferences(db, contactId, accountId, subsidiaryId) {
        if (!contactId || !accountId)
            throw new common_1.BadRequestException('Contact ID and Account ID are required.');
        const [contact, account] = await Promise.all([
            db.contact.findUnique({
                where: { id: contactId, subsidiaryId },
                select: { id: true, accountId: true },
            }),
            db.account.findUnique({
                where: { id: accountId, subsidiaryId },
                select: { id: true },
            }),
        ]);
        if (!contact || !account)
            throw new common_1.NotFoundException('Contact or Account not found in this subsidiary.');
        if (contact.accountId !== accountId)
            throw new common_1.BadRequestException('The contact must belong to the selected account.');
    }
    async validateProducts(db, productIds) {
        if (productIds === undefined)
            return undefined;
        if (!Array.isArray(productIds))
            throw new common_1.BadRequestException('Product IDs must be an array.');
        const ids = [...new Set(productIds)];
        if (ids.length &&
            (await db.item.count({ where: { id: { in: ids } } })) !== ids.length) {
            throw new common_1.NotFoundException('One or more products were not found.');
        }
        return ids;
    }
    async create(dto, user) {
        this.accessWhere(user);
        if (!dto.contactId || !dto.accountId) {
            throw new common_1.BadRequestException('Contact ID and Account ID are required.');
        }
        const scope = (0, subsidiary_scope_1.resolveScopeContext)(user);
        return this.prisma.$transaction(async (tx) => {
            const account = await tx.account.findUnique({
                where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id: dto.accountId }, scope),
                select: { id: true, subsidiaryId: true },
            });
            if (!account)
                throw new common_1.NotFoundException('Account not found in this subsidiary.');
            await this.validateReferences(tx, dto.contactId, dto.accountId, account.subsidiaryId);
            const productIds = await this.validateProducts(tx, dto.productIds);
            const opportunity = await tx.opportunity.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.OPPORTUNITY),
                    opportunityName: dto.opportunityName,
                    opportunityValue: dto.opportunityValue,
                    closeDate: new Date(dto.closeDate),
                    stage: dto.stage,
                    sourceOpportunity: dto.sourceOpportunity,
                    contactId: dto.contactId,
                    accountId: dto.accountId,
                    userId: user.id,
                    subsidiaryId: account.subsidiaryId,
                    products: productIds
                        ? {
                            create: productIds.map((productId) => ({
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.OPPORTUNITYPRODUCT),
                                productId,
                            })),
                        }
                        : undefined,
                },
                include: detailRelations,
            });
            return this.toResponse(opportunity);
        });
    }
    async findAll(user, paginationQuery = {}) {
        const where = this.accessWhere(user);
        if (paginationQuery.search)
            where.opportunityName = {
                contains: paginationQuery.search,
                mode: 'insensitive',
            };
        const result = await (0, pagination_1.paginate)({
            findMany: (args) => this.prisma.opportunity.findMany({ ...args, include: listRelations }),
            count: (args) => this.prisma.opportunity.count(args),
        }, {
            where,
            orderBy: { closeDate: 'desc' },
        }, paginationQuery);
        return {
            ...result,
            data: result.data.map((opportunity) => this.toResponse(opportunity)),
        };
    }
    async findOne(id, user) {
        return this.toResponse(await this.findAccessible(id, user));
    }
    async update(id, dto, user) {
        const accessWhere = this.accessWhere(user);
        return this.prisma.$transaction(async (tx) => {
            const existing = await this.findAccessible(id, user, tx);
            const contactId = dto.contactId ?? existing.contactId;
            const accountId = dto.accountId ?? existing.accountId;
            await this.validateReferences(tx, contactId, accountId, existing.subsidiaryId);
            const productIds = await this.validateProducts(tx, dto.productIds);
            const opportunity = await tx.opportunity.update({
                where: { ...accessWhere, id },
                data: {
                    opportunityName: dto.opportunityName,
                    opportunityValue: dto.opportunityValue,
                    closeDate: dto.closeDate === undefined ? undefined : new Date(dto.closeDate),
                    stage: dto.stage,
                    sourceOpportunity: dto.sourceOpportunity,
                    contactId,
                    accountId,
                    products: productIds
                        ? {
                            deleteMany: {},
                            create: productIds.map((productId) => ({
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.OPPORTUNITYPRODUCT),
                                productId,
                            })),
                        }
                        : undefined,
                },
                include: detailRelations,
            });
            return this.toResponse(opportunity);
        });
    }
    async remove(id, user) {
        await this.findAccessible(id, user);
        const opportunity = await this.prisma.opportunity.delete({
            where: { ...this.accessWhere(user), id },
            include: listRelations,
        });
        return this.toResponse(opportunity);
    }
};
exports.OpportunitiesService = OpportunitiesService;
exports.OpportunitiesService = OpportunitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OpportunitiesService);
//# sourceMappingURL=opportunities.service.js.map