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

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * CREATE employee
   */
  async create(
    createEmployeeDto: CreateEmployeeDto,
    subsidiaryId: string
  ): Promise<Employee> {
    this.logger.log(`Attempting to create employee for subsidiary ${subsidiaryId}`);

    // Vérifier que la filiale existe
    const subsidiary = await this.prisma.subsidiary.findUnique({ where: { id: subsidiaryId } });
    if (!subsidiary) {
      throw new BadRequestException(`Subsidiary with ID ${subsidiaryId} not found.`);
    }

    // Vérifier si un employé avec cet e-mail existe déjà
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: createEmployeeDto.email },
    });
    if (existingEmployee) {
      throw new ConflictException(`An employee with the email ${createEmployeeDto.email} already exists.`);
    }

    try {
      const employee = await this.prisma.employee.create({
        data: {
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
   * UPDATE employee
   */
  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    try {
      const dataToUpdate: Prisma.EmployeeUpdateInput = {};

      // Explicitly convert date fields to Date objects if they are provided
      if (updateEmployeeDto.birthDate !== undefined) {
        dataToUpdate.birthDate = new Date(updateEmployeeDto.birthDate);
      }
      if (updateEmployeeDto.hireDate !== undefined) {
        dataToUpdate.hireDate = new Date(updateEmployeeDto.hireDate);
      }

      // Separate 'positions' from the rest of the DTO to avoid conflicts
      const { positions, ...restOfUpdateDto } = updateEmployeeDto;
      Object.assign(dataToUpdate, restOfUpdateDto);

      if (positions !== undefined) {
        dataToUpdate.positions = positions;
      }

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
      await prisma.employee.update({
        where: { id: employeeId },
        data: { leaveBalance: { decrement: days } },
      });
      return leaveRecord;
    });
  }
}
