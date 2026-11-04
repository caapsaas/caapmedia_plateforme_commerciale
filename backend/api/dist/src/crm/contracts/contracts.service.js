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
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let ContractsService = class ContractsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createContractDto, user) {
        const client = await this.prisma.contact.findUnique({
            where: { id: createContractDto.clientId },
        });
        if (!client || client.subsidiaryId !== user.subsidiaryId) {
            throw new common_1.ForbiddenException('Client not found or does not belong to your subsidiary.');
        }
        return this.prisma.contract.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.CONTRACT),
                ...createContractDto,
                startDate: new Date(createContractDto.startDate),
                endDate: new Date(createContractDto.endDate),
                subsidiaryId: user.subsidiaryId,
            },
        });
    }
    async findAll(user, paginationQuery, filterSubsidiaryId) {
        const isSuperAdmin = user.userRole === client_1.UserRole.SUPER_ADMIN;
        const scopeCtx = {
            subsidiaryId: user.subsidiaryId,
            hasGlobalScope: isSuperAdmin,
        };
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({}, scopeCtx, filterSubsidiaryId);
        if (!isSuperAdmin && user.userRole === client_1.UserRole.COMMERCIAL) {
            where.client = { salesRepId: user.id };
        }
        if (paginationQuery.search) {
            where.title = { contains: paginationQuery.search, mode: 'insensitive' };
        }
        return (0, pagination_1.paginate)(this.prisma.contract, {
            where,
            include: { client: true },
            orderBy: { startDate: 'desc' },
        }, paginationQuery);
    }
    async findOne(id, user) {
        const contract = await this.prisma.contract.findUnique({
            where: { id },
            include: { client: true },
        });
        if (!contract) {
            throw new common_1.NotFoundException(`Contract with ID "${id}" not found.`);
        }
        if (contract.subsidiaryId !== user.subsidiaryId) {
            throw new common_1.ForbiddenException('You are not allowed to view this contract.');
        }
        return contract;
    }
    async update(id, updateContractDto, user) {
        await this.findOne(id, user);
        const { clientId, startDate, endDate, id: dtoId, client, subsidiaryId, ...otherData } = updateContractDto;
        const data = { ...otherData };
        if (clientId)
            data.client = { connect: { id: clientId } };
        if (startDate)
            data.startDate = new Date(startDate);
        if (endDate)
            data.endDate = new Date(endDate);
        return this.prisma.contract.update({ where: { id }, data });
    }
    async remove(id, user) {
        await this.findOne(id, user);
        return this.prisma.contract.delete({ where: { id } });
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map