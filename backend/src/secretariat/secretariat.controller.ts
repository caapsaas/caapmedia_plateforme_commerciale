import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
  Query,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  BadRequestException,
  UploadedFile, // Gardé pour la compatibilité de l'update
  UploadedFiles, // Ajouté pour la création
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SecretariatService } from './secretariat.service';
import { JwtAuthGuard } from '../../src/common/auth/jwt/jwt.guard';
import { RoleGuard } from '../common/auth/role/role.guard';
import { SubsidiaryGuard } from '../common/auth/subsidiary/subsidiary.guard';
import { Roles } from '../common/auth/role/role.decorator';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateCompanyDocumentDto } from './dto/create-company-document.dto';
import { UpdateCompanyDocumentDto } from './dto/update-company-document.dto';
import { SearchCompanyDocumentsDto } from './dto/search-company-documents.dto';
import { PaginationQueryDto } from '../common/pagination/dto/pagination-query.dto';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  SearchMeetingsDto,
} from './dto/meeting.dto';
import {
  CreateSecretariatTaskDto,
  UpdateSecretariatTaskDto,
  SearchSecretariatTasksDto,
} from './dto/task.dto';
import {
  resolveScopeContext,
  assertSubsidiaryAccess,
} from '../common/utils/subsidiary-scope';

@Controller('secretariat')
@UseGuards(JwtAuthGuard, RoleGuard, SubsidiaryGuard)
export class SecretariatController {
  constructor(private readonly secretariatService: SecretariatService) {}

  // Endpoints pour CompanyDocument
  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Post('documents')
  @UsePipes(new ValidationPipe({ transform: true })) // Validation auto du DTO
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file', maxCount: 1 }], {
      storage: diskStorage({
        destination: './public/uploads/secretariat', // Consistent path with orders module
        filename: (_req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join(''); // Random name from orders module
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (
          !file.originalname.match(/\.(pdf|doc|docx|xlsx|xls|jpg|png|txt)$/)
        ) {
          return cb(
            new BadRequestException(
              'Seuls les fichiers PDF, DOC, DOCX, XLSX, XLS, JPG, PNG, TXT sont autorisés.',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async createCompanyDocument(
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body() dto: CreateCompanyDocumentDto, // Parse les champs texte (subsidiaryId, etc.)
    @Req() req,
  ) {
    const file = files?.file?.[0];
    if (!file) {
      throw new BadRequestException(
        'Un fichier est requis pour créer le document',
      );
    }
    // Passer le fichier et le DTO au service
    return this.secretariatService.createCompanyDocument(dto, req.user, file);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Patch('documents/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileInterceptor('file', {
      // Permet la mise à jour optionnelle du fichier
      storage: diskStorage({
        destination: './public/uploads/secretariat', // Consistent path
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (
          !file.originalname.match(/\.(pdf|doc|docx|xlsx|xls|jpg|png|txt)$/)
        ) {
          return cb(
            new BadRequestException(
              'Seuls PDF, DOC, DOCX, JPG, PNG, TXT autorisés',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async updateCompanyDocument(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDocumentDto,
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Passer le DTO et le fichier (s'il existe) au service
    return this.secretariatService.updateCompanyDocument(
      id,
      dto,
      req.user,
      file,
    );
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Delete('documents/:id')
  async deleteCompanyDocument(@Param('id') id: string, @Req() req) {
    return this.secretariatService.deleteCompanyDocument(id, req.user);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Patch('documents/:id/archive')
  async archiveCompanyDocument(@Param('id') id: string, @Req() req) {
    return this.secretariatService.archiveCompanyDocument(id, req.user);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Get('documents')
  async getAllCompanyDocuments(
    @Req() req,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const ctx = resolveScopeContext(req.user);
    return this.secretariatService.getAllCompanyDocuments(
      ctx,
      paginationQuery,
    );
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Get('documents/search')
  async searchCompanyDocuments(
    @Query() query: SearchCompanyDocumentsDto,
    @Req() req,
  ) {
    const ctx = resolveScopeContext(req.user);
    return this.secretariatService.searchCompanyDocuments(query, ctx);
  }

  // Endpoints for Meeting
  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Post('meetings')
  @UsePipes(new ValidationPipe({ transform: true })) // Validation auto du DTO (ex. subsidiaryId requis, participantIds array optionnel)
  async createMeeting(@Body() dto: CreateMeetingDto, @Req() req) {
    return this.secretariatService.createMeeting(dto, req.user);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Patch('meetings/:id')
  @UsePipes(new ValidationPipe({ transform: true })) // Validation auto du DTO (participantIds optionnel pour mise à jour)
  async updateMeeting(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
    @Req() req,
  ) {
    return this.secretariatService.updateMeeting(id, dto, req.user);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Delete('meetings/:id')
  async deleteMeeting(@Param('id') id: string, @Req() req) {
    return this.secretariatService.deleteMeeting(id, req.user);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Get('meetings')
  async getAllMeetings(
    @Req() req,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const ctx = resolveScopeContext(req.user);
    return this.secretariatService.getAllMeetings(ctx, paginationQuery);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Get('meetings/search')
  @UsePipes(new ValidationPipe({ transform: true })) // Validation auto du DTO (title, meetingDate optionnels)
  async searchMeetings(@Query() query: SearchMeetingsDto, @Req() req) {
    const ctx = resolveScopeContext(req.user);
    return this.secretariatService.searchMeetings(query, ctx);
  }

  // Nouveaux endpoints pour gérer les participants individuellement
  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Post('meetings/:id/participants/:employeeId')
  async addParticipantToMeeting(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Req() req,
  ) {
    return this.secretariatService.addParticipantToMeeting(
      id,
      employeeId,
      req.user,
    );
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Delete('meetings/:id/participants/:employeeId')
  async removeParticipantFromMeeting(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Req() req,
  ) {
    return this.secretariatService.removeParticipantFromMeeting(
      id,
      employeeId,
      req.user,
    );
  }

  // Endpoints for SecretariatTask
  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Post('tasks')
  @UsePipes(new ValidationPipe({ transform: true })) // Validation auto du DTO (ex. subsidiaryId requis, assignedToId optionnel)
  async createSecretariatTask(
    @Body() dto: CreateSecretariatTaskDto,
    @Req() req,
  ) {
    return this.secretariatService.createSecretariatTask(dto, req.user);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Patch('tasks/:id')
  @UsePipes(new ValidationPipe({ transform: true })) // Validation auto du DTO (assignedToId optionnel pour mise à jour)
  async updateSecretariatTask(
    @Param('id') id: string,
    @Body() dto: UpdateSecretariatTaskDto,
    @Req() req,
  ) {
    return this.secretariatService.updateSecretariatTask(id, dto, req.user);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Delete('tasks/:id')
  async deleteSecretariatTask(@Param('id') id: string, @Req() req) {
    return this.secretariatService.deleteSecretariatTask(id, req.user);
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Get('tasks')
  async getAllSecretariatTasks(
    @Req() req,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const ctx = resolveScopeContext(req.user);
    return this.secretariatService.getAllSecretariatTasks(
      ctx,
      paginationQuery,
    );
  }

  @Roles(UserRole.SECRETARY, UserRole.ADMIN)
  @Get('tasks/search')
  @UsePipes(new ValidationPipe({ transform: true })) // Validation auto du DTO (title, status, dueDate optionnels)
  async searchSecretariatTasks(
    @Query() query: SearchSecretariatTasksDto,
    @Req() req,
  ) {
    const ctx = resolveScopeContext(req.user);
    return this.secretariatService.searchSecretariatTasks(query, ctx);
  }
}
