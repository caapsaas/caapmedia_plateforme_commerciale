import { Controller, Post, Body, Patch, Delete, Get, Query, Param, Request, UseGuards } from '@nestjs/common';
import { SubsidiaryService } from '../subsidiaries/subsidiaries.service';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { RoleGuard } from '../../auth/role/role.guard';
import { SetMetadata } from '@nestjs/common';
import { IsString, IsEmail, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { UserRole } from '@prisma/client';

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
}

class SearchSubsidiariesDto {
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
  @SetMetadata('roles', [UserRole.ADMIN])
  @Post()
  async createSubsidiary(@Body() dto: CreateSubsidiaryDto, @Request() req) {
    return this.subsidiaryService.createSubsidiary(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.HR_MANAGER])
  @Patch(':id')
  async updateSubsidiary(@Param('id') id: string, @Body() dto: UpdateSubsidiaryDto, @Request() req) {
    return this.subsidiaryService.updateSubsidiary(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  @Delete(':id')
  async deleteSubsidiary(@Param('id') id: string, @Request() req) {
    return this.subsidiaryService.deleteSubsidiary(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.HR_MANAGER])
  @Get()
  async getAllSubsidiaries(@Request() req) {
    return this.subsidiaryService.getAllSubsidiaries(req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.HR_MANAGER])
  @Get('search')
  async searchSubsidiaries(@Query() query: SearchSubsidiariesDto, @Request() req) {
    return this.subsidiaryService.searchSubsidiaries(query, req.user);
  }
}