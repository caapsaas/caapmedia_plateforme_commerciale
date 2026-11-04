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
exports.CrmtasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const pagination_1 = require("../../common/pagination/pagination");
let CrmtasksService = class CrmtasksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createTaskDto, creator) {
        const contact = await this.prisma.contact.findFirst({
            where: {
                id: createTaskDto.contactId,
                subsidiaryId: creator.subsidiaryId,
            },
        });
        if (!contact) {
            throw new common_1.NotFoundException(`Contact with ID "${createTaskDto.contactId}" not found in this subsidiary.`);
        }
        return this.prisma.crmTask.create({
            data: {
                ...createTaskDto,
                userId: creator.id,
                status: client_1.CrmTaskStatus.TODO,
                dueDate: new Date(createTaskDto.dueDate),
            },
        });
    }
    async findAll(user, paginationQuery = {}) {
        const isSuperAdmin = user.userRole === client_1.UserRole.SUPER_ADMIN;
        const where = isSuperAdmin
            ? {}
            : { user: { subsidiaryId: user.subsidiaryId } };
        if (!isSuperAdmin) {
            const privilegedRoles = [
                client_1.UserRole.ADMIN,
                client_1.UserRole.SECRETARY,
                client_1.UserRole.FINANCIAL_DIRECTOR,
            ];
            if (!privilegedRoles.includes(user.userRole)) {
                where.userId = user.id;
            }
        }
        if (paginationQuery.search) {
            where.title = { contains: paginationQuery.search, mode: 'insensitive' };
        }
        return (0, pagination_1.paginate)(this.prisma.crmTask, {
            where,
            include: {
                contact: { select: { contactName: true } },
                opportunity: { select: { opportunityName: true } },
            },
            orderBy: { dueDate: 'asc' },
        }, paginationQuery);
    }
    async findOne(id, user) {
        const task = await this.prisma.crmTask.findUnique({
            where: { id },
            include: { contact: true, opportunity: true },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID "${id}" not found.`);
        }
        const privilegedRoles = [
            client_1.UserRole.ADMIN,
            client_1.UserRole.SECRETARY,
            client_1.UserRole.FINANCIAL_DIRECTOR,
        ];
        if (!privilegedRoles.includes(user.userRole) && task.userId !== user.id) {
            throw new common_1.ForbiddenException('You are not allowed to view this task.');
        }
        return task;
    }
    async update(id, updateTaskDto, user) {
        await this.findOne(id, user);
        return this.prisma.crmTask.update({ where: { id }, data: updateTaskDto });
    }
    async remove(id, user) {
        await this.findOne(id, user);
        return this.prisma.crmTask.delete({ where: { id } });
    }
    async updateStatus(id, status, user) {
        await this.findOne(id, user);
        return this.prisma.crmTask.update({
            where: { id },
            data: { status },
        });
    }
};
exports.CrmtasksService = CrmtasksService;
exports.CrmtasksService = CrmtasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrmtasksService);
//# sourceMappingURL=crmtasks.service.js.map