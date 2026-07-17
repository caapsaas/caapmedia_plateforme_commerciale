import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDate,
} from 'class-validator';
import { EquipmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// DTO de création
export class CreateEquipmentDto {
  @IsString()
  equipmentName: string;

  @IsDate()
  lastMaintenanceDate: Date;

  @IsDate()
  nextMaintenanceDate: Date;

  @IsDate()
  acquisitionDate: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  acquisitionValue: number;

  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;
}

// DTO de mise à jour (hérite de Create et rend tout optionnel)
export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {
  @IsDate()
  lastMaintenanceDate: Date;

  @IsDate()
  nextMaintenanceDate: Date;

  @IsDate()
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
  @IsDate()
  acquisitionFromDate?: Date;

  @IsOptional()
  @IsDate()
  acquisitionToDate?: Date;

  // Plage de dates pour dernière maintenance
  @IsOptional()
  @IsDate()
  lastMaintenanceFromDate?: Date;

  @IsOptional()
  @IsDate()
  lastMaintenanceToDate?: Date;

  // Plage de dates pour prochaine maintenance
  @IsOptional()
  @IsString()
  nextMaintenanceFromDate?: string;

  @IsOptional()
  @IsString()
  nextMaintenanceToDate?: string;
}
