import { Injectable } from '@nestjs/common';
import { generateSecret, generate, verify, generateURI } from 'otplib';
import { randomBytes, createHash } from 'crypto';
import * as QRCode from 'qrcode';

const ISSUER = 'CaapMedia';
const RECOVERY_CODE_COUNT = 10;

/**
 * Encapsule otplib (TOTP) et la generation/validation des codes de secours
 * pour le 2FA. Aucun acces base de donnees ici (SRP) - AuthService/le
 * controller 2FA se chargent de la persistance.
 */
@Injectable()
export class TwoFactorService {
  generateSecret(): string {
    return generateSecret();
  }

  async generateQrCodeDataUrl(email: string, secret: string): Promise<string> {
    const uri = generateURI({ issuer: ISSUER, label: email, secret });
    return QRCode.toDataURL(uri);
  }

  async verifyToken(secret: string, token: string): Promise<boolean> {
    const result = await verify({ secret, token });
    return result.valid;
  }

  /** Pour debug/tests uniquement - jamais utilise dans le flow de login reel. */
  async generateToken(secret: string): Promise<string> {
    return generate({ secret });
  }

  generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
    return Array.from({ length: count }, () => randomBytes(5).toString('hex'));
  }

  hashRecoveryCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
