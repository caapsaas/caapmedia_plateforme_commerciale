import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreatePreHireTrainingDto, UpdatePreHireTrainingDto } from './dto/pre-hire-training.dto';
import { CreateEmployeeDto } from '../employee/dto/employee.dto';
import { EmployeeService } from '../employee/employee.service';

@Injectable()
export class PreHireTrainingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employees: EmployeeService,
  ) {}

  findAll(subsidiaryId?: string) {
    return this.prisma.preHireTraining.findMany({
      where: subsidiaryId ? { subsidiaryId } : undefined,
      include: { subsidiary: { select: { id: true, subsidiaryName: true } } },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.preHireTraining.findUnique({
      where: { id },
      include: { subsidiary: { select: { id: true, subsidiaryName: true } } },
    });
    if (!item) throw new NotFoundException('Dossier de formation introuvable.');
    return item;
  }

  create(data: CreatePreHireTrainingDto, subsidiaryId: string) {
    if (data.status === 'HIRED') {
      throw new BadRequestException('Utilisez la conversion pour créer le dossier employé.');
    }
    if ((data.acquiredClients || 0) > 0 || (data.acquiredProspects || 0) > 0) {
      if (data.status !== 'COMPLETED') {
        throw new BadRequestException('Les résultats commerciaux se renseignent après la formation.');
      }
    }
    const { subsidiaryId: _requestedSubsidiary, ...record } = data;
    return this.prisma.preHireTraining.create({ data: { ...record, subsidiaryId } });
  }

  async update(id: string, data: UpdatePreHireTrainingDto) {
    const { subsidiaryId: _requestedSubsidiary, ...record } = data;
    const current = await this.findOne(id);
    if (data.status === 'HIRED') {
      throw new BadRequestException('Utilisez la conversion pour créer le dossier employé.');
    }
    const effectiveStatus = data.status ?? current.status;
    if (
      ((data.acquiredClients ?? current.acquiredClients) > 0 ||
        (data.acquiredProspects ?? current.acquiredProspects) > 0) &&
      effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'HIRED'
    ) {
      throw new BadRequestException('Les résultats commerciaux se renseignent après la formation.');
    }
    return this.prisma.preHireTraining.update({ where: { id }, data: record });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.preHireTraining.delete({ where: { id } });
  }

  async convertToEmployee(id: string, data: CreateEmployeeDto) {
    const candidate = await this.findOne(id);
    if (candidate.employeeId) {
      throw new ConflictException('Ce candidat a déjà été converti en employé.');
    }
    if (candidate.status === 'CANCELLED' || candidate.status === 'NOT_RETAINED') {
      throw new ConflictException('Ce dossier de formation ne peut pas être converti.');
    }
    const employee = await this.employees.create(data, candidate.subsidiaryId);
    const updated = await this.prisma.preHireTraining.update({
      where: { id },
      data: { employeeId: employee.id, status: 'HIRED', progress: 100 },
      include: { subsidiary: { select: { id: true, subsidiaryName: true } } },
    });
    return { ...updated, employee };
  }
}
