import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// DTO de création
export class CreateMaintenanceRecordDto {
  @IsDateString()
  maintenanceDate: Date;

  @IsString()
  technician: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  maintenanceCost: number;

  @IsUUID()
  equipmentId: string;
}

// DTO de mise à jour (hérite de Create et rend tout optionnel)
export class UpdateMaintenanceRecordDto extends PartialType(
  CreateMaintenanceRecordDto,
) {
  @IsDateString()
  maintenanceDate: Date;
}

// DTO de recherche/filtre
export class SearchMaintenanceRecordDto {
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  technician?: string;
}
