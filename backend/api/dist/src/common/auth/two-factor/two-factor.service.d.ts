export declare class TwoFactorService {
    generateSecret(): string;
    generateQrCodeDataUrl(email: string, secret: string): Promise<string>;
    verifyToken(secret: string, token: string): Promise<boolean>;
    generateToken(secret: string): Promise<string>;
    generateRecoveryCodes(count?: number): string[];
    hashRecoveryCode(code: string): string;
}
