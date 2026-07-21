import { PartialType } from '@nestjs/mapped-types';
import { SpecFieldType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSpecGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateSpecGroupDto extends PartialType(CreateSpecGroupDto) {}

export class CreateSpecificationDto {
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  // ex: paper_weight — utilisée comme clé dans OrderItem.specValues
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      'technicalKey doit être en snake_case (lettres minuscules, chiffres, underscores)',
  })
  technicalKey: string;

  @IsEnum(SpecFieldType)
  type: SpecFieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  defaultValue?: unknown;

  @IsOptional()
  possibleValues?: unknown;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  visibleToClient?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleToProduction?: boolean;

  @IsOptional()
  @IsBoolean()
  editableAfterValidation?: boolean;

  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @IsOptional()
  @IsString()
  internalDescription?: string;

  @IsOptional()
  @IsObject()
  typeConfig?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  rules?: unknown[];
}

export class UpdateSpecificationDto extends PartialType(
  CreateSpecificationDto,
) {}

class ReorderItemDto {
  @IsUUID()
  id: string;

  @IsInt()
  order: number;

  @IsOptional()
  @IsUUID()
  groupId?: string | null;
}

export class ReorderSpecificationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
