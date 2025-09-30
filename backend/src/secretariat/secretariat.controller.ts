import { Controller, Post, Body, Patch, Delete, Get, Param, Request, UseGuards, Query } from '@nestjs/common';
import { SecretariatService } from './secretariat.service';
import { JwtAuthGuard } from '../../src/common/auth/jwt/jwt.guard';
import { RoleGuard } from '../common/auth/role/role.guard';
import { SetMetadata } from '@nestjs/common';
import { IsString, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { UserRole, DocumentCategory, DocumentStatus, SecretariatTaskStatus } from '@prisma/client';

class CreateCompanyDocumentDto {
  @IsString()
  documentName: string;

  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @IsString()
  fileUrl: string;

  @IsUUID()
  subsidiaryId: string;
}

class UpdateCompanyDocumentDto {
  @IsOptional()
  @IsString()
  documentName?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

class SearchCompanyDocumentsDto {
  @IsOptional()
  @IsString()
  documentName?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}

class CreateMeetingDto {
  @IsString()
  title: string;

  @IsDateString()
  meetingDate: Date;

  @IsDateString()
  meetingTime: Date;

  @IsOptional()
  @IsString()
  meetingLocation?: string;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  minutes?: string;

  @IsUUID()
  subsidiaryId: string;
}

class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  meetingDate?: Date;

  @IsOptional()
  @IsDateString()
  meetingTime?: Date;

  @IsOptional()
  @IsString()
  meetingLocation?: string;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  minutes?: string;
}

class SearchMeetingsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  meetingDate?: Date;
}

class CreateSecretariatTaskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  dueDate: Date;

  @IsEnum(SecretariatTaskStatus)
  status: SecretariatTaskStatus;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsUUID()
  subsidiaryId: string;
}

class UpdateSecretariatTaskDto {
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
  @IsUUID()
  assignedToId?: string;
}

class SearchSecretariatTasksDto {
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

@Controller('secretariat')
export class SecretariatController {
  constructor(private secretariatService: SecretariatService) {}

  // Endpoints for CompanyDocument
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Post('documents')
  async createCompanyDocument(@Body() dto: CreateCompanyDocumentDto, @Request() req) {
    return this.secretariatService.createCompanyDocument(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Patch('documents/:id')
  async updateCompanyDocument(@Param('id') id: string, @Body() dto: UpdateCompanyDocumentDto, @Request() req) {
    return this.secretariatService.updateCompanyDocument(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Delete('documents/:id')
  async deleteCompanyDocument(@Param('id') id: string, @Request() req) {
    return this.secretariatService.deleteCompanyDocument(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Get('documents')
  async getAllCompanyDocuments(@Request() req) {
    return this.secretariatService.getAllCompanyDocuments(req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Get('documents/search')
  async searchCompanyDocuments(@Query() query: SearchCompanyDocumentsDto, @Request() req) {
    return this.secretariatService.searchCompanyDocuments(query, req.user);
  }

  // Endpoints for Meeting
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Post('meetings')
  async createMeeting(@Body() dto: CreateMeetingDto, @Request() req) {
    return this.secretariatService.createMeeting(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Patch('meetings/:id')
  async updateMeeting(@Param('id') id: string, @Body() dto: UpdateMeetingDto, @Request() req) {
    return this.secretariatService.updateMeeting(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Delete('meetings/:id')
  async deleteMeeting(@Param('id') id: string, @Request() req) {
    return this.secretariatService.deleteMeeting(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Get('meetings')
  async getAllMeetings(@Request() req) {
    return this.secretariatService.getAllMeetings(req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Get('meetings/search')
  async searchMeetings(@Query() query: SearchMeetingsDto, @Request() req) {
    return this.secretariatService.searchMeetings(query, req.user);
  }

  // Endpoints for SecretariatTask
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Post('tasks')
  async createSecretariatTask(@Body() dto: CreateSecretariatTaskDto, @Request() req) {
    return this.secretariatService.createSecretariatTask(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Patch('tasks/:id')
  async updateSecretariatTask(@Param('id') id: string, @Body() dto: UpdateSecretariatTaskDto, @Request() req) {
    return this.secretariatService.updateSecretariatTask(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Delete('tasks/:id')
  async deleteSecretariatTask(@Param('id') id: string, @Request() req) {
    return this.secretariatService.deleteSecretariatTask(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Get('tasks')
  async getAllSecretariatTasks(@Request() req) {
    return this.secretariatService.getAllSecretariatTasks(req.user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
  @Get('tasks/search')
  async searchSecretariatTasks(@Query() query: SearchSecretariatTasksDto, @Request() req) {
    return this.secretariatService.searchSecretariatTasks(query, req.user);
  }
}