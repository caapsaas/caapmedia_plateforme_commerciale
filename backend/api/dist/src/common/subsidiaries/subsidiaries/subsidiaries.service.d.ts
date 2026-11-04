import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
import { FileUploadService } from '../../utils/file-upload.service';
import { UserRole } from '@prisma/client';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';
export declare class SubsidiaryService {
    private readonly prisma;
    private readonly logger;
    private readonly fileUploadService;
    constructor(prisma: PrismaService, logger: LoggerService, fileUploadService: FileUploadService);
    private hasAdminPrivileges;
    private hasSuperAdminPrivileges;
    createSubsidiary(data: {
        subsidiaryName: string;
        logoSvg?: string;
        address: string;
        phone: string;
        email: string;
        ifu: string;
        rccm: string;
        bankName: string;
        accountNumber: string;
        swiftCode: string;
        shareCapital: number;
        taxRate?: number;
        isHeadquarter?: boolean;
    }, currentUser: {
        id: string;
        role?: UserRole;
        roles?: UserRole[];
        subsidiaryId: string;
    }): Promise<{
        id: string;
        subsidiaryName: string;
        name: string;
        logoSvg: string;
        email: string;
        address: string;
        phone: string;
        ifu: string;
        rccm: string;
        bankName: string;
        accountNumber: string;
        swiftCode: string;
        shareCapital: number;
        taxRate: number;
        isHeadquarter: boolean;
    }>;
    updateSubsidiary(id: string, data: {
        subsidiaryName?: string;
        logoSvg?: string;
        address?: string;
        phone?: string;
        email?: string;
        ifu?: string;
        rccm?: string;
        bankName?: string;
        accountNumber?: string;
        swiftCode?: string;
        shareCapital?: number;
        taxRate?: number;
        isHeadquarter?: boolean;
    }, currentUser: {
        id: string;
        role?: UserRole;
        roles?: UserRole[];
        subsidiaryId: string;
    }): Promise<{
        id: string;
        subsidiaryName: string;
        name: string;
        logoSvg: string;
        email: string;
        address: string;
        phone: string;
        ifu: string;
        rccm: string;
        bankName: string;
        accountNumber: string;
        swiftCode: string;
        shareCapital: number;
        taxRate: number;
        isHeadquarter: boolean;
    }>;
    uploadLogo(id: string, file: Express.Multer.File, currentUser: {
        id: string;
        role?: UserRole;
        roles?: UserRole[];
        subsidiaryId: string;
    }): Promise<{
        id: string;
        subsidiaryName: string;
        name: string;
        logoSvg: string;
    }>;
    deleteSubsidiary(id: string, currentUser: {
        id: string;
        role?: UserRole;
        roles?: UserRole[];
        subsidiaryId: string;
    }): Promise<{
        message: string;
    }>;
    getAllSubsidiaries(currentUser: {
        id: string;
        role?: UserRole;
        roles?: UserRole[];
        subsidiaryId: string;
    }, paginationQuery?: PaginationQueryDto): Promise<{
        data: {
            id: string;
            subsidiaryName: string;
            name: string;
            logoSvg: string;
            email: string;
            address: string;
            phone: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: number;
            taxRate: number;
            isHeadquarter: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    searchSubsidiaries(query: {
        subsidiaryName?: string;
        email?: string;
    } & PaginationQueryDto, currentUser: {
        id: string;
        role?: UserRole;
        roles?: UserRole[];
        subsidiaryId: string;
    }): Promise<{
        data: {
            id: string;
            subsidiaryName: string;
            name: string;
            logoSvg: string;
            email: string;
            address: string;
            phone: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: number;
            taxRate: number;
            isHeadquarter: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
}
