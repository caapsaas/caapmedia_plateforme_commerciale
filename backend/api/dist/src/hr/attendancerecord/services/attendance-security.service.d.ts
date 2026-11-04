import { PrismaService } from "../../../common/utils/prisma/prisma.service";
import { DynamicTokenService } from './dynamic-token.service';
import { SecurePointageDto } from '../dto/secure-pointage.dto';
export declare class AttendanceSecurityService {
    private readonly prisma;
    private readonly tokens;
    constructor(prisma: PrismaService, tokens: DynamicTokenService);
    pointage(dto: SecurePointageDto): Promise<{
        success: boolean;
        type: "arrival" | "departure";
        employeeName: string;
        status: string;
        message: string;
    }>;
}
