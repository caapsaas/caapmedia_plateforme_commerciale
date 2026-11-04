import { PrismaService } from '../common/utils/prisma/prisma.service';
import { ScopableUser } from '../common/utils/subsidiary-scope';
export declare const MEETING_REPORT_MAX_SIZE: number;
export declare const MEETING_REPORT_TYPES: Record<string, string>;
export declare function validateMeetingReport(file: Express.Multer.File): void;
export declare class MeetingReportsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private authorizedMeeting;
    complete(id: string, user: ScopableUser): Promise<{
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
    upload(id: string, file: Express.Multer.File | undefined, user: ScopableUser & {
        id: string;
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
}
