import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateAbsenceRecordDto, UpdateAbsenceRecordDto } from './dto/absencerecord.dto';
import { AbsenceRecord } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';
import { PaginatedResult } from '../../common/pagination/pagination';
export declare class AbsenceRecordService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateAbsenceRecordDto, employeeId: string, subsidiaryId: string): Promise<AbsenceRecord>;
    findAll(subsidiaryId?: string, paginationQuery?: PaginationQueryDto): Promise<PaginatedResult<AbsenceRecord>>;
    findOne(id: string): Promise<AbsenceRecord>;
    update(id: string, dto: UpdateAbsenceRecordDto): Promise<AbsenceRecord>;
    remove(id: string): Promise<AbsenceRecord>;
    getSubsidiaryCalendar(subsidiaryId: string): Promise<{
        workingDays: number[];
        holidays: {
            id: string;
            name: string;
            subsidiaryId: string;
            date: Date;
        }[];
    }>;
    updateWorkingDays(subsidiaryId: string, workingDays: number[]): Promise<{
        id: string;
        workingDays: number[];
    }>;
    addHoliday(subsidiaryId: string, date: string, name: string): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        date: Date;
    }>;
    removeHoliday(subsidiaryId: string, holidayId: string): Promise<{
        id: string;
        name: string;
        subsidiaryId: string;
        date: Date;
    }>;
    generateDailyAbsences(subsidiaryId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    generateAbsencesForDate(date?: Date, subsidiaryId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
