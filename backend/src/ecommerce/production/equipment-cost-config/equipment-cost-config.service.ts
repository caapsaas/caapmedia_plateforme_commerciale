import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { UpsertEquipmentCostDto } from './dto/upsert-equipment-cost.dto';
import { Prisma, UserRole } from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

@Injectable()
export class EquipmentCostConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: UpsertEquipmentCostDto, user: JwtUser) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
    });
    if (!equipment) {
      throw new NotFoundException(`Équipement ${dto.equipmentId} introuvable.`);
    }

    return this.prisma.equipementCostConfig.upsert({
      where: { equipmentId: dto.equipmentId },
      create: {
        equipmentId: dto.equipmentId,
        hourlyRate: new Prisma.Decimal(dto.hourlyRate),
        updatedById: user.id,
      },
      update: {
        hourlyRate: new Prisma.Decimal(dto.hourlyRate),
        updatedById: user.id,
      },
      include: { equipment: true },
    });
  }

  async findAll(subsidiaryId?: string, user?: JwtUser) {
    const isSuperAdmin =
      user?.role === UserRole.SUPER_ADMIN ||
      user?.roles?.includes(UserRole.SUPER_ADMIN);

    const subsidiaryFilter = isSuperAdmin
      ? subsidiaryId
        ? { subsidiaryId }
        : {}
      : { subsidiaryId: user?.subsidiaryId };

    const equipments = await this.prisma.equipment.findMany({
      where: subsidiaryFilter,
      include: {
        costConfig: true,
        subsidiary: { select: { id: true, subsidiaryName: true } },
      },
      orderBy: [
        { subsidiary: { subsidiaryName: 'asc' } },
        { equipmentName: 'asc' },
      ],
    });

    return equipments.map((eq) => ({
      id: eq.id,
      equipmentName: eq.equipmentName,
      status: eq.status,
      subsidiaryId: eq.subsidiaryId,
      subsidiaryName: eq.subsidiary.subsidiaryName,
      hourlyRate: eq.costConfig?.hourlyRate ?? null,
      costConfigId: eq.costConfig?.id ?? null,
      isConfigured: eq.costConfig !== null,
    }));
  }

  async findOne(equipmentId: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        costConfig: true,
        subsidiary: { select: { id: true, subsidiaryName: true } },
      },
    });
    if (!equipment)
      throw new NotFoundException(`Équipement ${equipmentId} introuvable.`);

    return {
      id: equipment.id,
      equipmentName: equipment.equipmentName,
      status: equipment.status,
      subsidiaryId: equipment.subsidiaryId,
      subsidiaryName: equipment.subsidiary.subsidiaryName,
      hourlyRate: equipment.costConfig?.hourlyRate ?? null,
      isConfigured: equipment.costConfig !== null,
    };
  }

  // Retourne uniquement les équipements avec un coût configuré (usage workflows).
  async findConfigured(subsidiaryId?: string) {
    const equipments = await this.prisma.equipment.findMany({
      where: {
        ...(subsidiaryId ? { subsidiaryId } : {}),
        costConfig: { isNot: null },
        status: 'OPERATIONAL',
      },
      include: {
        costConfig: true,
        subsidiary: { select: { id: true, subsidiaryName: true } },
      },
      orderBy: { equipmentName: 'asc' },
    });

    return equipments.map((eq) => ({
      id: eq.id,
      equipmentName: eq.equipmentName,
      status: eq.status,
      subsidiaryId: eq.subsidiaryId,
      subsidiaryName: eq.subsidiary.subsidiaryName,
      hourlyRate: eq.costConfig.hourlyRate,
    }));
  }
}
