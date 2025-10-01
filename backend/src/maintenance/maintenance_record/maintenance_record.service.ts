import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateMaintenanceRecordDto, UpdateMaintenanceRecordDto, SearchMaintenanceRecordDto } from './dto/create-maintenance_record.dto';

@Injectable()
export class MaintenanceRecordService {
  constructor(private prisma: PrismaService) {}

  includeAll = {
    equipment: true
  }

  /**
   * 
   * @param createMaintenanceRecordDto // DTO contenant les données de la maintenance à créer
   * @returns // Maintenance créée
   */
  async create(createMaintenanceRecordDto: CreateMaintenanceRecordDto) {
    const maintenanceRecord = await this.prisma.maintenanceRecord.create({
      data: {
        ...createMaintenanceRecordDto,
        maintenanceDate: new Date(createMaintenanceRecordDto.maintenanceDate),
      }, 
      include: this.includeAll});
    return maintenanceRecord;
  }

  /**
   * 
   * @param equipmentId // ID de l'équipement
   * @returns // Liste des maintenances de l'équipement
   */
  async findAll(equipmentId: string) {
    const maintenanceRecords = await this.prisma.maintenanceRecord.findMany({where: {equipmentId}, include: this.includeAll});
    return maintenanceRecords;
  }

  /**
   * 
   * @param id // ID de la maintenance
   * @returns // Maintenance trouvée
   */
  async findOne(id: string) {
    const record = await this.prisma.maintenanceRecord.findUnique({where: {id}, include: this.includeAll});
    if (!record) throw new NotFoundException(`Maintenance record with ID "${id}" not found`);
    return record;
  }

  /**
   * 
   * @param id // ID de la maintenance
   * @param dto // DTO contenant les données de la maintenance à mettre à jour
   * @returns // Maintenance mise à jour
   */
  async update(id: string, dto: UpdateMaintenanceRecordDto) {
    await this.findOne(id); 
    const maintenanceRecord = await this.prisma.maintenanceRecord.update({
      where: {id}, 
      data: {
        ...dto,
        maintenanceDate: new Date(dto.maintenanceDate),
      }, 
      include: this.includeAll});
    return maintenanceRecord;
  }

  /**
   * 
   * @param id // ID de la maintenance
   * @returns // Maintenance supprimée
   */
  async remove(id: string) {
    await this.findOne(id); 
    const maintenanceRecord = await this.prisma.maintenanceRecord.delete({ where: { id } });
    return maintenanceRecord;
  }

  /**
   * 
   * @param dto // DTO contenant les filtres de recherche
   * @returns // Liste des maintenances correspondant aux filtres
   */
  async search(dto: SearchMaintenanceRecordDto) {
    const maintenanceRecords = await this.prisma.maintenanceRecord.findMany({
      where: {
        equipmentId: dto.equipmentId,
        technician: dto.technician ? { contains: dto.technician, mode: 'insensitive' } : undefined,
        maintenanceDate: dto.fromDate || dto.toDate ? {
          gte: dto.fromDate ? new Date(dto.fromDate) : undefined,
          lte: dto.toDate ? new Date(dto.toDate) : undefined,
        } : undefined,
      },
      include: this.includeAll,
    });
    return maintenanceRecords;
  }
}
