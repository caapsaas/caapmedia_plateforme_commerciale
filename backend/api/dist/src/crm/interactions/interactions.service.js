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
exports.InteractionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
let InteractionsService = class InteractionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createInteractionDto, user) {
        const contact = await this.prisma.contact.findUnique({
            where: { id: createInteractionDto.contactId },
        });
        if (!contact || contact.subsidiaryId !== user.subsidiaryId) {
            throw new common_1.ForbiddenException('Contact not found or does not belong to your subsidiary.');
        }
        return this.prisma.interaction.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.INTERACTION),
                notes: createInteractionDto.notes,
                contactId: createInteractionDto.contactId,
                userId: user.id,
                typeInteractions: createInteractionDto.type,
                interactionDate: new Date(),
            },
        });
    }
    async findAll(user, paginationQuery = {}) {
        const isSuperAdmin = user.userRole === client_1.UserRole.SUPER_ADMIN;
        const contactWhere = isSuperAdmin
            ? {}
            : { subsidiaryId: user.subsidiaryId };
        if (!isSuperAdmin && user.userRole === client_1.UserRole.COMMERCIAL) {
            contactWhere.salesRepId = { equals: user.id };
        }
        const where = {
            contact: contactWhere,
            ...(paginationQuery.search
                ? {
                    notes: {
                        contains: paginationQuery.search,
                        mode: 'insensitive',
                    },
                }
                : {}),
        };
        return (0, pagination_1.paginate)(this.prisma.interaction, {
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                contact: { select: { contactName: true } },
            },
            orderBy: {
                interactionDate: 'desc',
            },
        }, paginationQuery);
    }
    async findOne(id, user) {
        const interaction = await this.prisma.interaction.findUnique({
            where: { id },
            include: {
                contact: true,
            },
        });
        if (!interaction) {
            throw new common_1.NotFoundException(`Interaction with ID "${id}" not found.`);
        }
        if (interaction.contact.subsidiaryId !== user.subsidiaryId) {
            throw new common_1.NotFoundException(`Interaction with ID "${id}" not found.`);
        }
        if (user.userRole === client_1.UserRole.COMMERCIAL &&
            interaction.contact.salesRepId !== user.id) {
            throw new common_1.ForbiddenException('You are not allowed to view this interaction.');
        }
        return interaction;
    }
    async remove(id, user) {
        const interaction = await this.findOne(id, user);
        if (user.userRole !== client_1.UserRole.ADMIN && interaction.userId !== user.id) {
            throw new common_1.ForbiddenException('You are not allowed to delete this interaction.');
        }
        return this.prisma.interaction.delete({ where: { id } });
    }
    async update(id, updateInteractionDto, user) {
        await this.findOne(id, user);
        return this.prisma.interaction.update({
            where: { id },
            data: updateInteractionDto,
        });
        const dataToUpdate = {};
        if (updateInteractionDto.notes !== undefined) {
            dataToUpdate.notes = updateInteractionDto.notes;
        }
        if (updateInteractionDto.type !== undefined) {
            dataToUpdate.typeInteractions = updateInteractionDto.type;
        }
        return this.prisma.interaction.update({
            where: { id },
            data: dataToUpdate,
        });
    }
};
exports.InteractionsService = InteractionsService;
exports.InteractionsService = InteractionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InteractionsService);
//# sourceMappingURL=interactions.service.js.map