import { PrismaService } from '../../src/common/utils/prisma/prisma.service';
import { LoggerService } from '../../src/common/utils/logger/logger.service';
import { EmailService } from '../common/utils/email/email.service';
import { UserRole, DocumentCategory, DocumentStatus, SecretariatTaskStatus, Prisma } from '@prisma/client';
import { CreateCompanyDocumentDto } from './dto/create-company-document.dto';
import { CreateSecretariatTaskDto, UpdateSecretariatTaskDto } from './dto/task.dto';
import { PaginationQueryDto } from '../common/pagination/dto/pagination-query.dto';
import { SubsidiaryScopeContext } from '../common/utils/subsidiary-scope';
export declare class SecretariatService {
    private readonly prisma;
    private readonly logger;
    private readonly emailService;
    constructor(prisma: PrismaService, logger: LoggerService, emailService: EmailService);
    private formatTaskDate;
    private formatTasksInResult;
    createCompanyDocument(dto: CreateCompanyDocumentDto, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }, file: Express.Multer.File): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.DocumentStatus;
        category: import("@prisma/client").$Enums.DocumentCategory;
        updatedAt: Date | null;
        createdAt: Date;
        createdBy: string | null;
        documentName: string;
        fileUrl: string;
    }>;
    updateCompanyDocument(id: string, dto: {
        documentName?: string;
        category?: DocumentCategory;
        status?: DocumentStatus;
    }, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }, file?: Express.Multer.File): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.DocumentStatus;
        category: import("@prisma/client").$Enums.DocumentCategory;
        updatedAt: Date | null;
        createdAt: Date;
        createdBy: string | null;
        documentName: string;
        fileUrl: string;
    }>;
    deleteCompanyDocument(id: string, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        message: string;
    }>;
    getAllCompanyDocuments(ctx: SubsidiaryScopeContext, paginationQuery?: PaginationQueryDto): Promise<import("../common/pagination/pagination").PaginatedResult<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.DocumentStatus;
        category: import("@prisma/client").$Enums.DocumentCategory;
        updatedAt: Date | null;
        createdAt: Date;
        createdBy: string | null;
        documentName: string;
        fileUrl: string;
    }>>;
    archiveCompanyDocument(id: string, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.DocumentStatus;
        category: import("@prisma/client").$Enums.DocumentCategory;
        updatedAt: Date | null;
        createdAt: Date;
        createdBy: string | null;
        documentName: string;
        fileUrl: string;
    }>;
    searchCompanyDocuments(query: {
        documentName?: string;
        category?: DocumentCategory;
        status?: DocumentStatus;
        includeArchived?: boolean;
    } & PaginationQueryDto, ctx: SubsidiaryScopeContext): Promise<import("../common/pagination/pagination").PaginatedResult<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.DocumentStatus;
        category: import("@prisma/client").$Enums.DocumentCategory;
        updatedAt: Date | null;
        createdAt: Date;
        createdBy: string | null;
        documentName: string;
        fileUrl: string;
    }>>;
    createMeeting(data: {
        title: string;
        meetingDateTime: Date;
        meetingLocation?: string;
        agenda?: string;
        subsidiaryId?: string;
        participantIds?: string[];
    }, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        title: string;
        id: string;
        subsidiaryId: string;
        updatedAt: Date;
        createdAt: Date;
        meetingDateTime: Date;
        meetingLocation: string | null;
        agenda: string | null;
        minutes: string | null;
        minutesUpdatedBy: string | null;
        minutesUpdatedAt: Date | null;
        completedAt: Date | null;
        minutesFileUrl: string | null;
        minutesFileName: string | null;
        createdBy: string | null;
    }>;
    private sendMeetingInvitations;
    updateMeeting(id: string, data: {
        title?: string;
        meetingDateTime?: Date;
        meetingLocation?: string;
        agenda?: string;
        minutes?: string;
        participantIds?: string[];
    }, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        title: string;
        id: string;
        subsidiaryId: string;
        updatedAt: Date;
        createdAt: Date;
        meetingDateTime: Date;
        meetingLocation: string | null;
        agenda: string | null;
        minutes: string | null;
        minutesUpdatedBy: string | null;
        minutesUpdatedAt: Date | null;
        completedAt: Date | null;
        minutesFileUrl: string | null;
        minutesFileName: string | null;
        createdBy: string | null;
    }>;
    deleteMeeting(id: string, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        message: string;
    }>;
    getAllMeetings(ctx: SubsidiaryScopeContext, paginationQuery?: PaginationQueryDto): Promise<import("../common/pagination/pagination").PaginatedResult<{
        title: string;
        id: string;
        subsidiaryId: string;
        updatedAt: Date;
        createdAt: Date;
        meetingDateTime: Date;
        meetingLocation: string | null;
        agenda: string | null;
        minutes: string | null;
        minutesUpdatedBy: string | null;
        minutesUpdatedAt: Date | null;
        completedAt: Date | null;
        minutesFileUrl: string | null;
        minutesFileName: string | null;
        createdBy: string | null;
    }>>;
    searchMeetings(query: {
        title?: string;
        meetingDateTime?: Date;
    } & PaginationQueryDto, ctx: SubsidiaryScopeContext): Promise<import("../common/pagination/pagination").PaginatedResult<{
        title: string;
        id: string;
        subsidiaryId: string;
        updatedAt: Date;
        createdAt: Date;
        meetingDateTime: Date;
        meetingLocation: string | null;
        agenda: string | null;
        minutes: string | null;
        minutesUpdatedBy: string | null;
        minutesUpdatedAt: Date | null;
        completedAt: Date | null;
        minutesFileUrl: string | null;
        minutesFileName: string | null;
        createdBy: string | null;
    }>>;
    addParticipantToMeeting(meetingId: string, employeeId: string, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        employee: {
            id: string;
            address: string;
            phone: string;
            email: string;
            bankName: string | null;
            subsidiaryId: string;
            lastName: string;
            firstName: string;
            birthDate: Date;
            nationality: string;
            socialSecurityNumber: string;
            positions: string;
            department: string;
            hireDate: Date;
            workLocation: string;
            baseSalary: Prisma.Decimal;
            bonus: Prisma.Decimal;
            benefits: string[];
            lastSalaryAdjustmentDate: Date | null;
            leaveBalance: Prisma.Decimal | null;
            salaryInputMode: import("@prisma/client").$Enums.SalaryInputMode;
            targetNetSalary: Prisma.Decimal | null;
            bankAccountNumber: string | null;
            indemnities: Prisma.JsonValue | null;
            numberDependents: number;
            situationMatrimony: string;
            cnpsNumber: string | null;
            cnpsNumberEncrypted: string | null;
            categoryCodeCNPS: string;
            taxIdNTif: string | null;
            managerId: string | null;
            gender: import("@prisma/client").$Enums.Gender;
            contractType: import("@prisma/client").$Enums.ContractType;
            status: import("@prisma/client").$Enums.EmployeeStatus;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        };
        meeting: {
            title: string;
            id: string;
            subsidiaryId: string;
            updatedAt: Date;
            createdAt: Date;
            meetingDateTime: Date;
            meetingLocation: string | null;
            agenda: string | null;
            minutes: string | null;
            minutesUpdatedBy: string | null;
            minutesUpdatedAt: Date | null;
            completedAt: Date | null;
            minutesFileUrl: string | null;
            minutesFileName: string | null;
            createdBy: string | null;
        };
    } & {
        employeeId: string;
        meetingId: string;
    }>;
    removeParticipantFromMeeting(meetingId: string, employeeId: string, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        message: string;
    }>;
    createSecretariatTask(dto: CreateSecretariatTaskDto, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
        creator: {
            id: string;
            userName: string;
        };
        assignedTo: {
            id: string;
            address: string;
            phone: string;
            email: string;
            bankName: string | null;
            subsidiaryId: string;
            lastName: string;
            firstName: string;
            birthDate: Date;
            nationality: string;
            socialSecurityNumber: string;
            positions: string;
            department: string;
            hireDate: Date;
            workLocation: string;
            baseSalary: Prisma.Decimal;
            bonus: Prisma.Decimal;
            benefits: string[];
            lastSalaryAdjustmentDate: Date | null;
            leaveBalance: Prisma.Decimal | null;
            salaryInputMode: import("@prisma/client").$Enums.SalaryInputMode;
            targetNetSalary: Prisma.Decimal | null;
            bankAccountNumber: string | null;
            indemnities: Prisma.JsonValue | null;
            numberDependents: number;
            situationMatrimony: string;
            cnpsNumber: string | null;
            cnpsNumberEncrypted: string | null;
            categoryCodeCNPS: string;
            taxIdNTif: string | null;
            managerId: string | null;
            gender: import("@prisma/client").$Enums.Gender;
            contractType: import("@prisma/client").$Enums.ContractType;
            status: import("@prisma/client").$Enums.EmployeeStatus;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        };
    } & {
        description: string;
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.SecretariatTaskStatus;
        updatedAt: Date;
        dueDate: Date;
        createdAt: Date;
        createdBy: string | null;
        assignedToId: string | null;
    }>;
    updateSecretariatTask(id: string, dto: UpdateSecretariatTaskDto, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        description: string;
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.SecretariatTaskStatus;
        updatedAt: Date;
        dueDate: Date;
        createdAt: Date;
        createdBy: string | null;
        assignedToId: string | null;
    }>;
    deleteSecretariatTask(id: string, currentUser: {
        id: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        message: string;
    }>;
    getAllSecretariatTasks(ctx: SubsidiaryScopeContext, paginationQuery?: PaginationQueryDto): Promise<any>;
    searchSecretariatTasks(query: {
        title?: string;
        status?: SecretariatTaskStatus;
        dueDate?: string;
    } & PaginationQueryDto, ctx: SubsidiaryScopeContext): Promise<any>;
}
