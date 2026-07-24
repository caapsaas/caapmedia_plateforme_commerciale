import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStepDto {
  @IsUUID()
  equipmentId: string;

  @IsInt()
  @Min(1)
  stepOrder: number;
}

export class CreateWorkflowDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  itemId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  itemId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps?: WorkflowStepDto[];
}
