import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';

@Injectable()
export class ProductionWorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowDto) {
    if (dto.itemId) {
      const existing = await this.prisma.productionWorkflow.findUnique({
        where: { itemId: dto.itemId },
      });
      if (existing) {
        throw new ConflictException(
          'Ce service a déjà un workflow de production associé.',
        );
      }
    }

    return this.prisma.productionWorkflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        itemId: dto.itemId ?? null,
        isActive: dto.isActive ?? true,
        steps: {
          create: dto.steps.map((s) => ({
            equipmentId: s.equipmentId,
            stepOrder: s.stepOrder,
          })),
        },
      },
      include: this.fullInclude(),
    });
  }

  async findAll(subsidiaryId?: string) {
    const workflows = await this.prisma.productionWorkflow.findMany({
      include: this.fullInclude(),
      orderBy: { name: 'asc' },
    });

    if (!subsidiaryId) return workflows;

    // Filtre : retourne les workflows qui contiennent au moins une machine
    // appartenant à la filiale sélectionnée.
    return workflows.filter((wf) =>
      wf.steps.some((s) => s.equipment.subsidiaryId === subsidiaryId),
    );
  }

  async findOne(id: string) {
    const wf = await this.prisma.productionWorkflow.findUnique({
      where: { id },
      include: this.fullInclude(),
    });
    if (!wf) throw new NotFoundException(`Workflow ${id} introuvable.`);
    return wf;
  }

  // Endpoint clé : résout le workflow associé à un service et enrichit chaque
  // étape avec le coût horaire actuel depuis EquipementCostConfig.
  async resolve(itemId: string) {
    const wf = await this.prisma.productionWorkflow.findUnique({
      where: { itemId },
      include: this.fullInclude(),
    });

    if (!wf || !wf.isActive) return null;

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

  async update(id: string, dto: UpdateWorkflowDto) {
    await this.findOne(id);

    if (dto.itemId !== undefined && dto.itemId !== null) {
      const conflict = await this.prisma.productionWorkflow.findFirst({
        where: { itemId: dto.itemId, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(
          'Ce service a déjà un autre workflow de production associé.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.steps !== undefined) {
        await tx.productionWorkflowStep.deleteMany({
          where: { workflowId: id },
        });
        await tx.productionWorkflowStep.createMany({
          data: dto.steps.map((s) => ({
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

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.productionWorkflow.delete({ where: { id } });
  }

  private fullInclude() {
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
        orderBy: { stepOrder: 'asc' as const },
      },
    };
  }
}
