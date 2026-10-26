import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  SearchEquipmentDto,
} from './dto/create-equipement.dto';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from '../../common/utils/subsidiary-scope';
import { Prisma } from '@prisma/client';

@Injectable()
export class EquipementService {
  constructor(private readonly prisma: PrismaService) {}

  includeAll = {
    maintenanceRecords: true,
    subsidiary: true,
  };

  async create(createEquipementDto: CreateEquipmentDto, user: JwtUser) {
    const ctx = resolveScopeContext(user);
    const subsidiaryId =
      ctx.hasGlobalScope && createEquipementDto.subsidiaryId
        ? createEquipementDto.subsidiaryId
        : ctx.subsidiaryId;

    const rest = createEquipementDto;
    const equipment = await this.prisma.equipment.create({
      data: {
        equipmentName: rest.equipmentName,
        status: rest.status,
        acquisitionValue: rest.acquisitionValue,
        lastMaintenanceDate: new Date(rest.lastMaintenanceDate),
        nextMaintenanceDate: new Date(rest.nextMaintenanceDate),
        acquisitionDate: new Date(rest.acquisitionDate),
        subsidiaryId,
      },
      include: this.includeAll,
    });
    return equipment;
  }

  async findAll(user: JwtUser, querySubsidiaryId?: string) {
    const where = withSubsidiaryScope(
      {},
      resolveScopeContext(user),
      querySubsidiaryId,
    );

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
  async findOne(id: string, user: JwtUser) {
    const equipment = await this.prisma.equipment.findUnique({
      where: withSubsidiaryScope({ id }, resolveScopeContext(user)),
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
  async update(
    id: string,
    updateEquipementDto: UpdateEquipmentDto,
    user: JwtUser,
  ) {
    await this.findOne(id, user);
    const rest = updateEquipementDto;
    const data: Prisma.EquipmentUpdateInput = {
      equipmentName: rest.equipmentName,
      status: rest.status,
      acquisitionValue: rest.acquisitionValue,
    };
    if (rest.lastMaintenanceDate)
      data.lastMaintenanceDate = new Date(rest.lastMaintenanceDate);
    if (rest.nextMaintenanceDate)
      data.nextMaintenanceDate = new Date(rest.nextMaintenanceDate);
    if (rest.acquisitionDate)
      data.acquisitionDate = new Date(rest.acquisitionDate);

    const equipment = await this.prisma.equipment.update({
      where: withSubsidiaryScope({ id }, resolveScopeContext(user)),
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
  async remove(id: string, user: JwtUser) {
    await this.findOne(id, user);
    const equipment = await this.prisma.equipment.delete({
      where: withSubsidiaryScope({ id }, resolveScopeContext(user)),
      include: this.includeAll,
    });
    return equipment;
  }

  /**
   *
   * @param query // DTO contenant les filtres de recherche
   * @returns // Liste des équipements correspondant aux filtres
   */
  async search(query: SearchEquipmentDto, user: JwtUser) {
    // On construit l'objet "where" pour Prisma en fonction des filtres fournis
    const where: Prisma.EquipmentWhereInput = withSubsidiaryScope(
      {},
      resolveScopeContext(user),
    );

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
    // Même filet de sécurité que findAll : référentiel de parc matériel
    // physique, borné par nature, pas de pagination cliquable pertinente.
    return this.prisma.equipment.findMany({
      where,
      include: {
        subsidiary: true,
        maintenanceRecords: true,
      },
      orderBy: [
        { subsidiary: { subsidiaryName: 'asc' } },
        { equipmentName: 'asc' },
      ],
      take: 1000,
    });
  }
}
