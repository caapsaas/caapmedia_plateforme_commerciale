import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { SecretariatTaskStatus } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

export class CreateSecretariatTaskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  dueDate: string;

  @IsEnum(SecretariatTaskStatus)
  status: SecretariatTaskStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  subsidiaryId?: string;
}

export class UpdateSecretariatTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(SecretariatTaskStatus)
  status?: SecretariatTaskStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class SearchSecretariatTasksDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(SecretariatTaskStatus)
  status?: SecretariatTaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
