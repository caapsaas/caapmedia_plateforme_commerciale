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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const stock_movements_service_1 = require("../stock-movements/stock-movements.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const pagination_1 = require("../../common/pagination/pagination");
let SuppliersService = class SuppliersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createSupplierDto, user) {
        const { subsidiaryId } = user;
        const existingSupplier = await this.prisma.supplier.findFirst({
            where: {
                supplierName: createSupplierDto.supplierName,
                subsidiaryId: subsidiaryId,
            },
        });
        if (existingSupplier) {
            throw new common_1.ConflictException(`Un fournisseur avec le nom "${createSupplierDto.supplierName}" existe déjà dans cette filiale.`);
        }
        return this.prisma.supplier.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.SUPPLIER),
                ...createSupplierDto,
                subsidiaryId: subsidiaryId,
            },
        });
    }
    async findAll(user, paginationQuery, subsidiaryId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user);
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({}, ctx, subsidiaryId);
        if (paginationQuery.search) {
            where.OR = [
                {
                    supplierName: {
                        contains: paginationQuery.search,
                        mode: 'insensitive',
                    },
                },
                { company: { contains: paginationQuery.search, mode: 'insensitive' } },
                { email: { contains: paginationQuery.search, mode: 'insensitive' } },
            ];
        }
        return (0, pagination_1.paginate)(this.prisma.supplier, { where, orderBy: { supplierName: 'asc' } }, paginationQuery);
    }
    async findOne(id, user) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
        });
        if (!supplier) {
            throw new common_1.NotFoundException(`Fournisseur avec l'ID "${id}" non trouvé.`);
        }
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(supplier.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
        return supplier;
    }
    async update(id, updateSupplierDto, user) {
        await this.findOne(id, user);
        return this.prisma.supplier.update({
            where: { id },
            data: updateSupplierDto,
        });
    }
    async remove(id, user) {
        return this.prisma.$transaction(async (tx) => {
            const supplier = await tx.supplier.findUnique({ where: { id } });
            if (!supplier) {
                throw new common_1.NotFoundException(`Fournisseur avec l'ID "${id}" non trouvé.`);
            }
            (0, subsidiary_scope_1.assertSubsidiaryAccess)(supplier.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
            const orders = await tx.purchaseOrder.findMany({
                where: { supplierId: id },
                select: { id: true, supplierDebts: { select: { id: true } } },
            });
            const orderIds = orders.map((order) => order.id);
            const documentIds = [
                id,
                ...orderIds,
                ...orders.flatMap((order) => order.supplierDebts.map((debt) => debt.id)),
            ];
            const payments = await tx.financialTransaction.findMany({
                where: { relatedDocumentId: { in: documentIds } },
            });
            for (const payment of payments) {
                if (payment.status !== client_1.TransactionStatus.VALIDE)
                    continue;
                const delta = payment.financialTransactionType === client_1.TransactionType.DEPENSE
                    ? payment.amount
                    : payment.amount.negated();
                await tx.treasuryAccount.update({
                    where: { id: payment.sourceAccountId ?? payment.treasuryAccountId },
                    data: { balance: { increment: delta } },
                });
                if (payment.destinationAccountId) {
                    await tx.treasuryAccount.update({
                        where: { id: payment.destinationAccountId },
                        data: { balance: { decrement: payment.amount } },
                    });
                }
            }
            const sourceIds = [
                ...documentIds,
                ...payments.map((payment) => payment.id),
            ];
            await tx.accountingOutboxEntry.deleteMany({
                where: {
                    OR: sourceIds.map((sourceId) => ({
                        payload: { path: ['sourceId'], equals: sourceId },
                    })),
                },
            });
            let entries = await tx.journalEntry.findMany({
                where: { sourceId: { in: sourceIds } },
                select: { id: true },
            });
            const entryIds = new Set(entries.map((entry) => entry.id));
            while (entries.length) {
                entries = await tx.journalEntry.findMany({
                    where: {
                        reversalOfEntryId: { in: entries.map((entry) => entry.id) },
                        id: { notIn: [...entryIds] },
                    },
                    select: { id: true },
                });
                entries.forEach((entry) => entryIds.add(entry.id));
            }
            if (entryIds.size) {
                await tx.journalEntry.updateMany({
                    where: { id: { in: [...entryIds] } },
                    data: { reversalOfEntryId: null },
                });
                await tx.journalEntry.deleteMany({
                    where: { id: { in: [...entryIds] } },
                });
            }
            await tx.financialTransaction.deleteMany({
                where: { id: { in: payments.map((payment) => payment.id) } },
            });
            const movements = await tx.stockMovement.findMany({
                where: { purchaseOrderId: { in: orderIds } },
            });
            for (const movement of movements) {
                const delta = stock_movements_service_1.IN_MOVEMENT_TYPES.has(movement.type)
                    ? movement.quantity.negated()
                    : movement.quantity;
                await tx.itemStock.update({
                    where: {
                        itemId_subsidiaryId: {
                            itemId: movement.itemId,
                            subsidiaryId: movement.subsidiaryId,
                        },
                    },
                    data: { stock: { increment: delta } },
                });
            }
            await tx.stockMovement.deleteMany({
                where: { purchaseOrderId: { in: orderIds } },
            });
            await tx.item.updateMany({
                where: { mainSupplierId: id },
                data: { mainSupplierId: null },
            });
            return tx.supplier.delete({ where: { id } });
        }, {
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            timeout: 30000,
        });
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map