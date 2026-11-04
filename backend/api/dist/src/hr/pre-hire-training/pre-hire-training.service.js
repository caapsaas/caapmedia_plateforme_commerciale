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
exports.PreHireTrainingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const employee_service_1 = require("../employee/employee.service");
let PreHireTrainingService = class PreHireTrainingService {
    prisma;
    employees;
    constructor(prisma, employees) {
        this.prisma = prisma;
        this.employees = employees;
    }
    findAll(subsidiaryId) {
        return this.prisma.preHireTraining.findMany({
            where: subsidiaryId ? { subsidiaryId } : undefined,
            include: { subsidiary: { select: { id: true, subsidiaryName: true } } },
            orderBy: [{ updatedAt: 'desc' }],
        });
    }
    async findOne(id) {
        const item = await this.prisma.preHireTraining.findUnique({
            where: { id },
            include: { subsidiary: { select: { id: true, subsidiaryName: true } } },
        });
        if (!item)
            throw new common_1.NotFoundException('Dossier de formation introuvable.');
        return item;
    }
    create(data, subsidiaryId) {
        if (data.status === 'HIRED') {
            throw new common_1.BadRequestException('Utilisez la conversion pour créer le dossier employé.');
        }
        if ((data.acquiredClients || 0) > 0 || (data.acquiredProspects || 0) > 0) {
            if (data.status !== 'COMPLETED') {
                throw new common_1.BadRequestException('Les résultats commerciaux se renseignent après la formation.');
            }
        }
        const { subsidiaryId: _requestedSubsidiary, ...record } = data;
        return this.prisma.preHireTraining.create({ data: { ...record, subsidiaryId } });
    }
    async update(id, data) {
        const { subsidiaryId: _requestedSubsidiary, ...record } = data;
        const current = await this.findOne(id);
        if (data.status === 'HIRED') {
            throw new common_1.BadRequestException('Utilisez la conversion pour créer le dossier employé.');
        }
        const effectiveStatus = data.status ?? current.status;
        if (((data.acquiredClients ?? current.acquiredClients) > 0 ||
            (data.acquiredProspects ?? current.acquiredProspects) > 0) &&
            effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'HIRED') {
            throw new common_1.BadRequestException('Les résultats commerciaux se renseignent après la formation.');
        }
        return this.prisma.preHireTraining.update({ where: { id }, data: record });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.preHireTraining.delete({ where: { id } });
    }
    async convertToEmployee(id, data) {
        const candidate = await this.findOne(id);
        if (candidate.employeeId) {
            throw new common_1.ConflictException('Ce candidat a déjà été converti en employé.');
        }
        if (candidate.status === 'CANCELLED' || candidate.status === 'NOT_RETAINED') {
            throw new common_1.ConflictException('Ce dossier de formation ne peut pas être converti.');
        }
        const employee = await this.employees.create(data, candidate.subsidiaryId);
        const updated = await this.prisma.preHireTraining.update({
            where: { id },
            data: { employeeId: employee.id, status: 'HIRED', progress: 100 },
            include: { subsidiary: { select: { id: true, subsidiaryName: true } } },
        });
        return { ...updated, employee };
    }
};
exports.PreHireTrainingService = PreHireTrainingService;
exports.PreHireTrainingService = PreHireTrainingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        employee_service_1.EmployeeService])
], PreHireTrainingService);
//# sourceMappingURL=pre-hire-training.service.js.map