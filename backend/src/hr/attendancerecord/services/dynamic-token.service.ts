import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

export const ATTENDANCE_QR_TTL_MS = 120000;
type TokenReader = Pick<
  Prisma.TransactionClient,
  'dynamicToken' | 'subsidiaryQrCode'
>;

@Injectable()
export class DynamicTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async getPermanentToken(subsidiaryId: string, regenerate = false) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM subsidiaries WHERE id = ${subsidiaryId} FOR UPDATE
      `;
      const existing = await tx.subsidiaryQrCode.findUnique({
        where: { subsidiaryId },
      });
      if (existing?.isActive && !regenerate)
        return { token: existing.token, expiresAt: null };

      if (existing) {
        await tx.dynamicToken.updateMany({
          where: { token: existing.token, isUsed: false },
          data: { isUsed: true, usedAt: new Date() },
        });
      }

      // Keep the QR currently displayed/printed through the one-time transition
      // from expiring dynamic tokens, then make it permanent.
      const latestDynamic =
        !existing && !regenerate
          ? await tx.dynamicToken.findFirst({
              where: { subsidiaryId },
              orderBy: { createdAt: 'desc' },
              select: { token: true },
            })
          : null;
      const token = latestDynamic?.token ?? randomUUID();
      const qr = await tx.subsidiaryQrCode.upsert({
        where: { subsidiaryId },
        create: { subsidiaryId, token, isActive: true },
        update: { token, isActive: true },
      });
      return { token: qr.token, expiresAt: null };
    });
  }

  private async issue(subsidiaryId: string, force: boolean) {
    return this.prisma.$transaction(async (tx) => {
      // Serialize rotation per site: concurrent displays cannot invalidate each other.
      const site = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM subsidiaries WHERE id = ${subsidiaryId} FOR UPDATE`;
      if (!site.length) throw new NotFoundException('Filiale introuvable.');
      const now = new Date();
      const active = await tx.dynamicToken.findFirst({
        where: {
          subsidiaryId,
          isUsed: false,
          expiresAt: {
            gt: new Date(now.getTime() + 30000),
            lte: new Date(now.getTime() + ATTENDANCE_QR_TTL_MS),
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (active && !force)
        return { token: active.token, expiresAt: active.expiresAt };
      await tx.dynamicToken.updateMany({
        where: { subsidiaryId, isUsed: false },
        data: { isUsed: true, usedAt: now },
      });
      const token = await tx.dynamicToken.create({
        data: {
          id: randomUUID(),
          token: randomUUID(),
          subsidiaryId,
          expiresAt: new Date(now.getTime() + ATTENDANCE_QR_TTL_MS),
          createdAt: now,
        },
      });
      return { token: token.token, expiresAt: token.expiresAt };
    });
  }

  generateToken(subsidiaryId: string) {
    return this.issue(subsidiaryId, true);
  }
  getActiveToken(subsidiaryId: string) {
    return this.issue(subsidiaryId, false);
  }

  async validateToken(
    token: string,
    client: TokenReader = this.prisma,
  ): Promise<string> {
    const permanent = await client.subsidiaryQrCode.findUnique({
      where: { token },
      select: { subsidiaryId: true, isActive: true },
    });
    if (permanent?.isActive) return permanent.subsidiaryId;
    if (permanent) {
      throw new BadRequestException({
        code: 'QR_REVOKED',
        message:
          'Ce QR a été remplacé. Utilisez le QR actuellement affiché dans les locaux.',
      });
    }

    const record = await client.dynamicToken.findUnique({ where: { token } });
    const now = Date.now();
    if (
      !record ||
      record.isUsed ||
      !record.subsidiaryId ||
      record.expiresAt.getTime() <= now ||
      record.expiresAt.getTime() - record.createdAt.getTime() >
        ATTENDANCE_QR_TTL_MS
    ) {
      throw new BadRequestException({
        code: 'QR_EXPIRED',
        message:
          'QR code invalide ou expiré. Scannez le code actuellement affiché sur place.',
      });
    }
    return record.subsidiaryId;
  }
}
