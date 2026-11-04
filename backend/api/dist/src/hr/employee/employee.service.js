"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmployeeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const cameroonpayrollcalculator_service_1 = require("../payrollrecord/cameroonpayrollcalculator.service");
let EmployeeService = EmployeeService_1 = class EmployeeService {
    prisma;
    payrollCalculator;
    logger = new common_1.Logger(EmployeeService_1.name);
    constructor(prisma, payrollCalculator) {
        this.prisma = prisma;
        this.payrollCalculator = payrollCalculator;
    }
    calculateTotalIndemnities(indemnities) {
        if (!Array.isArray(indemnities) || indemnities.length === 0) {
            return 0;
        }
        return indemnities.reduce((sum, ind) => sum + (Number(ind.amount) || 0), 0);
    }
    resolveSalaryIfNetMode(dto) {
        if (dto.salaryInputMode === client_1.SalaryInputMode.NET &&
            dto.targetNetSalary != null) {
            this.logger.log(`Calcul du salaire de base pour net cible: ${dto.targetNetSalary} FCFA`);
            const result = this.payrollCalculator.calculateFromNetSalary({
                targetNetSalary: dto.targetNetSalary,
                bonus: dto.bonus ?? 0,
                riskGroup: 'A',
                applyCfc: true,
                applyFne: true,
            });
            return {
                baseSalary: result.baseSalary,
                salaryInputMode: client_1.SalaryInputMode.NET,
                targetNetSalary: dto.targetNetSalary,
            };
        }
        return {
            baseSalary: dto.baseSalary ?? 0,
            salaryInputMode: dto.salaryInputMode ?? client_1.SalaryInputMode.BASE,
            targetNetSalary: undefined,
        };
    }
    convertEmployeeToDTO(employee) {
        if (!employee)
            return employee;
        const dto = {
            ...employee,
            baseSalary: employee.baseSalary ? Number(employee.baseSalary) : 0,
            bonus: employee.bonus ? Number(employee.bonus) : 0,
            leaveBalance: employee.leaveBalance ? Number(employee.leaveBalance) : 0,
        };
        if (employee.documents && Array.isArray(employee.documents)) {
            dto.documents = this.convertDocumentsToFrontendFormat(employee.documents);
        }
        if (employee.leaveBalances && Array.isArray(employee.leaveBalances)) {
            dto.leaveBalance = this.convertLeaveBalancesToFrontendFormat(employee.leaveBalances);
        }
        return dto;
    }
    convertLeaveBalancesToFrontendFormat(leaveBalances) {
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
    convertDocumentsToFrontendFormat(documents) {
        const result = {
            contract: null,
            idCard: null,
            workPermit: null,
            diplomas: [],
        };
        if (!documents || !Array.isArray(documents)) {
            return result;
        }
        documents.forEach((doc) => {
            const docType = doc.docType || doc.documentType;
            if (!docType)
                return;
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
    async create(createEmployeeDto, subsidiaryId, employeeId) {
        this.logger.log(`Attempting to create employee for subsidiary ${subsidiaryId}`);
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id: subsidiaryId },
        });
        if (!subsidiary) {
            throw new common_1.BadRequestException(`Subsidiary with ID ${subsidiaryId} not found.`);
        }
        this.logger.log(`Checking email existence for: ${createEmployeeDto.email}`);
        const existingEmployee = await this.prisma.employee.findUnique({
            where: { email: createEmployeeDto.email },
        });
        this.logger.log(`Existing employee found: ${JSON.stringify(existingEmployee)}`);
        if (existingEmployee &&
            (!employeeId || existingEmployee.id !== employeeId)) {
            this.logger.warn(`Email conflict detected for email: ${createEmployeeDto.email}`);
            throw new common_1.ConflictException(`An employee with the email ${createEmployeeDto.email} already exists.`);
        }
        try {
            const salaryResolution = this.resolveSalaryIfNetMode(createEmployeeDto);
            const employee = await this.prisma.$transaction(async (prisma) => {
                const newEmployee = await prisma.employee.create({
                    data: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEE),
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
                        numberDependents: createEmployeeDto.numberDependents || 0,
                        situationMatrimony: createEmployeeDto.situationMatrimony || 'SINGLE',
                        bankAccountNumber: createEmployeeDto.bankAccountNumber,
                        salaryInputMode: salaryResolution.salaryInputMode,
                        targetNetSalary: salaryResolution.targetNetSalary,
                        indemnities: createEmployeeDto.indemnities
                            ? JSON.parse(JSON.stringify(createEmployeeDto.indemnities))
                            : null,
                    },
                    include: {
                        manager: true,
                        subsidiary: true,
                    },
                });
                const leaveTypes = [
                    'ANNUAL',
                    'SICK',
                    'PERSONAL',
                    'MATERNITY',
                    'PATERNITY',
                    'OTHER',
                    'UNPAID',
                ];
                for (const leaveType of leaveTypes) {
                    const balanceKey = leaveType.toLowerCase();
                    const days = createEmployeeDto.leaveBalance?.[balanceKey] || 0;
                    await prisma.employeeLeaveBalance.create({
                        data: {
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEELEAVEBALANCE),
                            employeeId: newEmployee.id,
                            leaveType,
                            days: days,
                        },
                    });
                }
                for (const record of createEmployeeDto.leaveRecords || []) {
                    if (!Number.isFinite(record.startDate.getTime()) ||
                        !Number.isFinite(record.endDate.getTime()) ||
                        record.startDate > record.endDate ||
                        !Number.isInteger(record.days) ||
                        record.days < 1) {
                        throw new common_1.BadRequestException('Enregistrement de congé invalide.');
                    }
                    await prisma.employeeLeaveRecord.create({
                        data: {
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEELEAVERECORD),
                            employeeId: newEmployee.id,
                            leaveRecordType: record.leaveRecordType,
                            startDate: record.startDate,
                            endDate: record.endDate,
                            days: record.days,
                        },
                    });
                }
                if (createEmployeeDto.documents) {
                    const docsData = createEmployeeDto.documents;
                    if (docsData.contract) {
                        await prisma.employeeDocument.create({
                            data: {
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEEDOCUMENT),
                                employeeId: newEmployee.id,
                                documentName: docsData.contract.name || 'Contract',
                                url: docsData.contract.url,
                                docType: 'CONTRACT',
                            },
                        });
                    }
                    if (docsData.idCard) {
                        await prisma.employeeDocument.create({
                            data: {
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEEDOCUMENT),
                                employeeId: newEmployee.id,
                                documentName: docsData.idCard.name || 'ID Card',
                                url: docsData.idCard.url,
                                docType: 'ID_CARD',
                            },
                        });
                    }
                    if (docsData.workPermit) {
                        await prisma.employeeDocument.create({
                            data: {
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEEDOCUMENT),
                                employeeId: newEmployee.id,
                                documentName: docsData.workPermit.name || 'Work Permit',
                                url: docsData.workPermit.url,
                                docType: 'WORK_PERMIT',
                            },
                        });
                    }
                    if (docsData.diplomas && Array.isArray(docsData.diplomas)) {
                        for (const diploma of docsData.diplomas) {
                            await prisma.employeeDocument.create({
                                data: {
                                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEEDOCUMENT),
                                    employeeId: newEmployee.id,
                                    documentName: diploma.name || 'Diploma',
                                    url: diploma.url,
                                    docType: 'DIPLOMA',
                                },
                            });
                        }
                    }
                }
                return newEmployee;
            });
            this.logger.log(`Employee created with ID: ${employee.id}`);
            return this.convertEmployeeToDTO(employee);
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Failed to create employee: ${error.message}`, error.stack);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new common_1.ConflictException(`An employee with this email already exists.`);
                }
                if (error.code === 'P2003') {
                    throw new common_1.BadRequestException(`Foreign key constraint failed. Ensure subsidiary and manager (if provided) exist.`);
                }
                if (error.code === 'P2000' && error.message.includes('birthDate')) {
                    throw new common_1.BadRequestException('Invalid birthDate format. Expected a valid date string (e.g., YYYY-MM-DD).');
                }
                if (error.code === 'P2000' && error.message.includes('hireDate')) {
                    throw new common_1.BadRequestException('Invalid hireDate format. Expected a valid date string (e.g., YYYY-MM-DD).');
                }
            }
            throw new common_1.InternalServerErrorException('Could not create employee.');
        }
    }
    async findAll(subsidiaryId, includeRelations = false, paginationQuery = {}) {
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
        const where = subsidiaryId
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
        const result = await (0, pagination_1.paginate)(this.prisma.employee, { where, include, orderBy: { lastName: 'asc' } }, paginationQuery);
        return {
            ...result,
            data: result.data.map((emp) => this.convertEmployeeToDTO(emp)),
        };
    }
    async findOne(id, includeRelations = false) {
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
            throw new common_1.NotFoundException(`Employee with ID ${id} not found`);
        }
        return this.convertEmployeeToDTO(employee);
    }
    async getLeaveBalances(employeeId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            include: { leaveBalances: true },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with ID ${employeeId} not found`);
        }
        return this.convertLeaveBalancesToFrontendFormat(employee.leaveBalances);
    }
    async updateLeaveBalance(employeeId, leaveType, days, operation = 'set') {
        if (!Number.isInteger(days) || days < 0) {
            throw new common_1.BadRequestException('Le nombre de jours doit être un entier positif ou nul.');
        }
        if (!['set', 'add', 'subtract'].includes(operation)) {
            throw new common_1.BadRequestException('Opération de solde de congé invalide.');
        }
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with ID ${employeeId} not found`);
        }
        if (operation === 'subtract') {
            const updated = await this.prisma.employeeLeaveBalance.updateMany({
                where: {
                    employeeId,
                    leaveType,
                    days: { gte: days },
                },
                data: { days: { decrement: days }, lastUpdated: new Date() },
            });
            if (updated.count === 0) {
                throw new common_1.BadRequestException('Le solde de congés est insuffisant.');
            }
            return this.prisma.employeeLeaveBalance.findUnique({
                where: { employeeId_leaveType: { employeeId, leaveType } },
            });
        }
        return this.prisma.employeeLeaveBalance.upsert({
            where: {
                employeeId_leaveType: {
                    employeeId,
                    leaveType,
                },
            },
            update: {
                days: operation === 'set'
                    ? days
                    : operation === 'add'
                        ? { increment: days }
                        : { decrement: days },
                lastUpdated: new Date(),
            },
            create: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEELEAVEBALANCE),
                employeeId,
                leaveType,
                days: days,
            },
        });
    }
    async updateAllLeaveBalances(employeeId, leaveBalance) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with ID ${employeeId} not found`);
        }
        return this.prisma.$transaction(async (prisma) => {
            const leaveTypes = [
                ['annual', 'ANNUAL'],
                ['sick', 'SICK'],
                ['personal', 'PERSONAL'],
                ['maternity', 'MATERNITY'],
                ['paternity', 'PATERNITY'],
                ['other', 'OTHER'],
                ['unpaid', 'UNPAID'],
            ];
            for (const [key, leaveType] of leaveTypes) {
                const days = leaveBalance[key] ?? 0;
                if (!Number.isInteger(days) || days < 0) {
                    throw new common_1.BadRequestException('Les soldes de congés doivent être des entiers positifs ou nuls.');
                }
                await prisma.employeeLeaveBalance.upsert({
                    where: { employeeId_leaveType: { employeeId, leaveType } },
                    update: { days, lastUpdated: new Date() },
                    create: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEELEAVEBALANCE),
                        employeeId,
                        leaveType,
                        days,
                    },
                });
            }
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
    async addLeaveRecord(employeeId, leaveData) {
        const days = leaveData.days;
        if (!Number.isFinite(leaveData.startDate.getTime()) ||
            !Number.isFinite(leaveData.endDate.getTime()) ||
            leaveData.startDate > leaveData.endDate) {
            throw new common_1.BadRequestException('Les dates de congé sont invalides.');
        }
        if (!Number.isInteger(days) || days < 1) {
            throw new common_1.BadRequestException('La durée doit être un nombre entier de jours ouvrables.');
        }
        return this.prisma.$transaction(async (prisma) => {
            const balanceUpdate = await prisma.employeeLeaveBalance.updateMany({
                where: {
                    employeeId,
                    leaveType: leaveData.leaveRecordType,
                    days: { gte: days },
                },
                data: { days: { decrement: days }, lastUpdated: new Date() },
            });
            if (balanceUpdate.count === 0) {
                throw new common_1.BadRequestException('Le solde de congés est insuffisant.');
            }
            const leaveRecord = await prisma.employeeLeaveRecord.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEELEAVERECORD),
                    ...leaveData,
                    days,
                    employeeId,
                },
            });
            return leaveRecord;
        });
    }
    async update(id, updateEmployeeDto) {
        try {
            if (updateEmployeeDto.email) {
                const existingEmployee = await this.prisma.employee.findUnique({
                    where: { email: updateEmployeeDto.email },
                });
                if (existingEmployee && existingEmployee.id !== id) {
                    throw new common_1.ConflictException(`An employee with the email ${updateEmployeeDto.email} already exists.`);
                }
            }
            const dataToUpdate = {};
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
            const salaryResolution = this.resolveSalaryIfNetMode(updateEmployeeDto);
            Object.keys(updateEmployeeDto).forEach((key) => {
                if (validFields.includes(key) && updateEmployeeDto[key] !== undefined) {
                    if (key === 'baseSalary') {
                        dataToUpdate[key] =
                            updateEmployeeDto.salaryInputMode === client_1.SalaryInputMode.NET
                                ? salaryResolution.baseSalary
                                : Number(updateEmployeeDto[key]);
                    }
                    else if (key === 'bonus') {
                        dataToUpdate[key] = Number(updateEmployeeDto[key]);
                    }
                    else if (key === 'birthDate' ||
                        key === 'hireDate' ||
                        key === 'lastSalaryAdjustmentDate') {
                        if (updateEmployeeDto[key]) {
                            dataToUpdate[key] = new Date(updateEmployeeDto[key]);
                        }
                    }
                    else if (key === 'targetNetSalary') {
                        dataToUpdate[key] =
                            updateEmployeeDto.salaryInputMode === client_1.SalaryInputMode.NET &&
                                updateEmployeeDto[key]
                                ? Number(updateEmployeeDto[key])
                                : null;
                    }
                    else if (key === 'indemnities' &&
                        Array.isArray(updateEmployeeDto[key])) {
                        dataToUpdate[key] = JSON.parse(JSON.stringify(updateEmployeeDto[key]));
                    }
                    else {
                        dataToUpdate[key] = updateEmployeeDto[key];
                    }
                }
            });
            if (updateEmployeeDto.managerId !== undefined) {
                if (updateEmployeeDto.managerId === null) {
                    dataToUpdate.manager = { disconnect: true };
                }
                else {
                    dataToUpdate.manager = {
                        connect: { id: updateEmployeeDto.managerId },
                    };
                }
            }
            await this.prisma.$transaction(async (prisma) => {
                await prisma.employee.update({
                    where: { id },
                    data: dataToUpdate,
                });
                if (updateEmployeeDto.leaveBalance) {
                    await prisma.employeeLeaveBalance.deleteMany({
                        where: { employeeId: id },
                    });
                    const leaveTypeMapping = {
                        annual: 'ANNUAL',
                        sick: 'SICK',
                        personal: 'PERSONAL',
                        maternity: 'MATERNITY',
                        paternity: 'PATERNITY',
                        other: 'OTHER',
                        unpaid: 'UNPAID',
                    };
                    for (const [leaveKey, days] of Object.entries(updateEmployeeDto.leaveBalance)) {
                        const leaveType = leaveTypeMapping[leaveKey] || 'OTHER';
                        await prisma.employeeLeaveBalance.create({
                            data: {
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEELEAVEBALANCE),
                                employeeId: id,
                                leaveType,
                                days: Number(days),
                            },
                        });
                    }
                }
                if (updateEmployeeDto.leaveRecords &&
                    Array.isArray(updateEmployeeDto.leaveRecords)) {
                    await prisma.employeeLeaveRecord.deleteMany({
                        where: { employeeId: id },
                    });
                    for (const record of updateEmployeeDto.leaveRecords) {
                        await prisma.employeeLeaveRecord.create({
                            data: {
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEELEAVERECORD),
                                employeeId: id,
                                leaveRecordType: record.leaveRecordType,
                                startDate: new Date(record.startDate),
                                endDate: new Date(record.endDate),
                                days: record.days,
                            },
                        });
                    }
                }
                if (updateEmployeeDto.documents) {
                    const docsData = updateEmployeeDto.documents;
                    const expectedDocs = new Map();
                    if (Array.isArray(docsData)) {
                        for (const doc of docsData) {
                            const key = `${doc.docType}_${doc.documentName}`;
                            expectedDocs.set(key, { name: doc.documentName, url: doc.url });
                        }
                    }
                    else {
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
                            docsData.diplomas.forEach((diploma, index) => {
                                expectedDocs.set(`DIPLOMA||diploma_${index}`, {
                                    name: diploma.name,
                                    url: diploma.url,
                                });
                            });
                        }
                    }
                    const existingDocs = await prisma.employeeDocument.findMany({
                        where: { employeeId: id },
                    });
                    for (const existingDoc of existingDocs) {
                        const key = `${existingDoc.docType}||${existingDoc.documentName}`;
                        if (!expectedDocs.has(key)) {
                            await prisma.employeeDocument.delete({
                                where: { id: existingDoc.id },
                            });
                        }
                    }
                    for (const [key, docData] of expectedDocs.entries()) {
                        const [docType, docName] = key.split('||');
                        const existingDoc = existingDocs.find((d) => d.docType === docType && d.documentName === docName);
                        if (existingDoc) {
                            await prisma.employeeDocument.update({
                                where: { id: existingDoc.id },
                                data: {
                                    url: docData.url,
                                },
                            });
                        }
                        else {
                            await prisma.employeeDocument.create({
                                data: {
                                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEEDOCUMENT),
                                    employeeId: id,
                                    documentName: docData.name,
                                    url: docData.url,
                                    docType: docType,
                                },
                            });
                        }
                    }
                }
            });
            this.logger.log(`Employee ${id} updated successfully`);
            return this.findOne(id, true);
        }
        catch (error) {
            this.logger.error(`Failed to update employee ${id}: ${error.message}`, error.stack);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new common_1.NotFoundException(`Employee with ID ${id} not found`);
                }
                if (error.code === 'P2003') {
                    throw new common_1.BadRequestException(`Foreign key constraint failed. Ensure manager (if provided) exists.`);
                }
                if (error.code === 'P2000' && error.message.includes('birthDate')) {
                    throw new common_1.BadRequestException('Invalid birthDate format. Expected a valid date string (e.g., YYYY-MM-DD).');
                }
                if (error.code === 'P2000' && error.message.includes('hireDate')) {
                    throw new common_1.BadRequestException('Invalid hireDate format. Expected a valid date string (e.g., YYYY-MM-DD).');
                }
            }
            throw new common_1.InternalServerErrorException(`Could not update employee ${id}`);
        }
    }
    async remove(id) {
        try {
            const employee = await this.prisma.employee.delete({
                where: { id },
            });
            this.logger.log(`Employee ${id} deleted successfully`);
            return this.convertEmployeeToDTO(employee);
        }
        catch (error) {
            this.logger.error(`Failed to delete employee ${id}: ${error.message}`, error.stack);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new common_1.NotFoundException(`Employee with ID ${id} not found`);
                }
                if (error.code === 'P2003') {
                    throw new common_1.BadRequestException(`Cannot delete employee ${id} because of related records (foreign key constraint).`);
                }
            }
            throw new common_1.InternalServerErrorException(`Could not delete employee ${id}`);
        }
    }
    async addDocument(employeeId, documentName, url, docType) {
        return this.prisma.employeeDocument.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEEDOCUMENT),
                employeeId,
                documentName,
                url,
                docType,
            },
            include: { employee: true },
        });
    }
    async addPositionHistory(employeeId, positionData) {
        return this.prisma.employeePositionHistory.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEEPOSITIONHISTORY),
                ...positionData,
                employeeId,
            },
        });
    }
    async addTraining(employeeId, trainingData) {
        return this.prisma.employeeTraining.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEETRAINING),
                ...trainingData,
                employeeId,
            },
        });
    }
    async addPerformanceReview(employeeId, reviewData) {
        return this.prisma.employeePerformanceReview.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEEPERFORMANCEREVIEW),
                ...reviewData,
                employeeId,
            },
        });
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = EmployeeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cameroonpayrollcalculator_service_1.CameroonPayrollCalculatorService])
], EmployeeService);
//# sourceMappingURL=employee.service.js.map