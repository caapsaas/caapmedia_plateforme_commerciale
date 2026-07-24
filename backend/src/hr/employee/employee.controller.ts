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
} from '@nestjs/common';
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
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { LoggerService } from '../../common/utils/logger/logger.service';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('hr/employees')
@UseGuards(JwtAuthGuard, RoleGuard)
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'Employee successfully created.' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @Request() req) {
    const subsidiaryId = req.user.subsidiaryId;
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
  @Roles('HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get all employees of a subsidiary' })
  async findAll(
    @Request() req,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const subsidiaryId = req.user.subsidiaryId;
    this.logger.log(`Fetching employees for subsidiary ${subsidiaryId}`);
    const includeRel = includeRelations === 'true';
    return this.employeeService.findAll(subsidiaryId, includeRel);
  }

  @Get(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get a single employee by ID' })
  async findOne(
    @Param('id') id: string,
    @Query('includeRelations') includeRelations?: string,
  ) {
    this.logger.log(`Fetching employee ${id}`);
    const includeRel = includeRelations === 'true';
    return this.employeeService.findOne(id, includeRel);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Update employee by ID' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    this.logger.log(`Updating employee ${id}`);
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete employee by ID' })
  async remove(@Param('id') id: string) {
    this.logger.warn(`Deleting employee ${id}`);
    return this.employeeService.remove(id);
  }

  // ---------------------------
  // Sub-entities
  // ---------------------------

  @Post(':id/documents')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Add a document to an employee' })
  async addDocument(
    @Param('id') id: string,
    @Body() createEmployeeDocumentDto: CreateEmployeeDocumentDto,
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
    return this.employeeService.addTraining(id, createEmployeeTrainingDto);
  }

  @Post(':id/position-history')
  @Roles('HR_MANAGER')
  @ApiOperation({ summary: 'Add a position history entry' })
  async addPositionHistory(
    @Param('id') id: string,
    @Body() createEmployeePositionHistoryDto: CreateEmployeePositionHistoryDto,
  ) {
    return this.employeeService.addPositionHistory(id, createEmployeePositionHistoryDto);
  }

  @Post(':id/performance-reviews')
  @Roles('HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Add a performance review' })
  async addPerformanceReview(
    @Param('id') id: string,
    @Body() createEmployeePerformanceReviewDto: CreateEmployeePerformanceReviewDto,
  ) {
    return this.employeeService.addPerformanceReview(id, createEmployeePerformanceReviewDto);
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
      days: number;
      leaveRecordType: LeaveType;
    },
  ) {
    return this.employeeService.addLeaveRecord(id, addLeaveRecordDto);
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
