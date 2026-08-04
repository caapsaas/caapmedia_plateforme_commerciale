import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

// DTO de création
export class CreateMaintenanceRecordDto {
  @IsDateString()
  maintenanceDate: string;

  @IsString()
  technician: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  maintenanceCost: number;

  @IsString()
  equipmentId: string;
}

// DTO de mise à jour (hérite de Create et rend tout optionnel)
export class UpdateMaintenanceRecordDto extends PartialType(
  CreateMaintenanceRecordDto,
) {}

// DTO de recherche/filtre
export class SearchMaintenanceRecordDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
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

// DTO pour GET /maintenance-records (liste paginée d'un équipement)
export class FindMaintenanceRecordsDto extends PaginationQueryDto {
  @IsUUID()
  equipmentId: string;
}
