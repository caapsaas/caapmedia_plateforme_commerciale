import type { JwtUser } from "../../../common/auth/jwt/jwt-user.interface";
import { DynamicTokenService } from '../services/dynamic-token.service';
export declare class DynamicTokenController {
    private readonly dynamicTokenService;
    constructor(dynamicTokenService: DynamicTokenService);
    getCurrentToken(user: JwtUser, requestedId?: string): Promise<{
        qrUrl: string;
        token: string;
        expiresAt: Date | null;
    }>;
    generateNewToken(user: JwtUser, requestedId?: string): Promise<{
        qrUrl: string;
        token: string;
        expiresAt: Date | null;
    }>;
    private response;
    private resolveSubsidiary;
}
