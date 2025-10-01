import { IsString, IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// DTO de création
export class CreateEquipmentDto {
  @IsString()
  equipmentName: string;

  @IsDateString()
  lastMaintenanceDate: Date;

  @IsDateString()
  nextMaintenanceDate: Date;

  @IsDateString()
  acquisitionDate: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number) 
  acquisitionValue: number;

  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;
}

// DTO de mise à jour (hérite de Create et rend tout optionnel)
export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {
  @IsDateString()
  lastMaintenanceDate: Date;

  @IsDateString()
  nextMaintenanceDate: Date;

  @IsDateString()
  acquisitionDate: Date;
}

// DTO de recherche/filtre
export class SearchEquipmentDto {
  @IsOptional()
  @IsString()
  equipmentName?: string; // Recherche par nom (partiel, insensible à la casse)

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus; // Filtrage par statut de l’équipement

  // Plage de dates pour date d’acquisition
  @IsOptional()
  @IsDateString()
  acquisitionFromDate?: string;

  @IsOptional()
  @IsDateString()
  acquisitionToDate?: string;

  // Plage de dates pour dernière maintenance
  @IsOptional()
  @IsDateString()
  lastMaintenanceFromDate?: string;

  @IsOptional()
  @IsDateString()
  lastMaintenanceToDate?: string;

  // Plage de dates pour prochaine maintenance
  @IsOptional()
  @IsDateString()
  nextMaintenanceFromDate?: string;

  @IsOptional()
  @IsDateString()
  nextMaintenanceToDate?: string;
}

