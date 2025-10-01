import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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

  constructor(private prisma: PrismaService) {}

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

    

    try {
      const employee = await this.prisma.employee.create({
        data: {
          ...createEmployeeDto,
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
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Foreign key constraint failed. Ensure subsidiary and manager (if provided) exist.`,
          );
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
      const employee = await this.prisma.employee.update({
        where: { id },
        data: updateEmployeeDto,
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
