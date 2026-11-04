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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let AccountsService = class AccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createAccountDto, user) {
        const subsidiaryId = user.subsidiaryId || createAccountDto.subsidiaryId;
        if (!subsidiaryId) {
            throw new common_1.BadRequestException('Subsidiary ID must be provided either by being logged in or in the request body.');
        }
        const subsidiaryExists = await this.prisma.subsidiary.findUnique({
            where: { id: subsidiaryId },
        });
        if (!subsidiaryExists) {
            throw new common_1.NotFoundException(`Subsidiary with ID "${subsidiaryId}" not found.`);
        }
        const existingAccount = await this.prisma.account.findUnique({
            where: {
                accountName_subsidiaryId: {
                    accountName: createAccountDto.accountName,
                    subsidiaryId: subsidiaryId,
                },
            },
        });
        if (existingAccount) {
            throw new common_1.ConflictException(`An account with the name "${createAccountDto.accountName}" already exists in this subsidiary.`);
        }
        return this.prisma.account.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ACCOUNT),
                ...createAccountDto,
                subsidiaryId: subsidiaryId,
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
        else if (user.userRole === client_1.UserRole.COMMERCIAL) {
            where.salesRepId = user.id;
        }
        if (paginationQuery.search) {
            where.AND = [
                {
                    OR: [
                        {
                            accountName: {
                                contains: paginationQuery.search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            industry: {
                                contains: paginationQuery.search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            phone: { contains: paginationQuery.search, mode: 'insensitive' },
                        },
                    ],
                },
            ];
        }
        return (0, pagination_1.paginate)(this.prisma.account, {
            where,
            include: {
                salesRep: { select: { userName: true } },
                _count: { select: { contacts: true, opportunities: true } },
            },
            orderBy: { accountName: 'asc' },
        }, paginationQuery);
    }
    async findOne(id, user) {
        const account = await this.prisma.account.findUnique({
            where: { id },
            include: {
                salesRep: { select: { userName: true, email: true } },
                contacts: { orderBy: { contactName: 'asc' } },
                opportunities: { orderBy: { closeDate: 'desc' } },
            },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Account with ID "${id}" not found.`);
        }
        if (account.subsidiaryId !== user.subsidiaryId ||
            (user.userRole === client_1.UserRole.COMMERCIAL &&
                account.salesRepId !== user.id)) {
            throw new common_1.ForbiddenException('You are not allowed to view this account.');
        }
        return account;
    }
    async update(id, updateAccountDto, user) {
        const accountToUpdate = await this.findOne(id, user);
        const { salesRepId, id: dtoId, _count, ...otherData } = updateAccountDto;
        if (otherData.accountName) {
            const existingAccount = await this.prisma.account.findUnique({
                where: {
                    accountName_subsidiaryId: {
                        accountName: otherData.accountName,
                        subsidiaryId: accountToUpdate.subsidiaryId,
                    },
                },
            });
            if (existingAccount && existingAccount.id !== id) {
                throw new common_1.ConflictException(`An account with the name "${otherData.accountName}" already exists in this subsidiary.`);
            }
        }
        const data = { ...otherData };
        if (salesRepId !== undefined) {
            data.salesRep = salesRepId
                ? { connect: { id: salesRepId } }
                : { disconnect: true };
        }
        return this.prisma.account.update({
            where: { id },
            data,
        });
    }
    async remove(id, user) {
        await this.findOne(id, user);
        return this.prisma.account.delete({ where: { id } });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map