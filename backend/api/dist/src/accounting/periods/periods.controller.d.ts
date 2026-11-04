import { PeriodsService } from './periods.service';
import type { CreateFiscalYearDto } from './periods.service';
export declare class PeriodsController {
    private readonly periodsService;
    constructor(periodsService: PeriodsService);
    findAll(req: any): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }[]>;
    create(dto: CreateFiscalYearDto, req: any): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }>;
    close(id: string, req: any): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }>;
    reopen(id: string, req: any): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        isActive: boolean;
        updatedAt: Date;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        isClosed: boolean;
    }>;
}
