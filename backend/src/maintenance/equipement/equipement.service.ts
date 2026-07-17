import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  SearchEquipmentDto,
} from './dto/create-equipement.dto';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Injectable()
export class EquipementService {
  constructor(private readonly prisma: PrismaService) {}

  includeAll = {
    maintenanceRecords: true,
    subsidiary: true,
  };

  /**
   *
   * @param createEquipementDto // DTO contenant les données de l'équipement à créer
   * @returns // Équipement créé
   */
  async create(createEquipementDto: CreateEquipmentDto, user: any) {
    const equipment = await this.prisma.equipment.create({
      data: {
        ...createEquipementDto,
        lastMaintenanceDate: new Date(createEquipementDto.lastMaintenanceDate),
        nextMaintenanceDate: new Date(createEquipementDto.nextMaintenanceDate),
        acquisitionDate: new Date(createEquipementDto.acquisitionDate),
        subsidiaryId: user.subsidiaryId,
      },
      include: this.includeAll,
    });
    return equipment;
  }

  /**
   *
   * @param subsidiaryId // ID de la filiale
   * @returns // Liste des équipements de la filiale
   */
  async findAll(user: any) {
    const equipments = await this.prisma.equipment.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      include: this.includeAll,
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
    const equipment = await this.prisma.equipment.update({
      where: { id },
      data: {
        ...updateEquipementDto,
        subsidiaryId: user.subsidiaryId,
        lastMaintenanceDate: new Date(updateEquipementDto.lastMaintenanceDate),
        nextMaintenanceDate: new Date(updateEquipementDto.nextMaintenanceDate),
        acquisitionDate: new Date(updateEquipementDto.acquisitionDate),
      },
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
