import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { EquipmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// DTO de création — les dates arrivent en string ISO depuis le frontend
export class CreateEquipmentDto {
  @IsString()
  equipmentName: string;

  @IsDateString()
  lastMaintenanceDate: string;

  @IsDateString()
  nextMaintenanceDate: string;

  @IsDateString()
  acquisitionDate: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  acquisitionValue: number;

  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;

  @IsOptional()
  @IsString()
  subsidiaryId?: string;
}

// DTO de mise à jour — tout optionnel sauf ce qui est toujours requis
export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}

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
  @IsString()
  nextMaintenanceFromDate?: string;

  @IsOptional()
  @IsString()
  nextMaintenanceToDate?: string;
}
