import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  LeaveBalanceDto,
} from './dto/employee.dto';
import { DocumentType, LeaveType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { LoggerService } from '../../common/utils/logger/logger.service';
import { FileUploadService } from '../../common/utils/file-upload.service';
import {
  resolveScopeContext,
  resolveEffectiveSubsidiaryId,
  assertSubsidiaryAccess,
} from '../../common/utils/subsidiary-scope';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('hr/employees')
@UseGuards(JwtAuthGuard, RoleGuard)
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly logger: LoggerService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'Employee successfully created.' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @Request() req) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);
    this.logger.log(`Creating employee in subsidiary ${subsidiaryId}`);

    // Log pour déboguer
    this.logger.log(`Received DTO: ${JSON.stringify(createEmployeeDto)}`);

    // Extraire l'ID des données si présent (pour gérer les mises à jour déguisées)
    const dtoAsAny = createEmployeeDto as any;
    const employeeId = dtoAsAny.id;

    this.logger.log(`Extracted employeeId: ${employeeId}`);

    if (employeeId) {
      this.logger.log(`Redirecting to update for employee ${employeeId}`);
      return this.employeeService.update(employeeId, dtoAsAny);
    }

    return this.employeeService.create(createEmployeeDto, subsidiaryId);
  }

  @Get()
  @Roles('HR_MANAGER', 'ADMIN', 'SECRETARY')
  @ApiOperation({ summary: 'Get all employees of a subsidiary' })
  async findAll(
    @Request() req,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('includeRelations') includeRelations?: string,
    @Query('subsidiaryId') subsidiaryIdFilter?: string,
  ) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx, subsidiaryIdFilter);
    this.logger.log(
      `Fetching employees for subsidiary ${subsidiaryId} (role: ${req.user.roles})`,
    );
    const includeRel = includeRelations === 'true';

    return this.employeeService.findAll(
      subsidiaryId,
      includeRel,
      paginationQuery,
    );
  }

  @Get(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SECRETARY')
  @ApiOperation({ summary: 'Get a single employee by ID' })
  async findOne(
    @Param('id') id: string,
    @Request() req,
    @Query('includeRelations') includeRelations?: string,
  ) {
    this.logger.log(`Fetching employee ${id}`);
    const includeRel = includeRelations === 'true';
    const employee = await this.employeeService.findOne(id, includeRel);
    const ctx = resolveScopeContext(req.user);
    assertSubsidiaryAccess(employee.subsidiaryId, ctx);
    return employee;
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Update employee by ID' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Request() req,
  ) {
    this.logger.log(`Updating employee ${id}`);
    const employee = await this.employeeService.findOne(id, false);
    const ctx = resolveScopeContext(req.user);
    assertSubsidiaryAccess(employee.subsidiaryId, ctx);
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete employee by ID' })
  async remove(@Param('id') id: string, @Request() req) {
    this.logger.warn(`Deleting employee ${id}`);
    const employee = await this.employeeService.findOne(id, false);
    const ctx = resolveScopeContext(req.user);
    assertSubsidiaryAccess(employee.subsidiaryId, ctx);
    return this.employeeService.remove(id);
  }

  // ---------------------------
  // Document Upload
  // ---------------------------

  @Post('upload-documents')
  @Roles('ADMIN', 'HR_MANAGER')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Upload documents (without employee link)' })
  async uploadDocumentsGeneric(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadedFiles: { fieldname: string; url: string; originalname: string }[] = [];

    for (const file of files) {
      const { url } = await this.fileUploadService.uploadFile(
        file.buffer,
        file.originalname,
        { subfolder: 'employee-documents' },
      );
      uploadedFiles.push({
        fieldname: file.fieldname,
        url,
        originalname: file.originalname,
      });
    }

    return { uploadedFiles };
  }

  @Post('delete-document')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Delete a document file' })
  async deleteDocument(
    @Body() body: { url: string },
  ) {
    if (!body.url) {
      throw new BadRequestException('Document URL is required');
    }

    await this.fileUploadService.deleteFile(body.url);
    return { success: true };
  }

  // ---------------------------
  // Sub-entities
  // ---------------------------

  @Post(':id/upload-documents')
  @Roles('ADMIN', 'HR_MANAGER')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Upload documents for an employee' })
  async uploadDocuments(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const employee = await this.employeeService.findOne(id, false);
    const ctx = resolveScopeContext(req.user);
    assertSubsidiaryAccess(employee.subsidiaryId, ctx);

    const uploadedFiles: { fieldname: string; url: string; originalname: string }[] = [];

    for (const file of files) {
      const { url } = await this.fileUploadService.uploadFile(
        file.buffer,
        file.originalname,
        { subfolder: 'employee-documents' },
      );
      uploadedFiles.push({
        fieldname: file.fieldname,
        url,
        originalname: file.originalname,
      });
    }

    return { uploadedFiles };
  }

  @Post(':id/documents')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Add a document to an employee' })
  async addDocument(
    @Param('id') id: string,
    @Body() body: { documentName: string; url: string; docType: DocumentType },
  ) {
    return this.employeeService.addDocument(
      id,
      body.documentName,
      body.url,
      body.docType,
    );
  }

  @Post(':id/trainings')
  @Roles('HR_MANAGER')
  @ApiOperation({ summary: 'Add a training record to an employee' })
  async addTraining(
    @Param('id') id: string,
    @Body()
    body: { trainingName: string; trainingDate: string; provider?: string },
  ) {
    return this.employeeService.addTraining(id, {
      ...body,
      trainingDate: new Date(body.trainingDate),
    });
  }

  @Post(':id/position-history')
  @Roles('HR_MANAGER')
  @ApiOperation({ summary: 'Add a position history entry' })
  async addPositionHistory(
    @Param('id') id: string,
    @Body()
    body: {
      employeePosition: string;
      department?: string;
      startDate: string;
      endDate?: string;
    },
  ) {
    return this.employeeService.addPositionHistory(id, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Post(':id/performance-reviews')
  @Roles('HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Add a performance review' })
  async addPerformanceReview(
    @Param('id') id: string,
    @Body()
    body: {
      reviewDate: string;
      reviewer?: string;
      rating?: number;
      reviewComments?: string;
    },
  ) {
    return this.employeeService.addPerformanceReview(id, {
      ...body,
      reviewDate: new Date(body.reviewDate),
    });
  }

  @Post(':id/leaves')
  @Roles('HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Add a leave record' })
  async addLeaveRecord(
    @Param('id') id: string,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      days?: number;
      leaveRecordType: LeaveType;
    },
  ) {
    return this.employeeService.addLeaveRecord(id, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Get(':id/leave-balances')
  @Roles('HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get employee leave balances' })
  async getLeaveBalances(@Param('id') id: string) {
    return this.employeeService.getLeaveBalances(id);
  }

  @Patch(':id/leave-balances/:leaveType')
  @Roles('HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update employee leave balance' })
  async updateLeaveBalance(
    @Param('id') id: string,
    @Param('leaveType') leaveType: LeaveType,
    @Body() body: { days: number; operation?: 'set' | 'add' | 'subtract' },
  ) {
    return this.employeeService.updateLeaveBalance(
      id,
      leaveType,
      body.days,
      body.operation || 'set',
    );
  }

  @Patch(':id/leave-balances')
  @Roles('HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update all employee leave balances' })
  async updateAllLeaveBalances(
    @Param('id') id: string,
    @Body() leaveBalance: LeaveBalanceDto,
  ) {
    return this.employeeService.updateAllLeaveBalances(id, leaveBalance);
  }
}
