import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { PreHireTrainingStatus } from '@prisma/client';

export class CreatePreHireTrainingDto {
  @IsString() @MinLength(1) firstName: string;
  @IsString() @MinLength(1) lastName: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @MinLength(1) phone: string;
  @IsString() @MinLength(1) targetPosition: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() mentorName?: string;
  @Type(() => Date) @IsDate() startDate: Date;
  @IsOptional() @Type(() => Date) @IsDate() plannedEndDate?: Date;
  @IsOptional() @IsEnum(PreHireTrainingStatus) status?: PreHireTrainingStatus;
  @IsOptional() @IsInt() @Min(0) @Max(100) progress?: number;
  @IsOptional() @IsInt() @Min(0) acquiredClients?: number;
  @IsOptional() @IsInt() @Min(0) acquiredProspects?: number;
  @IsOptional() @IsString() evaluation?: string;
  @IsOptional() @IsString() outcome?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() subsidiaryId?: string;
}

export class UpdatePreHireTrainingDto extends PartialType(CreatePreHireTrainingDto) {}
