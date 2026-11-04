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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const accounts_service_1 = require("../accounts/accounts.service");
const contacts_service_1 = require("../contacts/contacts.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let LeadsService = class LeadsService {
    prisma;
    accountsService;
    contactsService;
    constructor(prisma, accountsService, contactsService) {
        this.prisma = prisma;
        this.accountsService = accountsService;
        this.contactsService = contactsService;
    }
    async createPublicLead(dto) {
        const existing = await this.prisma.lead.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException(`Un lead avec l'email "${dto.email}" existe déjà.`);
        }
        const defaultSubsidiary = await this.prisma.subsidiary.findFirst({
            orderBy: { subsidiaryName: 'asc' },
        });
        if (!defaultSubsidiary) {
            throw new common_1.BadRequestException('Aucune filiale configurée. Impossible de créer le lead.');
        }
        return this.prisma.lead.create({
            data: {
                leadName: dto.leadName,
                company: dto.company,
                email: dto.email,
                phone: dto.phone,
                description: dto.description,
                status: 'NEW',
                subsidiaryId: defaultSubsidiary.id,
            },
        });
    }
    async create(createLeadDto, user) {
        const fullUser = await this.prisma.user.findUnique({
            where: { id: user.id },
        });
        if (!fullUser) {
            throw new common_1.NotFoundException(`User with ID "${user.id}" not found.`);
        }
        let finalSalesRepId = null;
        if (fullUser.userRole === client_1.UserRole.ADMIN && createLeadDto.salesRepId) {
            let salesRepEmployee = await this.prisma.employee.findUnique({
                where: { id: createLeadDto.salesRepId },
                select: { id: true },
            });
            if (!salesRepEmployee) {
                const salesRepUser = await this.prisma.user.findUnique({
                    where: { id: createLeadDto.salesRepId },
                    select: { email: true },
                });
                if (salesRepUser) {
                    salesRepEmployee = await this.prisma.employee.findUnique({
                        where: { email: salesRepUser.email },
                        select: { id: true },
                    });
                }
            }
            if (!salesRepEmployee) {
                throw new common_1.NotFoundException(`No employee record found for sales representative "${createLeadDto.salesRepId}".`);
            }
            finalSalesRepId = salesRepEmployee.id;
        }
        else if (fullUser.userRole === client_1.UserRole.COMMERCIAL) {
            const creatorEmployee = await this.prisma.employee.findUnique({
                where: { email: fullUser.email },
                select: { id: true },
            });
            finalSalesRepId = creatorEmployee?.id ?? null;
        }
        const email = createLeadDto.email?.trim() || null;
        const existingLead = email
            ? await this.prisma.lead.findUnique({ where: { email } })
            : null;
        if (existingLead) {
            throw new common_1.ConflictException(`A lead with the email "${createLeadDto.email}" already exists.`);
        }
        return this.prisma.lead.create({
            data: {
                ...createLeadDto,
                email,
                phone: createLeadDto.phone?.trim() || null,
                subsidiaryId: fullUser.subsidiaryId,
                salesRepId: finalSalesRepId,
            },
        });
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
        else {
            const privilegedRoles = [client_1.UserRole.ADMIN, client_1.UserRole.SECRETARY];
            if (!privilegedRoles.includes(user.userRole)) {
                where.OR = [{ salesRepId: user.id }, { salesRepId: null }];
            }
        }
        if (paginationQuery.search) {
            where.AND = [
                {
                    OR: [
                        {
                            leadName: {
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
        return (0, pagination_1.paginate)(this.prisma.lead, { where, orderBy: { leadName: 'asc' } }, paginationQuery);
    }
    async findOne(id) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });
        if (!lead) {
            throw new common_1.NotFoundException(`Lead with ID "${id}" not found.`);
        }
        return lead;
    }
    async update(id, updateLeadDto) {
        const lead = await this.findOne(id);
        const normalizedEmail = updateLeadDto.email?.trim() || null;
        if (normalizedEmail) {
            const existingLead = await this.prisma.lead.findUnique({
                where: { email: normalizedEmail },
            });
            if (existingLead && existingLead.id !== id) {
                throw new common_1.ConflictException(`A lead with email "${updateLeadDto.email}" already exists.`);
            }
        }
        return this.prisma.lead.update({
            where: { id },
            data: {
                ...updateLeadDto,
                ...(updateLeadDto.email !== undefined ? { email: normalizedEmail } : {}),
                ...(updateLeadDto.phone !== undefined
                    ? { phone: updateLeadDto.phone?.trim() || null }
                    : {}),
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.lead.delete({ where: { id } });
        return { message: `Lead with ID "${id}" deleted successfully.` };
    }
    async convert(id, user) {
        const [fullUser, lead] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: user.id } }),
            this.prisma.lead.findUnique({ where: { id } }),
        ]);
        if (!fullUser)
            throw new common_1.NotFoundException(`User with ID "${user.id}" not found.`);
        if (!lead)
            throw new common_1.NotFoundException(`Lead with ID "${id}" not found.`);
        if (lead.status !== client_1.LeadStatus.QUALIFIED)
            throw new common_1.BadRequestException('Only qualified leads can be converted.');
        if (!lead.email || !lead.phone) {
            throw new common_1.BadRequestException('Ajoutez un courriel et un téléphone à cette piste avant de la convertir en contact.');
        }
        const salesRepId = lead.salesRepId ?? fullUser.id;
        return this.prisma.$transaction(async (tx) => {
            let account;
            try {
                account = await this.accountsService.create({
                    accountName: lead.leadName,
                    industry: lead.company,
                    phone: lead.phone,
                    address: 'Unknown',
                    subsidiaryId: fullUser.subsidiaryId,
                    salesRepId: lead.salesRepId ?? undefined,
                }, user);
            }
            catch (error) {
                if (error instanceof common_1.ConflictException) {
                    const existingAccount = await tx.account.findFirst({
                        where: {
                            accountName: lead.leadName,
                            subsidiaryId: fullUser.subsidiaryId,
                        },
                    });
                    if (!existingAccount)
                        throw new common_1.NotFoundException(`Failed to find existing account for company "${lead.company}" after conflict.`);
                    account = existingAccount;
                }
                else {
                    throw error;
                }
            }
            const contactDto = {
                contactName: lead.leadName,
                company: lead.company,
                email: lead.email,
                phone: lead.phone,
                address: 'Unknown',
                accountId: account.id,
            };
            const contact = await this.contactsService.create(contactDto, fullUser);
            const opportunity = await tx.opportunity.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.OPPORTUNITY),
                    opportunityName: `Opportunity from ${lead.leadName}`,
                    opportunityValue: 0,
                    closeDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                    stage: client_1.OpportunityStage.QUALIFICATION,
                    sourceOpportunity: client_1.OpportunitySource.MANUAL,
                    contactId: contact.id,
                    accountId: account.id,
                    userId: fullUser.id,
                    subsidiaryId: fullUser.subsidiaryId,
                },
            });
            await tx.lead.delete({ where: { id: lead.id } });
            return {
                message: 'Lead converted successfully.',
                contact,
                account,
                opportunity,
            };
        });
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounts_service_1.AccountsService,
        contacts_service_1.ContactsService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map