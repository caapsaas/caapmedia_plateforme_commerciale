import { LeaveType } from '@prisma/client';
export declare class AddLeaveRecordDto {
    startDate: Date;
    endDate: Date;
    days: number;
    leaveRecordType: LeaveType;
}
