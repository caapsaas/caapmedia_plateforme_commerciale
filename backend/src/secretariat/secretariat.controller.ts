import { Controller, Post, Body, Patch, Delete, Get, Param, Request, UseGuards, Query } from '@nestjs/common';
import { SecretariatService } from './secretariat.service';
import { JwtAuthGuard } from '../../src/common/auth/jwt/jwt.guard';
import { RoleGuard } from '../common/auth/role/role.guard';
import { SetMetadata } from '@nestjs/common';
import { IsString, IsEnum, IsOptional, IsUUID, IsDateString,IsArray } from 'class-validator';
import { UserRole, DocumentCategory, DocumentStatus, SecretariatTaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';


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
export class CreateMeetingDto {
  @IsString()
  // @ApiProperty({ description: 'Titre de la réunion' })
  title: string;

  @Type(() => Date)  // Convertit string ISO en Date
  @IsDate({ message: 'meetingDate must be a valid date' })
  // @ApiProperty({ description: 'Date de la réunion' })
  meetingDate: Date;

  @Type(() => Date)  // Convertit string ISO en Date
  @IsDate({ message: 'meetingTime must be a valid date' })
  // @ApiProperty({ description: 'Heure de la réunion' })
  meetingTime: Date;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Lieu de la réunion' })
  meetingLocation?: string;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Ordre du jour' })
  agenda?: string;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Compte-rendu' })
  minutes?: string;

  @IsUUID('all')  // Plus précis : valide tous les types UUID
  // @ApiProperty({ description: 'ID de la filiale' })
  subsidiaryId: string;

  @IsOptional()  // Rendu optionnel : tableau vide OK
  @IsArray()
  @IsUUID('all', { each: true })
  // @ApiPropertyOptional({ description: 'IDs des participants (employés)', type: [String] })
  participantIds?: string[];
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Nouveau titre' })
  title?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  // @ApiPropertyOptional({ description: 'Nouvelle date' })
  meetingDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  // @ApiPropertyOptional({ description: 'Nouvelle heure' })
  meetingTime?: Date;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Nouveau lieu' })
  meetingLocation?: string;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Nouveau ordre du jour' })
  agenda?: string;

  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Nouveau compte-rendu' })
  minutes?: string;

  @IsOptional()  // Rendu optionnel : ne force pas l'update des participants
  @IsArray()
  @IsUUID('all', { each: true })
  // @ApiPropertyOptional({ description: 'Nouveaux IDs des participants', type: [String] })
  participantIds?: string[];
}

export class SearchMeetingsDto {
  @IsOptional()
  @IsString()
  // @ApiPropertyOptional({ description: 'Titre à rechercher' })
  title?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  // @ApiPropertyOptional({ description: 'Date à rechercher' })
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

// Nouveaux endpoints pour gérer les participants individuellement
@UseGuards(JwtAuthGuard, RoleGuard)
@SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
@Post('meetings/:id/participants/:employeeId')
async addParticipantToMeeting(
  @Param('id') id: string,
  @Param('employeeId') employeeId: string,
  @Request() req,
) {
  return this.secretariatService.addParticipantToMeeting(id, employeeId, req.user);
}

@UseGuards(JwtAuthGuard, RoleGuard)
@SetMetadata('roles', [UserRole.SECRETARY, UserRole.ADMIN])
@Delete('meetings/:id/participants/:employeeId')
async removeParticipantFromMeeting(
  @Param('id') id: string,
  @Param('employeeId') employeeId: string,
  @Request() req,
) {
  return this.secretariatService.removeParticipantFromMeeting(id, employeeId, req.user);
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