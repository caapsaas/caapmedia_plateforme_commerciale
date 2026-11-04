import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateAttendanceRecordDto, UpdateAttendanceRecordDto } from './dto/atendancerecord.dto';
import { AttendanceRecord } from '@prisma/client';
import { PaginatedResult } from "../../common/pagination/pagination";
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class AttendanceRecordService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createAttendanceRecordDto: CreateAttendanceRecordDto, employeeId: string, subsidiaryId: string): Promise<AttendanceRecord>;
    findTodayRecord(employeeId: string, subsidiaryId: string): Promise<AttendanceRecord | null>;
    findByDateRange(employeeId: string | null, subsidiaryId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
    findAll(subsidiaryId?: string, paginationQuery?: PaginationQueryDto): Promise<PaginatedResult<AttendanceRecord>>;
    findOne(id: string): Promise<AttendanceRecord>;
    update(id: string, updateAttendanceRecordDto: UpdateAttendanceRecordDto): Promise<AttendanceRecord>;
    remove(id: string): Promise<AttendanceRecord>;
}
