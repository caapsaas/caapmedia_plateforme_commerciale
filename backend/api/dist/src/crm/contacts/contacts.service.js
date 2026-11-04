"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const email_service_1 = require("../../common/utils/email/email.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let ContactsService = class ContactsService {
    prisma;
    jwtService;
    emailService;
    constructor(prisma, jwtService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    withoutPassword(contact) {
        const { passwordHash: _passwordHash, ...safeContact } = contact;
        void _passwordHash;
        return safeContact;
    }
    async create(createContactDto, user) {
        const existingContact = await this.prisma.contact.findUnique({
            where: { email: createContactDto.email },
            select: {
                id: true,
                contactName: true,
                company: true,
                email: true,
                phone: true,
                subsidiaryId: true,
                subsidiary: { select: { subsidiaryName: true } },
            },
        });
        if (existingContact) {
            throw new common_1.ConflictException({
                message: `Un client avec l'email "${createContactDto.email}" existe déjà.`,
                existingContact,
            });
        }
        const tempPassword = Math.random().toString(36).slice(-8) +
            Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const newContact = await this.prisma.contact.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.CONTACT),
                ...createContactDto,
                accountId: createContactDto.accountId || null,
                subsidiaryId: user.subsidiaryId,
                salesRepId: user.id,
                since: createContactDto.since
                    ? new Date(createContactDto.since)
                    : new Date(),
                passwordHash,
                isVerified: true,
            },
        });
        this.emailService.sendWelcomeEmail(createContactDto.email, tempPassword, createContactDto.contactName);
        return {
            ...this.withoutPassword(newContact),
            tempPassword,
            message: 'Contact créé avec succès. Un email avec les identifiants de connexion a été envoyé.',
        };
    }
    async findAll(user, paginationQuery, filterSubsidiaryId, filterSalesRepId) {
        const isSuperAdmin = user.userRole === client_1.UserRole.SUPER_ADMIN;
        const scopeCtx = {
            subsidiaryId: user.subsidiaryId,
            hasGlobalScope: isSuperAdmin,
        };
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({}, scopeCtx, filterSubsidiaryId);
        if (isSuperAdmin) {
            if (filterSalesRepId) {
                where.salesRepId = filterSalesRepId;
            }
        }
        else if (user.userRole === client_1.UserRole.COMMERCIAL) {
            where.salesRepId = user.id;
        }
        if (paginationQuery.search) {
            where.AND = [
                {
                    OR: [
                        {
                            contactName: {
                                contains: paginationQuery.search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            email: { contains: paginationQuery.search, mode: 'insensitive' },
                        },
                        {
                            phone: { contains: paginationQuery.search, mode: 'insensitive' },
                        },
                        {
                            company: {
                                contains: paginationQuery.search,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            ];
        }
        return (0, pagination_1.paginate)(this.prisma.contact, {
            where,
            omit: { passwordHash: true },
            include: {
                salesRep: { select: { userName: true } },
                account: { select: { accountName: true } },
                _count: { select: { opportunities: true, orders: true } },
            },
            orderBy: { contactName: 'asc' },
        }, paginationQuery);
    }
    async searchGlobal(query, paginationQuery = {}) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        const { data } = await (0, pagination_1.paginate)(this.prisma.contact, {
            where: {
                OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { contactName: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                contactName: true,
                company: true,
                email: true,
                phone: true,
                subsidiaryId: true,
                subsidiary: { select: { subsidiaryName: true } },
            },
        }, { page: 1, limit: 10, ...paginationQuery });
        return data;
    }
    async findOne(id, user) {
        const contact = await this.prisma.contact.findUnique({
            where: { id },
            omit: { passwordHash: true },
            include: {
                salesRep: { select: { userName: true, email: true } },
                account: true,
                opportunities: { orderBy: { closeDate: 'desc' } },
                orders: { orderBy: { orderDate: 'desc' } },
                crmTasks: { orderBy: { dueDate: 'asc' } },
            },
        });
        if (!contact) {
            throw new common_1.NotFoundException(`Contact with ID "${id}" not found.`);
        }
        if (contact.subsidiaryId !== user.subsidiaryId ||
            (user.userRole === client_1.UserRole.COMMERCIAL && contact.salesRepId !== user.id)) {
            throw new common_1.ForbiddenException('You are not allowed to view this contact.');
        }
        return contact;
    }
    async update(id, updateContactDto, user) {
        await this.findOne(id, user);
        const { accountId, salesRepId, id: dtoId, _count, account, salesRep, subsidiaryId, ...otherData } = updateContactDto;
        if (otherData.email) {
            const existing = await this.prisma.contact.findFirst({
                where: {
                    email: otherData.email,
                    id: { not: id },
                },
            });
            if (existing)
                throw new common_1.ConflictException('This email is already in use by another contact.');
        }
        const data = { ...otherData };
        if (data.since && typeof data.since === 'string') {
            data.since = new Date(data.since);
        }
        if (accountId !== undefined) {
            data.account = accountId
                ? { connect: { id: accountId } }
                : { disconnect: true };
        }
        if (salesRepId !== undefined) {
            data.salesRep = salesRepId
                ? { connect: { id: salesRepId } }
                : { disconnect: true };
        }
        return this.prisma.contact.update({
            where: { id },
            data,
            omit: { passwordHash: true },
        });
    }
    async remove(id, user) {
        await this.findOne(id, user);
        return this.prisma.contact.delete({
            where: { id },
            omit: { passwordHash: true },
        });
    }
    async register(registerContactDto) {
        const { email, password, ...rest } = registerContactDto;
        const existingContact = await this.prisma.contact.findFirst({
            where: {
                email: email,
            },
        });
        if (existingContact) {
            throw new common_1.ConflictException(`A contact with email "${email}" already exists in this subsidiary.`);
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newContact = await this.prisma.contact.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.CONTACT),
                ...rest,
                email,
                since: registerContactDto.since
                    ? new Date(registerContactDto.since)
                    : new Date(),
                status: client_1.ContactStatus.ACTIVE,
                passwordHash,
            },
        });
        const { passwordHash: _, ...result } = newContact;
        return result;
    }
    async loginContact(contactLoginDto) {
        const { email, password } = contactLoginDto;
        const contact = await this.prisma.contact.findUnique({
            where: { email },
        });
        if (!contact || !contact.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials or portal access not enabled.');
        }
        if (contact.status !== client_1.ContactStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('Your account is not active. Please contact support.');
        }
        const isPasswordMatching = await bcrypt.compare(password, contact.passwordHash);
        if (!isPasswordMatching) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const payload = {
            sub: contact.id,
            email: contact.email,
            type: 'contact',
        };
        return {
            access_token: this.jwtService.sign(payload),
            contact: this.withoutPassword(contact),
        };
    }
    async logoutContact() {
        return {
            message: 'Contact successfully logged out.',
        };
    }
    async getContactProfile(contact) {
        const { passwordHash, ...result } = contact;
        return result;
    }
    async getContactOrders(contactId, paginationQuery = {}) {
        return (0, pagination_1.paginate)(this.prisma.order, {
            where: { customerId: contactId },
            orderBy: { orderDate: 'desc' },
        }, paginationQuery);
    }
    async resetContactPassword(contactId, user) {
        const contact = await this.findOne(contactId, user);
        if (!contact.email) {
            throw new common_1.BadRequestException('Renseignez un email avant d’activer ou réinitialiser l’accès au portail.');
        }
        const tempPassword = Math.random().toString(36).slice(-8) +
            Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const updatedContact = await this.prisma.contact.update({
            where: { id: contactId },
            data: {
                passwordHash,
                isVerified: true,
            },
        });
        this.emailService.sendPasswordResetEmail(contact.email, tempPassword, contact.contactName);
        return {
            ...this.withoutPassword(updatedContact),
            tempPassword,
            message: 'Mot de passe réinitialisé avec succès. Un email avec les nouveaux identifiants a été envoyé.',
        };
    }
    async enablePortalAccess(contactId, user) {
        const contact = await this.findOne(contactId, user);
        if (!contact.email) {
            throw new common_1.BadRequestException('Renseignez un email avant d’activer ou réinitialiser l’accès au portail.');
        }
        const credentials = await this.prisma.contact.findUnique({
            where: { id: contactId },
            select: { passwordHash: true },
        });
        if (credentials?.passwordHash) {
            throw new common_1.ConflictException('Ce contact a déjà un accès au portail activé.');
        }
        const tempPassword = Math.random().toString(36).slice(-8) +
            Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const updatedContact = await this.prisma.contact.update({
            where: { id: contactId },
            data: {
                passwordHash,
                isVerified: true,
                status: client_1.ContactStatus.ACTIVE,
            },
        });
        this.emailService.sendWelcomeEmail(contact.email, tempPassword, contact.contactName);
        return {
            ...this.withoutPassword(updatedContact),
            tempPassword,
            message: 'Accès au portail activé avec succès. Un email avec les identifiants de connexion a été envoyé.',
        };
    }
    async findPublic(id) {
        const contact = await this.prisma.contact.findUnique({
            where: { id },
            select: {
                id: true,
                contactName: true,
                email: true,
                phone: true,
                address: true,
                company: true,
                status: true,
            },
        });
        if (!contact) {
            throw new common_1.NotFoundException(`Contact with ID "${id}" not found.`);
        }
        return contact;
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map