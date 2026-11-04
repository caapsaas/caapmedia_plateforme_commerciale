import { SubsidiaryService } from '../subsidiaries/subsidiaries.service';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';
declare class CreateSubsidiaryDto {
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
}
declare class UpdateSubsidiaryDto {
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
}
declare class SearchSubsidiariesDto extends PaginationQueryDto {
    subsidiaryName?: string;
    email?: string;
}
export declare class SubsidiaryController {
    private subsidiaryService;
    constructor(subsidiaryService: SubsidiaryService);
    createSubsidiary(dto: CreateSubsidiaryDto, req: any): Promise<{
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
    updateSubsidiary(id: string, dto: UpdateSubsidiaryDto, req: any): Promise<{
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
    uploadLogo(id: string, file: Express.Multer.File, req: any): Promise<{
        id: string;
        subsidiaryName: string;
        name: string;
        logoSvg: string;
    }>;
    deleteSubsidiary(id: string, req: any): Promise<{
        message: string;
    }>;
    getAllSubsidiaries(req: any, paginationQuery: PaginationQueryDto): Promise<{
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
    searchSubsidiaries(query: SearchSubsidiariesDto, req: any): Promise<{
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
export {};
