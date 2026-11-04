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
exports.ProductionWorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../../common/constants/id-prefixes.const");
let ProductionWorkflowsService = class ProductionWorkflowsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        if (dto.itemId) {
            const existing = await this.prisma.productionWorkflow.findUnique({
                where: { itemId: dto.itemId },
            });
            if (existing) {
                throw new common_1.ConflictException('Ce service a déjà un workflow de production associé.');
            }
        }
        return this.prisma.productionWorkflow.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTIONWORKFLOW),
                name: dto.name,
                description: dto.description,
                itemId: dto.itemId ?? null,
                isActive: dto.isActive ?? true,
                steps: {
                    create: dto.steps.map((s) => ({
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTIONWORKFLOWSTEP),
                        equipmentId: s.equipmentId,
                        stepOrder: s.stepOrder,
                    })),
                },
            },
            include: this.fullInclude(),
        });
    }
    async findAll(subsidiaryId) {
        const workflows = await this.prisma.productionWorkflow.findMany({
            include: this.fullInclude(),
            orderBy: { name: 'asc' },
        });
        if (!subsidiaryId)
            return workflows;
        return workflows.filter((wf) => wf.steps.some((s) => s.equipment.subsidiaryId === subsidiaryId));
    }
    async findOne(id) {
        const wf = await this.prisma.productionWorkflow.findUnique({
            where: { id },
            include: this.fullInclude(),
        });
        if (!wf)
            throw new common_1.NotFoundException(`Workflow ${id} introuvable.`);
        return wf;
    }
    async resolve(itemId) {
        const wf = await this.prisma.productionWorkflow.findUnique({
            where: { itemId },
            include: this.fullInclude(),
        });
        if (!wf || !wf.isActive)
            return null;
        return {
            workflowId: wf.id,
            workflowName: wf.name,
            steps: wf.steps.map((s) => ({
                equipmentId: s.equipment.id,
                equipmentName: s.equipment.equipmentName,
                subsidiaryId: s.equipment.subsidiaryId,
                subsidiaryName: s.equipment.subsidiary.subsidiaryName,
                stepOrder: s.stepOrder,
                hourlyRate: s.equipment.costConfig?.hourlyRate ?? null,
                isConfigured: s.equipment.costConfig !== null,
            })),
        };
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.itemId !== undefined && dto.itemId !== null) {
            const conflict = await this.prisma.productionWorkflow.findFirst({
                where: { itemId: dto.itemId, NOT: { id } },
            });
            if (conflict) {
                throw new common_1.ConflictException('Ce service a déjà un autre workflow de production associé.');
            }
        }
        return this.prisma.$transaction(async (tx) => {
            if (dto.steps !== undefined) {
                await tx.productionWorkflowStep.deleteMany({
                    where: { workflowId: id },
                });
                await tx.productionWorkflowStep.createMany({
                    data: dto.steps.map((s) => ({
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTIONWORKFLOWSTEP),
                        workflowId: id,
                        equipmentId: s.equipmentId,
                        stepOrder: s.stepOrder,
                    })),
                });
            }
            return tx.productionWorkflow.update({
                where: { id },
                data: {
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(dto.description !== undefined && {
                        description: dto.description,
                    }),
                    ...(dto.itemId !== undefined && { itemId: dto.itemId }),
                    ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                },
                include: this.fullInclude(),
            });
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.productionWorkflow.delete({ where: { id } });
    }
    fullInclude() {
        return {
            item: { select: { id: true, name: true, category: true } },
            steps: {
                include: {
                    equipment: {
                        include: {
                            costConfig: { select: { hourlyRate: true } },
                            subsidiary: { select: { id: true, subsidiaryName: true } },
                        },
                    },
                },
                orderBy: { stepOrder: 'asc' },
            },
        };
    }
};
exports.ProductionWorkflowsService = ProductionWorkflowsService;
exports.ProductionWorkflowsService = ProductionWorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductionWorkflowsService);
//# sourceMappingURL=production-workflows.service.js.map