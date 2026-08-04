import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Get,
  Query,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SubsidiaryService } from '../subsidiaries/subsidiaries.service';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { RoleGuard } from '../../auth/role/role.guard';
import { Roles } from '../../auth/role/role.decorator';
import { SetMetadata } from '@nestjs/common';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

class CreateSubsidiaryDto {
  @IsString()
  subsidiaryName: string;

  @IsString()
  logoSvg: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  ifu: string;

  @IsString()
  rccm: string;

  @IsString()
  bankName: string;

  @IsString()
  accountNumber: string;

  @IsString()
  swiftCode: string;

  @IsNumber()
  @Min(0)
  shareCapital: number;

  // Taux d'IS (impôt sur les sociétés), fraction 0-1 — ex. 0.30 pour 30%.
  // Distinct de la TVA (module taxes), utilisé dans le compte de résultat.
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;
}

class UpdateSubsidiaryDto {
  @IsOptional()
  @IsString()
  subsidiaryName?: string;

  @IsOptional()
  @IsString()
  logoSvg?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  ifu?: string;

  @IsOptional()
  @IsString()
  rccm?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  swiftCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shareCapital?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;
}

class SearchSubsidiariesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  subsidiaryName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

@Controller('subsidiaries')
export class SubsidiaryController {
  constructor(private subsidiaryService: SubsidiaryService) {}

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  async createSubsidiary(@Body() dto: CreateSubsidiaryDto, @Request() req) {
    return this.subsidiaryService.createSubsidiary(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER)
  @Patch(':id')
  async updateSubsidiary(
    @Param('id') id: string,
    @Body() dto: UpdateSubsidiaryDto,
    @Request() req,
  ) {
    return this.subsidiaryService.updateSubsidiary(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  async deleteSubsidiary(@Param('id') id: string, @Request() req) {
    return this.subsidiaryService.deleteSubsidiary(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER)
  @Get()
  async getAllSubsidiaries(
    @Request() req,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.subsidiaryService.getAllSubsidiaries(req.user, paginationQuery);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER)
  @Get('search')
  async searchSubsidiaries(
    @Query() query: SearchSubsidiariesDto,
    @Request() req,
  ) {
    return this.subsidiaryService.searchSubsidiaries(query, req.user);
  }
}
