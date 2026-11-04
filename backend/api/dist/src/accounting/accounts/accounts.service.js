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
exports.AccountsService = exports.SYSCOHADA_SEED_ACCOUNTS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
exports.SYSCOHADA_SEED_ACCOUNTS = [
    { num: '101000', name: 'Capital social', type: 'EQUITY', class: 1 },
    { num: '110000', name: 'Report à nouveau', type: 'EQUITY', class: 1 },
    { num: '111000', name: 'Réserve légale', type: 'EQUITY', class: 1 },
    {
        num: '120000',
        name: "Résultat net de l'exercice",
        type: 'EQUITY',
        class: 1,
    },
    {
        num: '162000',
        name: 'Emprunts auprès des établissements de crédit',
        type: 'LIABILITY',
        class: 1,
    },
    {
        num: '163000',
        name: 'Autres emprunts à long terme',
        type: 'LIABILITY',
        class: 1,
    },
    { num: '211000', name: 'Terrains', type: 'ASSET', class: 2 },
    { num: '215000', name: 'Matériel et outillage', type: 'ASSET', class: 2 },
    {
        num: '218000',
        name: 'Autres immobilisations corporelles',
        type: 'ASSET',
        class: 2,
    },
    {
        num: '221000',
        name: 'Brevets, licences, logiciels',
        type: 'ASSET',
        class: 2,
    },
    {
        num: '281000',
        name: 'Amortissements des immobilisations',
        type: 'ASSET',
        class: 2,
    },
    { num: '310000', name: 'Stocks de marchandises', type: 'ASSET', class: 3 },
    {
        num: '320000',
        name: 'Stocks de matières premières',
        type: 'ASSET',
        class: 3,
    },
    { num: '401000', name: 'Fournisseurs', type: 'LIABILITY', class: 4 },
    {
        num: '408000',
        name: 'Fournisseurs — Factures non parvenues',
        type: 'LIABILITY',
        class: 4,
    },
    { num: '411000', name: 'Clients', type: 'ASSET', class: 4 },
    { num: '411300', name: 'Clients divers', type: 'ASSET', class: 4 },
    {
        num: '418000',
        name: 'Clients — Produits à recevoir',
        type: 'ASSET',
        class: 4,
    },
    {
        num: '421000',
        name: 'Personnel — Rémunérations dues',
        type: 'LIABILITY',
        class: 4,
    },
    {
        num: '425000',
        name: 'Personnel — Avances et acomptes',
        type: 'ASSET',
        class: 4,
    },
    {
        num: '431000',
        name: 'Sécurité sociale — Cotisations (CNSS)',
        type: 'LIABILITY',
        class: 4,
    },
    {
        num: '462000',
        name: "Créances sur cessions d'immobilisations",
        type: 'ASSET',
        class: 4,
    },
    { num: '443100', name: 'TVA collectée (18%)', type: 'LIABILITY', class: 4 },
    { num: '445100', name: 'TVA déductible sur achats', type: 'ASSET', class: 4 },
    {
        num: '445200',
        name: 'TVA déductible sur services',
        type: 'ASSET',
        class: 4,
    },
    {
        num: '446000',
        name: "État — Autres impôts sur chiffre d'affaires (BIC)",
        type: 'LIABILITY',
        class: 4,
    },
    {
        num: '447000',
        name: 'Impôt sur les sociétés (IS)',
        type: 'LIABILITY',
        class: 4,
    },
    {
        num: '447100',
        name: 'État — IUTS (impôt sur salaires) à verser',
        type: 'LIABILITY',
        class: 4,
    },
    {
        num: '447300',
        name: 'État — TPA à verser',
        type: 'LIABILITY',
        class: 4,
    },
    {
        num: '447500',
        name: 'État — TVA retenue à la source',
        type: 'LIABILITY',
        class: 4,
    },
    {
        num: '447800',
        name: 'État — Autres retenues sur salaires à verser',
        type: 'LIABILITY',
        class: 4,
    },
    {
        num: '471000',
        name: "Produits constatés d'avance",
        type: 'LIABILITY',
        class: 4,
    },
    {
        num: '481000',
        name: "Charges constatées d'avance",
        type: 'ASSET',
        class: 4,
    },
    { num: '521000', name: 'Banques comptes courants', type: 'ASSET', class: 5 },
    { num: '522000', name: 'Banques — Découverts', type: 'LIABILITY', class: 5 },
    { num: '571000', name: 'Caisse', type: 'ASSET', class: 5 },
    { num: '571100', name: 'Caisse — boîte de dépense', type: 'ASSET', class: 5 },
    { num: '571200', name: 'Caisse — coffre-fort', type: 'ASSET', class: 5 },
    { num: '581000', name: 'Virements internes', type: 'ASSET', class: 5 },
    { num: '601000', name: 'Achats de marchandises', type: 'EXPENSE', class: 6 },
    {
        num: '602000',
        name: 'Achats de matières premières',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '603000',
        name: 'Variation de stocks de marchandises',
        type: 'EXPENSE',
        class: 6,
    },
    { num: '604000', name: "Achats d'emballages", type: 'EXPENSE', class: 6 },
    {
        num: '605200',
        name: 'Eau, électricité et factures diverses',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '606000',
        name: 'Achats de fournitures de bureau',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '611000',
        name: 'Transport — collecte fournisseur',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '612000',
        name: 'Transport — livraison client',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '613000',
        name: 'Locations et charges locatives',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '614000',
        name: 'Charges locatives et de copropriété',
        type: 'EXPENSE',
        class: 6,
    },
    { num: '621000', name: 'Personnel extérieur', type: 'EXPENSE', class: 6 },
    {
        num: '624000',
        name: 'Transport de marchandises et déplacements',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '625000',
        name: 'Déplacements, missions et réceptions',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '627000',
        name: 'Publicité, publication, relations publiques',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '627200',
        name: 'Frais de marketing',
        type: 'EXPENSE',
        class: 6,
    },
    { num: '628000', name: 'Divers frais et charges', type: 'EXPENSE', class: 6 },
    {
        num: '631000',
        name: 'Impôts et taxes (hors IS)',
        type: 'EXPENSE',
        class: 6,
    },
    { num: '638000', name: 'Expressions de besoin', type: 'EXPENSE', class: 6 },
    {
        num: '641000',
        name: 'Appointements et salaires',
        type: 'EXPENSE',
        class: 6,
    },
    { num: '641400', name: 'TPA (taxe sur salaires)', type: 'EXPENSE', class: 6 },
    {
        num: '644000',
        name: 'Primes et gratifications',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '645000',
        name: 'Indemnités et avantages divers',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '646000',
        name: 'Cotisations aux organismes sociaux',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '651000',
        name: 'Pertes sur créances irrécouvrables',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '658000',
        name: 'Charges HAO (hors activité ordinaire)',
        type: 'EXPENSE',
        class: 6,
    },
    { num: '659000', name: 'Charges diverses', type: 'EXPENSE', class: 6 },
    { num: '661000', name: 'Intérêts sur emprunts', type: 'EXPENSE', class: 6 },
    {
        num: '671000',
        name: "Valeurs comptables des cessions d'actif",
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '681000',
        name: 'Dotations aux amortissements',
        type: 'EXPENSE',
        class: 6,
    },
    {
        num: '691000',
        name: 'Impôt sur les bénéfices (IS — 30%)',
        type: 'EXPENSE',
        class: 6,
    },
    { num: '701000', name: 'Ventes de marchandises', type: 'REVENUE', class: 7 },
    { num: '706000', name: 'Prestations de services', type: 'REVENUE', class: 7 },
    {
        num: '707000',
        name: 'Produits des activités annexes',
        type: 'REVENUE',
        class: 7,
    },
    { num: '721000', name: 'Production immobilisée', type: 'REVENUE', class: 7 },
    {
        num: '741000',
        name: "Subventions d'exploitation",
        type: 'REVENUE',
        class: 7,
    },
    {
        num: '754000',
        name: 'Revenus des créances financières',
        type: 'REVENUE',
        class: 7,
    },
    {
        num: '771000',
        name: "Produits de cession d'actif",
        type: 'REVENUE',
        class: 7,
    },
    {
        num: '781000',
        name: 'Reprises sur provisions et dépréciations',
        type: 'REVENUE',
        class: 7,
    },
];
let AccountsService = class AccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedSyscohada() {
        for (const acc of exports.SYSCOHADA_SEED_ACCOUNTS) {
            await this.prisma.accountingAccount.upsert({
                where: { accountNumber: acc.num },
                create: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ACCOUNTINGACCOUNT),
                    accountNumber: acc.num,
                    accountName: acc.name,
                    accountType: acc.type,
                    class: acc.class,
                    isActive: true,
                },
                update: {
                    accountName: acc.name,
                    accountType: acc.type,
                    class: acc.class,
                },
            });
        }
    }
    async create(dto) {
        const exists = await this.prisma.accountingAccount.findUnique({
            where: { accountNumber: dto.accountNumber },
        });
        if (exists)
            throw new common_1.ConflictException(`Le compte ${dto.accountNumber} existe déjà.`);
        return this.prisma.accountingAccount.create({
            data: { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ACCOUNTINGACCOUNT), ...dto },
        });
    }
    async findAll(paginationQuery, type, includeInactive = false) {
        const where = {
            ...(includeInactive ? {} : { isActive: true }),
            ...(type ? { accountType: type } : {}),
        };
        if (paginationQuery.search) {
            where.OR = [
                {
                    accountNumber: {
                        contains: paginationQuery.search,
                        mode: 'insensitive',
                    },
                },
                {
                    accountName: {
                        contains: paginationQuery.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        return (0, pagination_1.paginate)(this.prisma.accountingAccount, { where, orderBy: { accountNumber: 'asc' } }, paginationQuery);
    }
    async findOne(id) {
        const account = await this.prisma.accountingAccount.findUnique({
            where: { id },
        });
        if (!account)
            throw new common_1.NotFoundException(`Compte ${id} introuvable.`);
        return account;
    }
    async findByNumber(accountNumber) {
        return this.prisma.accountingAccount.findFirst({
            where: { accountNumber, isActive: true },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.accountingAccount.update({ where: { id }, data: dto });
    }
    async deactivate(id) {
        const account = await this.prisma.accountingAccount.findUnique({
            where: { id },
            include: { journalLines: { take: 1 } },
        });
        if (!account)
            throw new common_1.NotFoundException(`Compte ${id} introuvable.`);
        if (account.journalLines.length > 0) {
            throw new common_1.BadRequestException('Ce compte est utilisé dans des écritures comptables et ne peut pas être désactivé.');
        }
        return this.prisma.accountingAccount.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map