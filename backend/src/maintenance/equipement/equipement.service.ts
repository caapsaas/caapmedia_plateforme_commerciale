import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  SearchEquipmentDto,
} from './dto/create-equipement.dto';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

@Injectable()
export class EquipementService {
  constructor(private readonly prisma: PrismaService) {}

  includeAll = {
    maintenanceRecords: true,
    subsidiary: true,
  };

  async create(createEquipementDto: CreateEquipmentDto, user: any) {
    const isSuperAdmin =
      user.role === 'SUPER_ADMIN' || user.userRole === 'SUPER_ADMIN';
    const subsidiaryId =
      isSuperAdmin && createEquipementDto.subsidiaryId
        ? createEquipementDto.subsidiaryId
        : user.subsidiaryId;

    const { subsidiaryId: _ignored, ...rest } = createEquipementDto;
    const equipment = await this.prisma.equipment.create({
      data: {
        ...rest,
        lastMaintenanceDate: new Date(rest.lastMaintenanceDate),
        nextMaintenanceDate: new Date(rest.nextMaintenanceDate),
        acquisitionDate: new Date(rest.acquisitionDate),
        subsidiaryId,
      },
      include: this.includeAll,
    });
    return equipment;
  }

  async findAll(user: any, querySubsidiaryId?: string) {
    const isSuperAdmin =
      user.role === 'SUPER_ADMIN' || user.userRole === 'SUPER_ADMIN';
    const where = isSuperAdmin
      ? querySubsidiaryId
        ? { subsidiaryId: querySubsidiaryId }
        : {}
      : { subsidiaryId: user.subsidiaryId };

    const equipments = await this.prisma.equipment.findMany({
      where,
      include: this.includeAll,
      orderBy: [
        { subsidiary: { subsidiaryName: 'asc' } },
        { equipmentName: 'asc' },
      ],
      // Filet de sécurité : la liste équipements alimente une sidebar
      // maître-détail (pas de pagination cliquable pertinente pour un
      // référentiel de parc matériel physique, par nature borné).
      take: 1000,
    });
    return equipments;
  }

  /**
   *
   * @param id // ID de l'équipement
   * @returns // Équipement trouvé
   */
  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: this.includeAll,
    });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID "${id}" not found`);
    }
    return equipment;
  }

  /**
   *
   * @param id // ID de l'équipement
   * @param updateEquipementDto // DTO contenant les données de l'équipement à mettre à jour
   * @returns // Équipement mis à jour
   */
  async update(id: string, updateEquipementDto: UpdateEquipmentDto, user: any) {
    await this.findOne(id);
    const { subsidiaryId: _ignored, ...rest } = updateEquipementDto;
    const data: any = { ...rest };
    if (rest.lastMaintenanceDate)
      data.lastMaintenanceDate = new Date(rest.lastMaintenanceDate);
    if (rest.nextMaintenanceDate)
      data.nextMaintenanceDate = new Date(rest.nextMaintenanceDate);
    if (rest.acquisitionDate)
      data.acquisitionDate = new Date(rest.acquisitionDate);

    const equipment = await this.prisma.equipment.update({
      where: { id },
      data,
      include: this.includeAll,
    });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID "${id}" not found`);
    }
    return equipment;
  }

  /**
   *
   * @param id // ID de l'équipement
   * @returns // Équipement supprimé
   */
  async remove(id: string) {
    await this.findOne(id);
    const equipment = await this.prisma.equipment.delete({
      where: { id },
      include: this.includeAll,
    });
    return equipment;
  }

  /**
   *
   * @param query // DTO contenant les filtres de recherche
   * @returns // Liste des équipements correspondant aux filtres
   */
  async search(query: SearchEquipmentDto, user: any) {
    // On construit l'objet "where" pour Prisma en fonction des filtres fournis
    const where: any = {
      subsidiaryId: user.subsidiaryId, // on limite à la filiale de l’utilisateur
    };

    // Filtrage par nom de l'équipement (partiel, insensible à la casse)
    if (query.equipmentName) {
      where.equipmentName = {
        contains: query.equipmentName,
        mode: 'insensitive',
      };
    }

    // Filtrage par statut si fourni
    if (query.status) {
      where.status = query.status;
    }

    // Filtrage par plage de date d'acquisition
    if (query.acquisitionFromDate || query.acquisitionToDate) {
      where.acquisitionDate = {
        gte: query.acquisitionFromDate
          ? new Date(query.acquisitionFromDate)
          : undefined,
        lte: query.acquisitionToDate
          ? new Date(query.acquisitionToDate)
          : undefined,
      };
    }

    // Filtrage par plage de dernière maintenance
    if (query.lastMaintenanceFromDate || query.lastMaintenanceToDate) {
      where.lastMaintenanceDate = {
        gte: query.lastMaintenanceFromDate
          ? new Date(query.lastMaintenanceFromDate)
          : undefined,
        lte: query.lastMaintenanceToDate
          ? new Date(query.lastMaintenanceToDate)
          : undefined,
      };
    }

    // Filtrage par plage de prochaine maintenance
    if (query.nextMaintenanceFromDate || query.nextMaintenanceToDate) {
      where.nextMaintenanceDate = {
        gte: query.nextMaintenanceFromDate
          ? new Date(query.nextMaintenanceFromDate)
          : undefined,
        lte: query.nextMaintenanceToDate
          ? new Date(query.nextMaintenanceToDate)
          : undefined,
      };
    }

    // Appel à Prisma pour récupérer les équipements correspondant aux critères
    return this.prisma.equipment.findMany({
      where,
      include: {
        subsidiary: true,
        maintenanceRecords: true,
      },
    });
  }
}
