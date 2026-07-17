import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { SecretariatTaskStatus } from '@prisma/client';

export class CreateSecretariatTaskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  dueDate: Date;

  @IsEnum(SecretariatTaskStatus)
  status: SecretariatTaskStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  // ✅ Requis à la création
  @IsString()
  subsidiaryId: string;
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
  dueDate?: Date;

  @IsOptional()
  @IsEnum(SecretariatTaskStatus)
  status?: SecretariatTaskStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  // ✅ Optionnel ici, car on ne change généralement pas de filiale
  @IsOptional()
  @IsString()
  subsidiaryId?: string;
}

export class SearchSecretariatTasksDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(SecretariatTaskStatus)
  status?: SecretariatTaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}
