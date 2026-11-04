import { AbsenceRecordService } from './absencerecord.service';
import { CreateAbsenceRecordDto, UpdateAbsenceRecordDto } from './dto/absencerecord.dto';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';
import { CreateSubsidiaryHolidayDto, UpdateWorkingDaysDto } from './dto/subsidiary-calendar.dto';
export declare class AbsencerecordController {
    private readonly absenceRecordService;
    constructor(absenceRecordService: AbsenceRecordService);
    create(createAbsenceRecordDto: CreateAbsenceRecordDto, req: any): Promise<{
        id: string;
        subsidiaryId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        employeeName: string;
        reason: string;
        documentUrl: string | null;
        typeAbsence: import("@prisma/client").$Enums.AbsenceType;
    }>;
    generateDailyAbsences(req: any, requestedId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCalendar(req: any, requestedId?: string): Promise<{
        workingDays: number[];
        holidays: {
            id: string;
            name: string;
            subsidiaryId: string;
            date: Date;
        }[];
    }>;
    updateWorkingDays(req: any, body: UpdateWorkingDaysDto, requestedId?: string): Promise<{
        id: string;
        workingDays: number[];
    }>;
    addHoliday(req: any, body: CreateSubsidiaryHolidayDto, requestedId?: string): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        date: Date;
    }>;
    removeHoliday(req: any, holidayId: string, requestedId?: string): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        date: Date;
    }>;
    findAll(req: any, paginationQuery: PaginationQueryDto, subsidiaryIdFilter?: string): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        id: string;
        subsidiaryId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        employeeName: string;
        reason: string;
        documentUrl: string | null;
        typeAbsence: import("@prisma/client").$Enums.AbsenceType;
    }>>;
    findOne(id: string, req: any): Promise<{
        id: string;
        subsidiaryId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        employeeName: string;
        reason: string;
        documentUrl: string | null;
        typeAbsence: import("@prisma/client").$Enums.AbsenceType;
    }>;
    update(id: string, updateAbsenceRecordDto: UpdateAbsenceRecordDto, req: any): Promise<{
        id: string;
        subsidiaryId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        employeeName: string;
        reason: string;
        documentUrl: string | null;
        typeAbsence: import("@prisma/client").$Enums.AbsenceType;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        subsidiaryId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        employeeName: string;
        reason: string;
        documentUrl: string | null;
        typeAbsence: import("@prisma/client").$Enums.AbsenceType;
    }>;
}
