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
exports.JournalsService = exports.DEFAULT_JOURNALS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
exports.DEFAULT_JOURNALS = [
    { code: 'JV', name: 'Journal des Ventes', journalType: client_1.JournalType.VENTES },
    { code: 'JA', name: 'Journal des Achats', journalType: client_1.JournalType.ACHATS },
    { code: 'JB', name: 'Journal de Banque', journalType: client_1.JournalType.BANQUE },
    { code: 'JC', name: 'Journal de Caisse', journalType: client_1.JournalType.CAISSE },
    {
        code: 'JOD',
        name: 'Journal des Opérations Diverses',
        journalType: client_1.JournalType.OD,
    },
];
let JournalsService = class JournalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedDefaultJournals() {
        for (const j of exports.DEFAULT_JOURNALS) {
            await this.prisma.accountingJournal.upsert({
                where: { code: j.code },
                create: { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ACCOUNTINGJOURNAL), ...j },
                update: { name: j.name, journalType: j.journalType },
            });
        }
    }
    async findAll() {
        return this.prisma.accountingJournal.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' },
        });
    }
    async findByCode(code) {
        const journal = await this.prisma.accountingJournal.findUnique({
            where: { code },
        });
        if (!journal)
            throw new common_1.NotFoundException(`Journal "${code}" introuvable.`);
        return journal;
    }
};
exports.JournalsService = JournalsService;
exports.JournalsService = JournalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JournalsService);
//# sourceMappingURL=journals.service.js.map