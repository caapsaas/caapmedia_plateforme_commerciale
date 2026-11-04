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
exports.ProformasService = void 0;
const order_notifications_service_1 = require("../../notifications/order-notifications.service");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const creatorSelect = {
    id: true,
    userName: true,
    email: true,
    subsidiaryId: true,
};
let ProformasService = class ProformasService {
    prisma;
    orderNotifications;
    constructor(prisma, orderNotifications) {
        this.prisma = prisma;
        this.orderNotifications = orderNotifications;
    }
    async create(createProformaDto, user) {
        const scope = (0, subsidiary_scope_1.resolveScopeContext)(user);
        const lead = await this.prisma.lead.findUnique({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id: createProformaDto.leadId }, scope),
        });
        if (!lead) {
            throw new common_1.NotFoundException(`Lead with ID "${createProformaDto.leadId}" not found.`);
        }
        const targetSubsidiaryId = lead.subsidiaryId;
        if (!targetSubsidiaryId)
            throw new common_1.BadRequestException('Le lead doit appartenir à une filiale.');
        if (createProformaDto.opportunityId) {
            const opportunity = await this.prisma.opportunity.findUnique({
                where: {
                    id: createProformaDto.opportunityId,
                    subsidiaryId: targetSubsidiaryId,
                },
                select: { id: true },
            });
            if (!opportunity)
                throw new common_1.NotFoundException('Opportunité introuvable dans cette filiale.');
        }
        const proformaNumber = await this.generateProformaNumber(targetSubsidiaryId);
        const taxRate = createProformaDto.taxRate ?? (await this.getDefaultTaxRatePercent());
        const { subtotal, taxAmount, totalAmount } = this.calculateAmounts(createProformaDto.items, taxRate);
        const validityDays = createProformaDto.validityDays || 30;
        const validityDate = (0, date_fns_1.addDays)(new Date(), validityDays);
        return this.prisma.proforma.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PROFORMA),
                proformaNumber,
                leadId: createProformaDto.leadId,
                opportunityId: createProformaDto.opportunityId,
                clientName: createProformaDto.clientName,
                clientEmail: createProformaDto.clientEmail,
                clientPhone: createProformaDto.clientPhone,
                clientCompany: createProformaDto.clientCompany,
                subtotal,
                taxRate,
                taxAmount,
                totalAmount,
                validityDate,
                notes: createProformaDto.notes,
                status: client_1.ProformaStatus.DRAFT,
                createdBy: user.id,
                subsidiaryId: targetSubsidiaryId,
                items: {
                    create: createProformaDto.items.map((item) => ({
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PROFORMAITEM),
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        description: item.description,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                lead: true,
                createdByUser: { select: creatorSelect },
            },
        });
    }
    async findAll(user, paginationQuery, status) {
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({}, (0, subsidiary_scope_1.resolveScopeContext)(user));
        if (status) {
            where.status = status;
        }
        if (paginationQuery.search) {
            where.OR = [
                {
                    proformaNumber: {
                        contains: paginationQuery.search,
                        mode: 'insensitive',
                    },
                },
                {
                    clientName: { contains: paginationQuery.search, mode: 'insensitive' },
                },
                {
                    clientCompany: {
                        contains: paginationQuery.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        return (0, pagination_1.paginate)(this.prisma.proforma, {
            where,
            include: {
                items: { include: { product: true } },
                lead: true,
                createdByUser: { select: creatorSelect },
            },
            orderBy: { createdAt: 'desc' },
        }, paginationQuery);
    }
    async getStatusCounts(user) {
        const scope = (0, subsidiary_scope_1.withSubsidiaryScope)({}, (0, subsidiary_scope_1.resolveScopeContext)(user));
        const [all, draft, sent, accepted, rejected] = await Promise.all([
            this.prisma.proforma.count({ where: scope }),
            this.prisma.proforma.count({
                where: { ...scope, status: client_1.ProformaStatus.DRAFT },
            }),
            this.prisma.proforma.count({
                where: { ...scope, status: client_1.ProformaStatus.SENT },
            }),
            this.prisma.proforma.count({
                where: { ...scope, status: client_1.ProformaStatus.ACCEPTED },
            }),
            this.prisma.proforma.count({
                where: { ...scope, status: client_1.ProformaStatus.REJECTED },
            }),
        ]);
        return { all, draft, sent, accepted, rejected };
    }
    async findOne(id, user) {
        const proforma = await this.prisma.proforma.findUnique({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                lead: true,
                createdByUser: { select: creatorSelect },
                opportunity: true,
            },
        });
        if (!proforma) {
            throw new common_1.NotFoundException(`Proforma with ID "${id}" not found.`);
        }
        return proforma;
    }
    async update(id, updateProformaDto, user) {
        const proforma = await this.findOne(id, user);
        if (proforma.status !== client_1.ProformaStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft proformas can be updated.');
        }
        const { items, ...changes } = updateProformaDto;
        const data = { ...changes };
        if (items || changes.taxRate !== undefined) {
            const amountItems = items ??
                proforma.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice.toNumber(),
                }));
            Object.assign(data, this.calculateAmounts(amountItems, changes.taxRate ?? proforma.taxRate.toNumber()));
        }
        if (items) {
            data.items = {
                deleteMany: {},
                create: items.map((item) => ({
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PROFORMAITEM),
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    description: item.description,
                })),
            };
        }
        return this.prisma.proforma.update({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id, status: client_1.ProformaStatus.DRAFT }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
            data,
            include: {
                items: { include: { product: true } },
                lead: true,
                createdByUser: { select: creatorSelect },
            },
        });
    }
    async send(id, user) {
        const proforma = await this.findOne(id, user);
        if (proforma.status !== client_1.ProformaStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft proformas can be sent.');
        }
        return this.prisma.proforma.update({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id, status: proforma.status }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
            data: {
                status: client_1.ProformaStatus.SENT,
                sentAt: new Date(),
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                lead: true,
            },
        });
    }
    async markAsViewed(id, user) {
        const proforma = await this.findOne(id, user);
        if (proforma.status !== client_1.ProformaStatus.SENT &&
            proforma.status !== client_1.ProformaStatus.VIEWED) {
            throw new common_1.BadRequestException('Only sent or viewed proformas can be marked as viewed.');
        }
        if (!proforma.viewedAt) {
            return this.prisma.proforma.update({
                where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id, status: proforma.status }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
                data: {
                    status: client_1.ProformaStatus.VIEWED,
                    viewedAt: new Date(),
                },
            });
        }
        return proforma;
    }
    async accept(id, user) {
        const proforma = await this.findOne(id, user);
        if (proforma.status !== client_1.ProformaStatus.SENT &&
            proforma.status !== client_1.ProformaStatus.VIEWED) {
            throw new common_1.BadRequestException('Only sent or viewed proformas can be accepted.');
        }
        const { result, order } = await this.prisma.$transaction(async (tx) => {
            const claimed = await tx.proforma.updateMany({
                where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id, status: proforma.status }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
                data: { status: client_1.ProformaStatus.CONVERTED, acceptedAt: new Date() },
            });
            if (claimed.count !== 1) {
                throw new common_1.ConflictException('Ce proforma a déjà été modifié. Rechargez-le avant de réessayer.');
            }
            let contact = await tx.contact.findUnique({
                where: { email: proforma.clientEmail },
            });
            if (!contact) {
                contact = await tx.contact.create({
                    data: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.CONTACT),
                        contactName: proforma.clientName,
                        company: proforma.clientCompany || proforma.clientName,
                        email: proforma.clientEmail,
                        phone: proforma.clientPhone,
                        since: new Date(),
                        address: '',
                        subsidiaryId: proforma.subsidiaryId,
                        status: client_1.ContactStatus.ACTIVE,
                    },
                });
            }
            const defaultTaxRate = await tx.taxRate.findFirstOrThrow({
                where: { isDefault: true },
            });
            const order = await tx.order.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDER),
                    customerName: proforma.clientName,
                    customerId: contact.id,
                    salesRepId: proforma.createdByUser?.subsidiaryId === proforma.subsidiaryId
                        ? proforma.createdBy
                        : null,
                    subsidiaryId: proforma.subsidiaryId,
                    opportunityId: proforma.opportunityId,
                    subtotal: proforma.subtotal,
                    taxAmount: proforma.taxAmount,
                    totalAmount: proforma.totalAmount,
                    taxRateValue: proforma.taxRate,
                    taxRateId: defaultTaxRate.id,
                    applyTax: proforma.taxAmount.greaterThan(0),
                    paymentDueDate: proforma.validityDate,
                    status: client_1.OrderStatus.NEW,
                    productionStatus: client_1.ProductionStatus.PREPRESS,
                    paymentStatus: client_1.PaymentStatus.UNPAID,
                    source: client_1.OrderSource.QUOTE_REQUEST,
                    orderItems: {
                        create: proforma.items.map((item) => ({
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEM),
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            total: item.unitPrice.mul(item.quantity),
                        })),
                    },
                },
            });
            const updatedProforma = await tx.proforma.findUniqueOrThrow({
                where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
                include: {
                    items: { include: { product: true } },
                },
            });
            return { result: { ...updatedProforma, orderId: order.id }, order };
        });
        await this.orderNotifications.created(order);
        return result;
    }
    async reject(id, user) {
        const proforma = await this.findOne(id, user);
        if (proforma.status !== client_1.ProformaStatus.SENT &&
            proforma.status !== client_1.ProformaStatus.VIEWED) {
            throw new common_1.BadRequestException('Only sent or viewed proformas can be rejected.');
        }
        return this.prisma.proforma.update({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id, status: proforma.status }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
            data: {
                status: client_1.ProformaStatus.REJECTED,
            },
        });
    }
    async remove(id, user) {
        const proforma = await this.findOne(id, user);
        if (proforma.status !== client_1.ProformaStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft proformas can be deleted.');
        }
        await this.prisma.proforma.delete({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id, status: proforma.status }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
        });
        return {
            message: `Proforma "${proforma.proformaNumber}" deleted successfully.`,
        };
    }
    async generateProformaNumber(subsidiaryId) {
        const year = new Date().getFullYear();
        const count = await this.prisma.proforma.count({
            where: {
                subsidiaryId,
                createdAt: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            },
        });
        const number = String(count + 1).padStart(4, '0');
        return `PRO-${year}-${number}`;
    }
    async getDefaultTaxRatePercent() {
        const taxRate = await this.prisma.taxRate.findFirstOrThrow({
            where: { isDefault: true },
        });
        return Number(taxRate.rate) * 100;
    }
    calculateAmounts(items, taxRate) {
        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal + taxAmount;
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100,
        };
    }
};
exports.ProformasService = ProformasService;
exports.ProformasService = ProformasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        order_notifications_service_1.OrderNotificationsService])
], ProformasService);
//# sourceMappingURL=proformas.service.js.map