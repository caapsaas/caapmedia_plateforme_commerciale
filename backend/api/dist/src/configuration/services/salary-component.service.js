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
var SalaryComponentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryComponentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
let SalaryComponentService = SalaryComponentService_1 = class SalaryComponentService {
    prisma;
    logger = new common_1.Logger(SalaryComponentService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(subsidiaryId, dto, user) {
        const config = await this.prisma.payrollConfiguration.findUnique({
            where: { subsidiaryId },
        });
        if (!config) {
            throw new common_1.NotFoundException('Payroll configuration not found');
        }
        const component = await this.prisma.salaryComponent.create({
            data: {
                id: `comp_${Date.now()}_${Math.random()}`,
                payrollConfigId: config.id,
                name: dto.name,
                description: dto.description,
                type: dto.type,
                rate: dto.rate,
                fixedAmount: dto.fixedAmount,
                contributionType: dto.contributionType,
                displayOrder: dto.displayOrder || 0,
            },
        });
        this.logger.warn(`[AUDIT] Salary component created: ${component.name} (${component.type}) for subsidiary ${subsidiaryId}. Created by: ${user?.email || 'unknown'}`);
        return component;
    }
    async getByConfigId(configId) {
        return this.prisma.salaryComponent.findMany({
            where: { payrollConfigId: configId },
            orderBy: { displayOrder: 'asc' },
        });
    }
    async getActiveByConfigId(configId) {
        return this.prisma.salaryComponent.findMany({
            where: { payrollConfigId: configId, isActive: true },
            orderBy: { displayOrder: 'asc' },
        });
    }
    async update(componentId, dto, user) {
        const component = await this.prisma.salaryComponent.findUnique({
            where: { id: componentId },
        });
        if (!component) {
            throw new common_1.NotFoundException('Salary component not found');
        }
        const updated = await this.prisma.salaryComponent.update({
            where: { id: componentId },
            data: dto,
        });
        this.logger.warn(`[AUDIT] Salary component updated: ${component.name}. Updated by: ${user?.email || 'unknown'}`);
        return updated;
    }
    async delete(componentId, user) {
        const component = await this.prisma.salaryComponent.findUnique({
            where: { id: componentId },
        });
        if (!component) {
            throw new common_1.NotFoundException('Salary component not found');
        }
        await this.prisma.salaryComponent.delete({
            where: { id: componentId },
        });
        this.logger.warn(`[AUDIT] Salary component deleted: ${component.name}. Deleted by: ${user?.email || 'unknown'}`);
        return component;
    }
    async deactivate(componentId, user) {
        return this.update(componentId, { isActive: false }, user);
    }
    async reorder(components, user) {
        const updates = components.map((comp) => this.prisma.salaryComponent.update({
            where: { id: comp.id },
            data: { displayOrder: comp.displayOrder },
        }));
        const result = await Promise.all(updates);
        this.logger.warn(`[AUDIT] Salary components reordered (${components.length} items). Reordered by: ${user?.email || 'unknown'}`);
        return result;
    }
};
exports.SalaryComponentService = SalaryComponentService;
exports.SalaryComponentService = SalaryComponentService = SalaryComponentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalaryComponentService);
//# sourceMappingURL=salary-component.service.js.map