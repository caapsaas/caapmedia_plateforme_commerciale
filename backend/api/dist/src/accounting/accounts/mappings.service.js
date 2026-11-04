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
exports.MappingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const DEFAULT_MAPPINGS = {
    SALES_CLIENT: '411000',
    SALES_CLIENT_DIVERSE: '411300',
    SALES_REVENUE: '706000',
    VENDOR_ACCOUNT: '411000',
    VENDOR_MARGIN_REVENUE: '707000',
    TVA_COLLECTEE: '443100',
    PURCHASE_SUPPLIER: '401000',
    PURCHASE_EXPENSE: '601000',
    PURCHASE_COST: '601000',
    TVA_DEDUCTIBLE_ACHAT: '445100',
    STOCK_VARIATION: '603000',
    CASH_ACCOUNT: '571000',
    SAFE_ACCOUNT: '571200',
    EXPENSE_BOX_ACCOUNT: '571100',
    BANK_ACCOUNT: '521000',
    OPENING_BALANCE: '110000',
    BANK_WITHDRAWAL: '581000',
    CASH_REFILL: '581000',
    TVA_RETENUE_ACHAT: '447500',
    BIC_COLLECTEE: '446000',
    PAYROLL_EXPENSE: '641000',
    PAYROLL_BONUS_EXPENSE: '644000',
    PAYROLL_CHARGES_EXPENSE: '646000',
    PAYROLL_TPA_EXPENSE: '641400',
    PAYROLL_NET_PAYABLE: '421000',
    PAYROLL_CNSS_LIABILITY: '431000',
    PAYROLL_IUTS_LIABILITY: '447100',
    PAYROLL_TPA_LIABILITY: '447300',
    PAYROLL_ROSALAIRE_LIABILITY: '447800',
    PAYROLL_ADVANCES: '425000',
    SUPPLIER_PAYMENT: '401000',
    TAX_PAYMENT: '446000',
    TAXES_EXPENSE: '631000',
    HAO_EXPENSE: '658000',
    RENT_EXPENSE: '613000',
    UTILITIES_EXPENSE: '605200',
    MARKETING_EXPENSE: '627200',
    SUPPLIES_EXPENSE: '606000',
    NEED_EXPRESSION_EXPENSE: '659000',
    SALARIES_EXPENSE: '641000',
    TRANSPORT_EXPENSE: '624000',
    TRANSPORT_CLIENT_DELIVERY_EXPENSE: '612000',
    TRANSPORT_SUPPLIER_PICKUP_EXPENSE: '611000',
    OTHER_EXPENSE: '659000',
    FIXED_ASSET: '215000',
    AMORTIZATION_EXPENSE: '681000',
    AMORTIZATION_ACCOUNT: '281000',
    DISPOSAL_RECEIVABLE: '462000',
    DISPOSAL_PROCEEDS: '771000',
    DISPOSAL_NBV_CHARGE: '671000',
    LONG_TERM_DEBT: '162000',
};
let MappingsService = class MappingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.accountMapping.findMany({ orderBy: { key: 'asc' } });
    }
    async getMap() {
        const rows = await this.findAll();
        return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.accountCode }), {});
    }
    async update(key, accountCode) {
        const account = await this.prisma.accountingAccount.findUnique({
            where: { accountNumber: accountCode },
        });
        if (!account) {
            throw new common_1.BadRequestException(`Le compte "${accountCode}" n'existe pas dans le plan comptable.`);
        }
        if (!account.isActive) {
            throw new common_1.BadRequestException(`Le compte "${accountCode}" est désactivé — activez-le avant de l'utiliser dans un mapping.`);
        }
        return this.prisma.accountMapping.upsert({
            where: { key },
            update: { accountCode },
            create: { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ACCOUNTMAPPING), key, accountCode },
        });
    }
    async seedDefaultMappings() {
        const codes = [...new Set(Object.values(DEFAULT_MAPPINGS))];
        const existing = await this.prisma.accountingAccount.findMany({
            where: { accountNumber: { in: codes } },
            select: { accountNumber: true },
        });
        const existingCodes = new Set(existing.map((a) => a.accountNumber));
        const skipped = [];
        for (const [key, accountCode] of Object.entries(DEFAULT_MAPPINGS)) {
            if (!existingCodes.has(accountCode)) {
                skipped.push(`${key} → ${accountCode}`);
                continue;
            }
            await this.prisma.accountMapping.upsert({
                where: { key },
                update: { accountCode },
                create: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ACCOUNTMAPPING),
                    key,
                    accountCode,
                },
            });
        }
        if (skipped.length > 0) {
            console.warn(`[MappingsService] Mappings ignorés (compte introuvable — initialisez le plan comptable d'abord) : ${skipped.join(', ')}`);
        }
        return {
            imported: Object.keys(DEFAULT_MAPPINGS).length - skipped.length,
            skipped: skipped.length,
        };
    }
};
exports.MappingsService = MappingsService;
exports.MappingsService = MappingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MappingsService);
//# sourceMappingURL=mappings.service.js.map