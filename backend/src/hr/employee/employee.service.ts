import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import {
  Prisma,
  Employee,
  Gender,
  ContractType,
  EmployeeStatus,
  PaymentMethod,
  DocumentType,
  LeaveType,
  SalaryInputMode,
} from '@prisma/client';
import { generateId } from '../../common/utils/generate-id.util';
import { ID_PREFIXES } from '../../common/constants/id-prefixes.const';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';
import { paginate, PaginatedResult } from '../../common/pagination/pagination';
import { CameroonPayrollCalculatorService } from '../payrollrecord/cameroonpayrollcalculator.service';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payrollCalculator: CameroonPayrollCalculatorService,
  ) {}

  /**
   * Helper method: Calculate total indemnities from array of indemnities
   */
  private calculateTotalIndemnities(indemnities?: any[]): number {
    if (!Array.isArray(indemnities) || indemnities.length === 0) {
      return 0;
    }
    return indemnities.reduce((sum, ind) => sum + (Number(ind.amount) || 0), 0);
  }

  /**
   * Helper method: if salaryInputMode is NET, calculate baseSalary from targetNetSalary
   */
  private resolveSalaryIfNetMode(dto: CreateEmployeeDto | UpdateEmployeeDto): {
    baseSalary: number;
    salaryInputMode?: SalaryInputMode;
    targetNetSalary?: number;
  } {
    // Si le mode est NET et qu'on a un net cible, on recalcule le salaire de base
    if (
      dto.salaryInputMode === SalaryInputMode.NET &&
      dto.targetNetSalary != null
    ) {
      this.logger.log(
        `Calcul du salaire de base pour net cible: ${dto.targetNetSalary} FCFA`,
      );
      const result = this.payrollCalculator.calculateFromNetSalary({
        targetNetSalary: dto.targetNetSalary,
        bonus: dto.bonus ?? 0,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      return {
        baseSalary: result.baseSalary,
        salaryInputMode: SalaryInputMode.NET,
        targetNetSalary: dto.targetNetSalary,
      };
    }

    // Sinon, on utilise le salaire de base fourni (par défaut BASE mode)
    return {
      baseSalary: dto.baseSalary ?? 0,
      salaryInputMode: dto.salaryInputMode ?? SalaryInputMode.BASE,
      targetNetSalary: undefined,
    };
  }

  /**
   * Helper method to convert Prisma Decimal to number for API response
   */
  private convertEmployeeToDTO(employee: any): any {
    if (!employee) return employee;

    const dto = {
      ...employee,
      baseSalary: employee.baseSalary ? Number(employee.baseSalary) : 0,
      bonus: employee.bonus ? Number(employee.bonus) : 0,
      leaveBalance: employee.leaveBalance ? Number(employee.leaveBalance) : 0,
    };

    // Convert documents from array format to object format if includeRelations was used
    if (employee.documents && Array.isArray(employee.documents)) {
      dto.documents = this.convertDocumentsToFrontendFormat(employee.documents);
    }

    // Convert leaveBalances from array format to object format if includeRelations was used
    if (employee.leaveBalances && Array.isArray(employee.leaveBalances)) {
      dto.leaveBalance = this.convertLeaveBalancesToFrontendFormat(
        employee.leaveBalances,
      );
    }

    return dto;
  }

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
    unpaid: number;
  } {
    const leaveBalanceObj = {
      annual: 0,
      sick: 0,
      personal: 0,
      maternity: 0,
      paternity: 0,
      other: 0,
      unpaid: 0,
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
   * Helper method to convert documents from database format to frontend format
   * Database format: array of EmployeeDocument with docType
   * Frontend format: object with contract, idCard, workPermit, diplomas
   */
  private convertDocumentsToFrontendFormat(documents: any[]): {
    contract: { name: string; url: string } | null;
    idCard: { name: string; url: string } | null;
    workPermit: { name: string; url: string } | null;
    diplomas: { name: string; url: string }[];
  } {
    const result = {
      contract: null as { name: string; url: string } | null,
      idCard: null as { name: string; url: string } | null,
      workPermit: null as { name: string; url: string } | null,
      diplomas: [] as { name: string; url: string }[],
    };

    if (!documents || !Array.isArray(documents)) {
      return result;
    }

    documents.forEach((doc) => {
      const docType = doc.docType || doc.documentType;
      if (!docType) return;

      const docData = {
        name: doc.documentName || doc.name || '',
        url: doc.url || '',
      };

      switch (docType) {
        case 'CONTRACT':
          result.contract = docData;
          break;
        case 'ID_CARD':
          result.idCard = docData;
          break;
        case 'WORK_PERMIT':
          result.workPermit = docData;
          break;
        case 'DIPLOMA':
          result.diplomas.push(docData);
          break;
      }
    });

    return result;
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
    },
  ) {
    const leaveTypeMapping = {
      annual: 'ANNUAL' as LeaveType,
      sick: 'SICK' as LeaveType,
      personal: 'PERSONAL' as LeaveType,
      maternity: 'MATERNITY' as LeaveType,
      paternity: 'PATERNITY' as LeaveType,
      other: 'OTHER' as LeaveType,
      unpaid: 'UNPAID' as LeaveType,
    };

    for (const [key, days] of Object.entries(leaveBalance)) {
      const leaveType = leaveTypeMapping[key as keyof typeof leaveTypeMapping];
      if (leaveType && days !== undefined) {
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
    employeeId?: string, // Ajouter un paramètre optionnel pour l'ID de l'employé
  ): Promise<Employee> {
    this.logger.log(
      `Attempting to create employee for subsidiary ${subsidiaryId}`,
    );

    // Vérifier que la filiale existe
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: subsidiaryId },
    });
    if (!subsidiary) {
      throw new BadRequestException(
        `Subsidiary with ID ${subsidiaryId} not found.`,
      );
    }

    // Vérifier si un employé avec cet e-mail existe déjà
    this.logger.log(`Checking email existence for: ${createEmployeeDto.email}`);
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: createEmployeeDto.email },
    });
    this.logger.log(
      `Existing employee found: ${JSON.stringify(existingEmployee)}`,
    );

    if (
      existingEmployee &&
      (!employeeId || existingEmployee.id !== employeeId)
    ) {
      this.logger.warn(
        `Email conflict detected for email: ${createEmployeeDto.email}`,
      );
      throw new ConflictException(
        `An employee with the email ${createEmployeeDto.email} already exists.`,
      );
    }

    try {
      // Resolve salary if in NET mode
      const salaryResolution = this.resolveSalaryIfNetMode(createEmployeeDto);

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
            baseSalary: salaryResolution.baseSalary,
            bonus: createEmployeeDto.bonus,
            benefits: createEmployeeDto.benefits,
            paymentMethod: createEmployeeDto.paymentMethod,
            positions: createEmployeeDto.positions,
            subsidiaryId,
            leaveBalance: 0,
            // Personal information fields
            numberDependents: createEmployeeDto.numberDependents || 0,
            situationMatrimony:
              createEmployeeDto.situationMatrimony || 'SINGLE',
            bankAccountNumber: createEmployeeDto.bankAccountNumber,
            // Salary Input Mode
            salaryInputMode: salaryResolution.salaryInputMode,
            targetNetSalary: salaryResolution.targetNetSalary,
            // Indemnities (convert to JSON)
            indemnities: createEmployeeDto.indemnities
              ? JSON.parse(JSON.stringify(createEmployeeDto.indemnities))
              : null,
          },
          include: {
            manager: true,
            subsidiary: true,
          },
        });

        // Initialize leave balances for all leave types
        const leaveTypes = [
          'ANNUAL',
          'SICK',
          'PERSONAL',
          'MATERNITY',
          'PATERNITY',
          'OTHER',
          'UNPAID',
        ] as LeaveType[];

        for (const leaveType of leaveTypes) {
          const balanceKey = leaveType.toLowerCase();
          const days = createEmployeeDto.leaveBalance?.[balanceKey] || 0;

          await prisma.employeeLeaveBalance.create({
            data: {
              id: generateId(ID_PREFIXES.EMPLOYEELEAVEBALANCE),
              employeeId: newEmployee.id,
              leaveType,
              days: days,
            },
          });
        }

        // Handle documents if provided
        if (createEmployeeDto.documents) {
          const docsData = createEmployeeDto.documents as any;

          if (docsData.contract) {
            await prisma.employeeDocument.create({
              data: {
                id: generateId(ID_PREFIXES.EMPLOYEEDOCUMENT),
                employeeId: newEmployee.id,
                documentName: docsData.contract.name || 'Contract',
                url: docsData.contract.url,
                docType: 'CONTRACT' as DocumentType,
              },
            });
          }

          if (docsData.idCard) {
            await prisma.employeeDocument.create({
              data: {
                id: generateId(ID_PREFIXES.EMPLOYEEDOCUMENT),
                employeeId: newEmployee.id,
                documentName: docsData.idCard.name || 'ID Card',
                url: docsData.idCard.url,
                docType: 'ID_CARD' as DocumentType,
              },
            });
          }

          if (docsData.workPermit) {
            await prisma.employeeDocument.create({
              data: {
                id: generateId(ID_PREFIXES.EMPLOYEEDOCUMENT),
                employeeId: newEmployee.id,
                documentName: docsData.workPermit.name || 'Work Permit',
                url: docsData.workPermit.url,
                docType: 'WORK_PERMIT' as DocumentType,
              },
            });
          }

          if (docsData.diplomas && Array.isArray(docsData.diplomas)) {
            for (const diploma of docsData.diplomas) {
              await prisma.employeeDocument.create({
                data: {
                  id: generateId(ID_PREFIXES.EMPLOYEEDOCUMENT),
                  employeeId: newEmployee.id,
                  documentName: diploma.name || 'Diploma',
                  url: diploma.url,
                  docType: 'DIPLOMA' as DocumentType,
                },
              });
            }
          }
        }

        return newEmployee;
      });

      this.logger.log(`Employee created with ID: ${employee.id}`);
      return this.convertEmployeeToDTO(employee);
    } catch (error) {
      this.logger.error(
        `Failed to create employee: ${error.message}`,
        error.stack,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `An employee with this email already exists.`,
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Foreign key constraint failed. Ensure subsidiary and manager (if provided) exist.`,
          );
        }
        // Add more specific error handling for date parsing issues from Prisma
        if (error.code === 'P2000' && error.message.includes('birthDate')) {
          throw new BadRequestException(
            'Invalid birthDate format. Expected a valid date string (e.g., YYYY-MM-DD).',
          );
        }
        if (error.code === 'P2000' && error.message.includes('hireDate')) {
          throw new BadRequestException(
            'Invalid hireDate format. Expected a valid date string (e.g., YYYY-MM-DD).',
          );
        }
      }
      throw new InternalServerErrorException('Could not create employee.');
    }
  }

  /**
   * FIND ALL employees
   */
  async findAll(
    subsidiaryId: string | null | undefined,
    includeRelations = false,
    paginationQuery: PaginationQueryDto = {},
  ): Promise<PaginatedResult<Employee>> {
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

    // SUPER_ADMIN (subsidiaryId === null or undefined) voit tous les employés toutes filiales
    const where: Prisma.EmployeeWhereInput = subsidiaryId
      ? { subsidiaryId }
      : {};

    if (paginationQuery.search) {
      where.OR = [
        {
          firstName: { contains: paginationQuery.search, mode: 'insensitive' },
        },
        { lastName: { contains: paginationQuery.search, mode: 'insensitive' } },
        { email: { contains: paginationQuery.search, mode: 'insensitive' } },
      ];
    }

    const result = await paginate<Employee>(
      this.prisma.employee,
      { where, include, orderBy: { lastName: 'asc' } },
      paginationQuery,
    );

    return {
      ...result,
      data: result.data.map((emp) => this.convertEmployeeToDTO(emp)),
    };
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
    return this.convertEmployeeToDTO(employee);
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
    operation: 'set' | 'add' | 'subtract' = 'set',
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
        days:
          operation === 'set'
            ? days
            : operation === 'add'
              ? { increment: days }
              : { decrement: days },
        lastUpdated: new Date(),
      },
      create: {
        id: generateId(ID_PREFIXES.EMPLOYEELEAVEBALANCE),
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
    },
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return this.prisma.$transaction(async (prisma) => {
      await this.updateLeaveBalancesFromFrontendFormat(
        employeeId,
        leaveBalance,
      );

      // Return updated balances
      const updatedEmployee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { leaveBalances: true },
      });

      if (!updatedEmployee) {
        throw new Error(`Employee with ID ${employeeId} not found`);
      }

      return this.convertLeaveBalancesToFrontendFormat(
        updatedEmployee.leaveBalances,
      );
    });
  }

  /**
   * ADD LEAVE RECORD (with transaction for balance decrement)
   */
  async addLeaveRecord(
    employeeId: string,
    leaveData: {
      startDate: Date;
      endDate: Date;
      days?: number;
      leaveRecordType: LeaveType;
    },
  ): Promise<any> {
    const days =
      leaveData.days ||
      Math.ceil(
        (leaveData.endDate.getTime() - leaveData.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

    return this.prisma.$transaction(async (prisma) => {
      const leaveRecord = await prisma.employeeLeaveRecord.create({
        data: {
          id: generateId(ID_PREFIXES.EMPLOYEELEAVERECORD),
          ...leaveData,
          days,
          employeeId,
        },
      });

      // Update specific leave balance instead of general balance
      await this.updateLeaveBalance(
        employeeId,
        leaveData.leaveRecordType,
        days,
        'subtract',
      );

      return leaveRecord;
    });
  }

  /**
   * UPDATE employee
   */
  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    try {
      // Vérifier si l'email est en cours de modification et si il est déjà utilisé par un autre employé
      if (updateEmployeeDto.email) {
        const existingEmployee = await this.prisma.employee.findUnique({
          where: { email: updateEmployeeDto.email },
        });

        if (existingEmployee && existingEmployee.id !== id) {
          throw new ConflictException(
            `An employee with the email ${updateEmployeeDto.email} already exists.`,
          );
        }
      }

      const dataToUpdate: Prisma.EmployeeUpdateInput = {};

      // Filtrer les champs valides uniquement
      const validFields = [
        'lastName',
        'firstName',
        'address',
        'phone',
        'email',
        'nationality',
        'socialSecurityNumber',
        'department',
        'workLocation',
        'positions',
        'gender',
        'contractType',
        'status',
        'paymentMethod',
        'baseSalary',
        'bonus',
        'benefits',
        'lastSalaryAdjustmentDate',
        'bankName',
        'bankAccountNumber',
        'cnpsNumber',
        'categoryCodeCNPS',
        'taxIdNTif',
        'numberDependents',
        'situationMatrimony',
        'salaryInputMode',
        'targetNetSalary',
        'indemnities',
      ];

      // Resolve salary if in NET mode BEFORE copying fields
      const salaryResolution = this.resolveSalaryIfNetMode(updateEmployeeDto);

      // Copier uniquement les champs valides
      Object.keys(updateEmployeeDto).forEach((key) => {
        if (validFields.includes(key) && updateEmployeeDto[key] !== undefined) {
          if (key === 'baseSalary') {
            // Si en mode NET, utiliser la valeur résolue, sinon la valeur DTO
            dataToUpdate[key] =
              updateEmployeeDto.salaryInputMode === SalaryInputMode.NET
                ? salaryResolution.baseSalary
                : Number(updateEmployeeDto[key]);
          } else if (key === 'bonus') {
            // Convertir les nombres en type number si nécessaire
            dataToUpdate[key] = Number(updateEmployeeDto[key]);
          } else if (
            key === 'birthDate' ||
            key === 'hireDate' ||
            key === 'lastSalaryAdjustmentDate'
          ) {
            // Convertir les dates en objets Date
            if (updateEmployeeDto[key]) {
              dataToUpdate[key] = new Date(updateEmployeeDto[key]);
            }
          } else if (key === 'targetNetSalary') {
            // Convertir targetNetSalary en nombre si fourni en mode NET
            dataToUpdate[key] =
              updateEmployeeDto.salaryInputMode === SalaryInputMode.NET &&
              updateEmployeeDto[key]
                ? Number(updateEmployeeDto[key])
                : null;
          } else if (
            key === 'indemnities' &&
            Array.isArray(updateEmployeeDto[key])
          ) {
            // Convertir indemnities en JSON
            dataToUpdate[key] = JSON.parse(
              JSON.stringify(updateEmployeeDto[key]),
            );
          } else {
            dataToUpdate[key] = updateEmployeeDto[key];
          }
        }
      });

      // Handle relation: managerId
      if (updateEmployeeDto.managerId !== undefined) {
        if (updateEmployeeDto.managerId === null) {
          dataToUpdate.manager = { disconnect: true };
        } else {
          dataToUpdate.manager = {
            connect: { id: updateEmployeeDto.managerId },
          };
        }
      }

      await this.prisma.$transaction(async (prisma) => {
        // Update employee base data
        await prisma.employee.update({
          where: { id },
          data: dataToUpdate,
        });

        // Update leave balances if provided
        if (updateEmployeeDto.leaveBalance) {
          // Delete existing leave balances
          await prisma.employeeLeaveBalance.deleteMany({
            where: { employeeId: id },
          });

          // Create new leave balances
          const leaveTypeMapping = {
            annual: 'ANNUAL' as LeaveType,
            sick: 'SICK' as LeaveType,
            personal: 'PERSONAL' as LeaveType,
            maternity: 'MATERNITY' as LeaveType,
            paternity: 'PATERNITY' as LeaveType,
            other: 'OTHER' as LeaveType,
            unpaid: 'UNPAID' as LeaveType,
          };

          for (const [leaveKey, days] of Object.entries(
            updateEmployeeDto.leaveBalance,
          )) {
            const leaveType = leaveTypeMapping[leaveKey] || 'OTHER';
            await prisma.employeeLeaveBalance.create({
              data: {
                id: generateId(ID_PREFIXES.EMPLOYEELEAVEBALANCE),
                employeeId: id,
                leaveType,
                days: Number(days),
              },
            });
          }
        }

        // Update leave records if provided
        if (
          updateEmployeeDto.leaveRecords &&
          Array.isArray(updateEmployeeDto.leaveRecords)
        ) {
          // Clear existing records and create new ones
          await prisma.employeeLeaveRecord.deleteMany({
            where: { employeeId: id },
          });

          for (const record of updateEmployeeDto.leaveRecords) {
            await prisma.employeeLeaveRecord.create({
              data: {
                id: generateId(ID_PREFIXES.EMPLOYEELEAVERECORD),
                employeeId: id,
                leaveRecordType: record.leaveRecordType,
                startDate: new Date(record.startDate),
                endDate: new Date(record.endDate),
                days: record.days,
              },
            });
          }
        }

        // Update documents if provided
        // Handle both formats: frontend format { contract, idCard, workPermit, diplomas } and backend format [{ documentName, url, docType }]
        if (updateEmployeeDto.documents) {
          // Handle frontend format: { contract, idCard, workPermit, diplomas }
          const docsData = updateEmployeeDto.documents as any;

          // Build the expected documents map from the input
          const expectedDocs = new Map<string, { name: string; url: string }>();

          if (Array.isArray(docsData)) {
            // Handle backend format: array of { documentName, url, docType }
            for (const doc of docsData) {
              const key = `${doc.docType}_${doc.documentName}`;
              expectedDocs.set(key, { name: doc.documentName, url: doc.url });
            }
          } else {
            // Handle frontend format: { contract: { name, url }, idCard: { name, url }, workPermit: { name, url }, diplomas: [...] }
            if (docsData.contract) {
              expectedDocs.set('CONTRACT||contract', {
                name: docsData.contract.name,
                url: docsData.contract.url,
              });
            }
            if (docsData.idCard) {
              expectedDocs.set('ID_CARD||idCard', {
                name: docsData.idCard.name,
                url: docsData.idCard.url,
              });
            }
            if (docsData.workPermit) {
              expectedDocs.set('WORK_PERMIT||workPermit', {
                name: docsData.workPermit.name,
                url: docsData.workPermit.url,
              });
            }
            if (docsData.diplomas && Array.isArray(docsData.diplomas)) {
              docsData.diplomas.forEach((diploma: any, index: number) => {
                expectedDocs.set(`DIPLOMA||diploma_${index}`, {
                  name: diploma.name,
                  url: diploma.url,
                });
              });
            }
          }

          // Get existing documents
          const existingDocs = await prisma.employeeDocument.findMany({
            where: { employeeId: id },
          });

          // Delete documents that are not in the expected list
          for (const existingDoc of existingDocs) {
            const key = `${existingDoc.docType}||${existingDoc.documentName}`;
            if (!expectedDocs.has(key)) {
              await prisma.employeeDocument.delete({
                where: { id: existingDoc.id },
              });
            }
          }

          // Create or update documents
          for (const [key, docData] of expectedDocs.entries()) {
            const [docType, docName] = key.split('||');

            // Check if document already exists
            const existingDoc = existingDocs.find(
              (d) => d.docType === docType && d.documentName === docName,
            );

            if (existingDoc) {
              // Update existing document
              await prisma.employeeDocument.update({
                where: { id: existingDoc.id },
                data: {
                  url: docData.url,
                },
              });
            } else {
              // Create new document
              await prisma.employeeDocument.create({
                data: {
                  id: generateId(ID_PREFIXES.EMPLOYEEDOCUMENT),
                  employeeId: id,
                  documentName: docData.name,
                  url: docData.url,
                  docType: docType as DocumentType,
                },
              });
            }
          }
        }
      });

      this.logger.log(`Employee ${id} updated successfully`);

      // Fetch full employee with all relations for response
      return this.findOne(id, true);
    } catch (error) {
      this.logger.error(
        `Failed to update employee ${id}: ${error.message}`,
        error.stack,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Employee with ID ${id} not found`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Foreign key constraint failed. Ensure manager (if provided) exists.`,
          );
        }
        if (error.code === 'P2000' && error.message.includes('birthDate')) {
          throw new BadRequestException(
            'Invalid birthDate format. Expected a valid date string (e.g., YYYY-MM-DD).',
          );
        }
        if (error.code === 'P2000' && error.message.includes('hireDate')) {
          throw new BadRequestException(
            'Invalid hireDate format. Expected a valid date string (e.g., YYYY-MM-DD).',
          );
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
      return this.convertEmployeeToDTO(employee);
    } catch (error) {
      this.logger.error(
        `Failed to delete employee ${id}: ${error.message}`,
        error.stack,
      );
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
      data: {
        id: generateId(ID_PREFIXES.EMPLOYEEDOCUMENT),
        employeeId,
        documentName,
        url,
        docType,
      },
      include: { employee: true },
    });
  }

  /**
   * ADD POSITION HISTORY
   */
  async addPositionHistory(
    employeeId: string,
    positionData: {
      employeePosition: string;
      department?: string;
      startDate: Date;
      endDate?: Date;
    },
  ): Promise<any> {
    return this.prisma.employeePositionHistory.create({
      data: {
        id: generateId(ID_PREFIXES.EMPLOYEEPOSITIONHISTORY),
        ...positionData,
        employeeId,
      },
    });
  }

  /**
   * ADD TRAINING
   */
  async addTraining(
    employeeId: string,
    trainingData: {
      trainingName: string;
      trainingDate: Date;
      provider?: string;
    },
  ): Promise<any> {
    return this.prisma.employeeTraining.create({
      data: {
        id: generateId(ID_PREFIXES.EMPLOYEETRAINING),
        ...trainingData,
        employeeId,
      },
    });
  }

  /**
   * ADD PERFORMANCE REVIEW
   */
  async addPerformanceReview(
    employeeId: string,
    reviewData: {
      reviewDate: Date;
      reviewer?: string;
      rating?: number;
      reviewComments?: string;
    },
  ): Promise<any> {
    return this.prisma.employeePerformanceReview.create({
      data: {
        id: generateId(ID_PREFIXES.EMPLOYEEPERFORMANCEREVIEW),
        ...reviewData,
        employeeId,
      },
    });
  }
}
