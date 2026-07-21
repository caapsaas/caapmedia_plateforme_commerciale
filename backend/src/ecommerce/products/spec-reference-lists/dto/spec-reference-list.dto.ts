import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateReferenceListDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      'key doit être en snake_case (lettres minuscules, chiffres, underscores)',
  })
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateReferenceListDto extends PartialType(
  CreateReferenceListDto,
) {}

export class CreateReferenceValueDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateReferenceValueDto extends PartialType(
  CreateReferenceValueDto,
) {}
