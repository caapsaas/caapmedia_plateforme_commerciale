import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly configService;
    constructor(configService: ConfigService);
    sendWelcomeEmail(email: string, tempPassword: string, contactName: string): {
        success: boolean;
        message: string;
    };
    sendPasswordResetEmail(email: string, tempPassword: string, contactName: string): {
        success: boolean;
        message: string;
    };
    sendMeetingInvitationEmail(email: string, participantName: string, meeting: {
        title: string;
        meetingDateTime: Date;
        meetingLocation?: string | null;
        agenda?: string | null;
        organizerName?: string | null;
    }): {
        success: boolean;
        message: string;
    };
    sendAccountingAccessNotificationEmail(email: string, recipientName: string, subject: string, body: string): {
        success: boolean;
        message: string;
    };
}
