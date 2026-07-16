import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';
import {
  Prisma,
  Employee,
  Gender,
  ContractType,
  EmployeeStatus,
  PaymentMethod,
  DocumentType,
  LeaveType,
} from '@prisma/client';
import { generateId } from '../../common/utils/generate-id.util';
import { ID_PREFIXES } from '../../common/constants/id-prefixes.const';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to convert leave balances from database format to frontend format
   */
  private convertLeaveBalancesToFrontendFormat(leaveBalances: any[]): {
    annual: number;
    sick: number;
    personal: number;
    maternity: number;
    paternity: number;
    other: number;
  } {
    const leaveBalanceObj = {
      annual: 0,
      sick: 0,
      personal: 0,
      maternity: 0,
      paternity: 0,
      other: 0,
    };

    leaveBalances.forEach((balance) => {
      const key = balance.leaveType.toLowerCase();
      if (key in leaveBalanceObj) {
        leaveBalanceObj[key] = Number(balance.days);
      }
    });

    return leaveBalanceObj;
  }

  /**
   * Helper method to convert leave balances from frontend format to database operations
   */
  private async updateLeaveBalancesFromFrontendFormat(
    employeeId: string,
    leaveBalance: {
      annual: number;
      sick: number;
      personal: number;
      maternity: number;
      paternity: number;
      other: number;
    }
  ) {
    const leaveTypeMapping = {
      annual: 'ANNUAL' as LeaveType,
      sick: 'SICK' as LeaveType,
      personal: 'PERSONAL' as LeaveType,
      maternity: 'MATERNITY' as LeaveType,
      paternity: 'PATERNITY' as LeaveType,
      other: 'OTHER' as LeaveType,
    };

    for (const [key, days] of Object.entries(leaveBalance)) {
      const leaveType = leaveTypeMapping[key];
      if (leaveType) {
        await this.updateLeaveBalance(employeeId, leaveType, days, 'set');
      }
    }
  }

  /**
   * CREATE employee with leave balances
   */
  async create(
    createEmployeeDto: CreateEmployeeDto,
    subsidiaryId: string,
    employeeId?: string // Ajouter un paramètre optionnel pour l'ID de l'employé
  ): Promise<Employee> {
    this.logger.log(`Attempting to create employee for subsidiary ${subsidiaryId}`);

    // Vérifier que la filiale existe
    const subsidiary = await this.prisma.subsidiary.findUnique({ where: { id: subsidiaryId } });
    if (!subsidiary) {
      throw new BadRequestException(`Subsidiary with ID ${subsidiaryId} not found.`);
    }

    // Vérifier si un employé avec cet e-mail existe déjà (en excluant l'employé actuel si ID fourni)
    this.logger.log(`Checking email existence for: ${createEmployeeDto.email}`);
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: createEmployeeDto.email },
    });
    this.logger.log(`Existing employee found: ${JSON.stringify(existingEmployee)}`);
    
    if (existingEmployee && (!employeeId || existingEmployee.id !== employeeId)) {
      this.logger.warn(`Email conflict detected for email: ${createEmployeeDto.email}`);
      throw new ConflictException(`An employee with the email ${createEmployeeDto.email} already exists.`);
    }

    // Si un employeeId est fourni, c'est une mise à jour déguisée
    if (employeeId) {
      return this.update(employeeId, createEmployeeDto as any);
    }

    try {
      const employee = await this.prisma.$transaction(async (prisma) => {
        // Create employee
        const newEmployee = await prisma.employee.create({
          data: {
            id: generateId(ID_PREFIXES.EMPLOYEE),
            // Map all fields from the DTO to the Prisma model explicitly
            lastName: createEmployeeDto.lastName,
            firstName: createEmployeeDto.firstName,
            birthDate: new Date(createEmployeeDto.birthDate),
            gender: createEmployeeDto.gender,
            address: createEmployeeDto.address,
            phone: createEmployeeDto.phone,
            email: createEmployeeDto.email,
            nationality: createEmployeeDto.nationality,
            socialSecurityNumber: createEmployeeDto.socialSecurityNumber,
            department: createEmployeeDto.department,
            hireDate: new Date(createEmployeeDto.hireDate),
            contractType: createEmployeeDto.contractType,
            status: createEmployeeDto.status,
            managerId: createEmployeeDto.managerId,
            workLocation: createEmployeeDto.workLocation,
            baseSalary: createEmployeeDto.baseSalary,
            bonus: createEmployeeDto.bonus,
            benefits: createEmployeeDto.benefits,
            paymentMethod: createEmployeeDto.paymentMethod,
            positions: createEmployeeDto.positions,
            subsidiaryId,
            leaveBalance: 0,
          },
          include: {
            manager: true,
            subsidiary: true,
          },
        });

        // Initialize leave balances for all leave types
        const leaveTypes = ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER'] as LeaveType[];
        
        for (const leaveType of leaveTypes) {
          const balanceKey = leaveType.toLowerCase();
          const days = createEmployeeDto.leaveBalance?.[balanceKey] || 0;
          
          await prisma.employeeLeaveBalance.create({
            data: {
              employeeId: newEmployee.id,
              leaveType,
              days: days,
            },
          });
        }

        return newEmployee;
      });

      this.logger.log(`Employee created with ID: ${employee.id}`);
      return employee;
    } catch (error) {
      this.logger.error(`Failed to create employee: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`An employee with this email already exists.`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(`Foreign key constraint failed. Ensure subsidiary and manager (if provided) exist.`);
        }
        // Add more specific error handling for date parsing issues from Prisma
        if (error.code === 'P2000' && error.message.includes('birthDate')) {
          throw new BadRequestException('Invalid birthDate format. Expected a valid date string (e.g., YYYY-MM-DD).');
        }
        if (error.code === 'P2000' && error.message.includes('hireDate')) {
          throw new BadRequestException('Invalid hireDate format. Expected a valid date string (e.g., YYYY-MM-DD).');
        }

      }
      throw new InternalServerErrorException('Could not create employee.');
    }
  }

  /**
   * FIND ALL employees
   */
  async findAll(subsidiaryId: string, includeRelations = false): Promise<Employee[]> {
    const include = includeRelations
      ? {
          manager: true,
          subordinates: true,
          subsidiary: true,
          documents: true,
          positionHistory: true,
          trainings: true,
          performanceReviews: true,
          leaveRecords: true,
          leaveBalances: true,
        }
      : {};

    return this.prisma.employee.findMany({
      where: { subsidiaryId },
      include,
      orderBy: { lastName: 'asc' },
    });
  }

  /**
   * FIND ONE employee
   */
  async findOne(id: string, includeRelations = false): Promise<Employee> {
    const include = includeRelations
      ? {
          manager: true,
          subordinates: true,
          subsidiary: true,
          documents: true,
          positionHistory: true,
          trainings: true,
          performanceReviews: true,
          leaveRecords: true,
          leaveBalances: true,
        }
      : {};

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include,
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  /**
   * Get employee leave balances
   */
  async getLeaveBalances(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { leaveBalances: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return this.convertLeaveBalancesToFrontendFormat(employee.leaveBalances);
  }

  /**
   * Update employee leave balance
   */
  async updateLeaveBalance(
    employeeId: string,
    leaveType: LeaveType,
    days: number,
    operation: 'set' | 'add' | 'subtract' = 'set'
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return this.prisma.employeeLeaveBalance.upsert({
      where: {
        employeeId_leaveType: {
          employeeId,
          leaveType,
        },
      },
      update: {
        days: operation === 'set' ? days : operation === 'add' ? { increment: days } : { decrement: days },
        lastUpdated: new Date(),
      },
      create: {
        employeeId,
        leaveType,
        days: days,
      },
    });
  }

  /**
   * Update all employee leave balances at once
   */
  async updateAllLeaveBalances(
    employeeId: string,
    leaveBalance: {
      annual: number;
      sick: number;
      personal: number;
      maternity: number;
      paternity: number;
      other: number;
    }
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return this.prisma.$transaction(async (prisma) => {
      await this.updateLeaveBalancesFromFrontendFormat(employeeId, leaveBalance);
      
      // Return updated balances
      const updatedEmployee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { leaveBalances: true },
      });

      if (!updatedEmployee) {
        throw new Error(`Employee with ID ${employeeId} not found`);
      }

      return this.convertLeaveBalancesToFrontendFormat(updatedEmployee.leaveBalances);
    });
  }

  /**
   * ADD LEAVE RECORD (with transaction for balance decrement)
   */
  async addLeaveRecord(
    employeeId: string,
    leaveData: { startDate: Date; endDate: Date; days?: number; leaveRecordType: LeaveType },
  ): Promise<any> {
    const days =
      leaveData.days ||
      Math.ceil((leaveData.endDate.getTime() - leaveData.startDate.getTime()) / (1000 * 60 * 60 * 24));

    return this.prisma.$transaction(async (prisma) => {
      const leaveRecord = await prisma.employeeLeaveRecord.create({
        data: { ...leaveData, days, employeeId },
      });

      // Update specific leave balance instead of general balance
      await this.updateLeaveBalance(employeeId, leaveData.leaveRecordType, days, 'subtract');

      return leaveRecord;
    });
  }

  /**
   * UPDATE employee
   */
  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    try {
      // Vérifier si l'email est en cours de modification et si il est déjà utilisé par un autre employé
      if (updateEmployeeDto.email) {
        const existingEmployee = await this.prisma.employee.findUnique({
          where: { email: updateEmployeeDto.email },
        });
        
        if (existingEmployee && existingEmployee.id !== id) {
          throw new ConflictException(`An employee with the email ${updateEmployeeDto.email} already exists.`);
        }
      }

      const dataToUpdate: Prisma.EmployeeUpdateInput = {};

      // Filtrer les champs valides uniquement
      const validFields = [
        'lastName', 'firstName', 'address', 'phone', 'email', 'nationality', 
        'socialSecurityNumber', 'department', 'workLocation', 'positions',
        'gender', 'contractType', 'status', 'paymentMethod', 'managerId',
        'baseSalary', 'bonus', 'benefits', 'lastSalaryAdjustmentDate'
      ];

      // Copier uniquement les champs valides
      Object.keys(updateEmployeeDto).forEach(key => {
        if (validFields.includes(key) && updateEmployeeDto[key] !== undefined) {
          if (key === 'baseSalary' || key === 'bonus') {
            // Convertir les nombres en type number si nécessaire
            dataToUpdate[key] = Number(updateEmployeeDto[key]);
          } else if (key === 'birthDate' || key === 'hireDate' || key === 'lastSalaryAdjustmentDate') {
            // Convertir les dates en objets Date
            if (updateEmployeeDto[key]) {
              dataToUpdate[key] = new Date(updateEmployeeDto[key]);
            }
          } else {
            dataToUpdate[key] = updateEmployeeDto[key];
          }
        }
      });

      const employee = await this.prisma.employee.update({
        where: { id },
        data: dataToUpdate,
        include: { manager: true, subsidiary: true },
      });
      this.logger.log(`Employee ${id} updated successfully`);
      return employee;
    } catch (error) {
      this.logger.error(`Failed to update employee ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Employee with ID ${id} not found`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(`Foreign key constraint failed. Ensure manager (if provided) exists.`);
        }
        if (error.code === 'P2000' && error.message.includes('birthDate')) {
          throw new BadRequestException('Invalid birthDate format. Expected a valid date string (e.g., YYYY-MM-DD).');
        }
        if (error.code === 'P2000' && error.message.includes('hireDate')) {
          throw new BadRequestException('Invalid hireDate format. Expected a valid date string (e.g., YYYY-MM-DD).');
        }
      }
      throw new InternalServerErrorException(`Could not update employee ${id}`);
    }
  }

  /**
   * DELETE employee
   */
  async remove(id: string): Promise<Employee> {
    try {
      const employee = await this.prisma.employee.delete({
        where: { id },
      });
      this.logger.log(`Employee ${id} deleted successfully`);
      return employee;
    } catch (error) {
      this.logger.error(`Failed to delete employee ${id}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Employee with ID ${id} not found`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Cannot delete employee ${id} because of related records (foreign key constraint).`,
          );
        }
      }
      throw new InternalServerErrorException(`Could not delete employee ${id}`);
    }
  }

  /**
   * ADD DOCUMENT to employee
   */
  async addDocument(
    employeeId: string,
    documentName: string,
    url: string,
    docType: DocumentType,
  ): Promise<any> {
    return this.prisma.employeeDocument.create({
      data: { employeeId, documentName, url, docType },
      include: { employee: true },
    });
  }

  /**
   * ADD POSITION HISTORY
   */
  async addPositionHistory(
    employeeId: string,
    positionData: { employeePosition: string; department?: string; startDate: Date; endDate?: Date },
  ): Promise<any> {
    return this.prisma.employeePositionHistory.create({
      data: { ...positionData, employeeId },
    });
  }

  /**
   * ADD TRAINING
   */
  async addTraining(
    employeeId: string,
    trainingData: { trainingName: string; trainingDate: Date; provider?: string },
  ): Promise<any> {
    return this.prisma.employeeTraining.create({
      data: { ...trainingData, employeeId },
    });
  }

  /**
   * ADD PERFORMANCE REVIEW
   */
  async addPerformanceReview(
    employeeId: string,
    reviewData: { reviewDate: Date; reviewer?: string; rating?: number; reviewComments?: string },
  ): Promise<any> {
    return this.prisma.employeePerformanceReview.create({
      data: { ...reviewData, employeeId },
    });
  }
}
