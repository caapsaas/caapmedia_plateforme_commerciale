import { SecurePointageDto } from '../dto/secure-pointage.dto';
import { AttendanceSecurityService } from '../services/attendance-security.service';
export declare class PointageController {
    private readonly security;
    constructor(security: AttendanceSecurityService);
    employees(): void;
    pointage(dto: SecurePointageDto): Promise<{
        success: boolean;
        type: "arrival" | "departure";
        employeeName: string;
        status: string;
        message: string;
    }>;
}
