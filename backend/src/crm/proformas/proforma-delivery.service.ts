import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProformaStatus } from '@prisma/client';
import { createHash, createHmac } from 'crypto';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from '../../common/utils/subsidiary-scope';
import {
  DeliveryProforma,
  money,
  ProformaPdfService,
} from './proforma-pdf.service';
import { ProformaMailerService } from './proforma-mailer.service';

const include = {
  items: { orderBy: { id: 'asc' as const }, include: { product: true } },
  subsidiary: true,
};
const sendable: ProformaStatus[] = [
  ProformaStatus.DRAFT,
  ProformaStatus.SENT,
  ProformaStatus.VIEWED,
];

export function normalizeWhatsAppPhone(raw: string): string {
  let phone = raw.trim().replace(/[\s().-]/g, '');
  if (phone.startsWith('+')) phone = phone.slice(1);
  else if (phone.startsWith('00')) phone = phone.slice(2);
  else if (/^[26]\d{8}$/.test(phone)) phone = `237${phone}`;
  if (!/^[1-9]\d{7,14}$/.test(phone))
    throw new BadRequestException(
      'Renseignez un numéro WhatsApp avec son indicatif pays.',
    );
  return phone;
}

function version(quote: DeliveryProforma): string {
  // Only document content: sending/viewing it must not invalidate its link.
  const {
    proformaNumber,
    clientName,
    clientEmail,
    clientPhone,
    clientCompany,
    subtotal,
    taxRate,
    taxAmount,
    totalAmount,
    validityDate,
    notes,
    createdAt,
  } = quote;
  return createHash('sha256')
    .update(
      JSON.stringify({
        proformaNumber,
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        validityDate,
        notes,
        createdAt,
        subsidiary: {
          name: quote.subsidiary.subsidiaryName,
          address: quote.subsidiary.address,
          phone: quote.subsidiary.phone,
          email: quote.subsidiary.email,
          rccm: quote.subsidiary.rccm,
          ifu: quote.subsidiary.ifu,
          bankName: quote.subsidiary.bankName,
          accountNumber: quote.subsidiary.accountNumber,
        },
        items: quote.items.map((item) => ({
          id: item.id,
          name: item.product.name,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description,
        })),
      }),
    )
    .digest('hex');
}

@Injectable()
export class ProformaDeliveryService {
  private readonly jwt = new JwtService();
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: ProformaPdfService,
    private readonly mailer: ProformaMailerService,
  ) {}

  private key(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32)
      throw new ServiceUnavailableException(
        'Le partage de proformas n’est pas configuré.',
      );
    return createHmac('sha256', secret)
      .update('caapmedia-proforma-sharing-v1')
      .digest('hex');
  }
  private async authorized(id: string, user: JwtUser) {
    const quote = await this.prisma.proforma.findUnique({
      where: withSubsidiaryScope({ id }, resolveScopeContext(user)),
      include,
    });
    if (!quote) throw new NotFoundException('Proforma introuvable.');
    if (!sendable.includes(quote.status) || quote.validityDate <= new Date())
      throw new BadRequestException(
        'Cette proforma ne peut plus être envoyée.',
      );
    return quote;
  }
  async email(id: string, user: JwtUser, expectedRecipient: string) {
    const quote = await this.authorized(id, user);
    if (quote.clientEmail !== expectedRecipient)
      throw new ConflictException(
        'Les coordonnées du client ont changé. Actualisez la proforma avant de l’envoyer.',
      );
    await this.mailer.send(quote, await this.pdf.render(quote));
    // Never claim success or change the status on SMTP failure; preserve later workflow states.
    await this.prisma.proforma.updateMany({
      where: {
        id,
        subsidiaryId: quote.subsidiaryId,
        status: ProformaStatus.DRAFT,
      },
      data: { status: ProformaStatus.SENT, sentAt: new Date() },
    });
    return { channel: 'email', recipient: quote.clientEmail, success: true };
  }
  async whatsapp(id: string, user: JwtUser) {
    const quote = await this.authorized(id, user);
    const phone = normalizeWhatsAppPhone(quote.clientPhone);
    const seconds = Math.max(
      1,
      Math.min(
        7 * 86400,
        Math.floor((quote.validityDate.getTime() - Date.now()) / 1000),
      ),
    );
    const token = this.jwt.sign(
      { sub: id, version: version(quote) },
      {
        secret: this.key(),
        algorithm: 'HS256',
        audience: 'proforma-sharing',
        issuer: 'caapmedia',
        expiresIn: seconds,
      },
    );
    let base: string;
    try {
      base = process.env.PUBLIC_API_URL || '';
      if (!base) {
        const origin = new URL(
          process.env.FRONTEND_URL || 'https://caapmedia.com',
        );
        if (['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))
          origin.port = process.env.PORT || '3000';
        base = `${origin.origin}/api-caapmedia`;
      }
      const configured = new URL(base);
      if (
        !['https:', 'http:'].includes(configured.protocol) ||
        (configured.protocol === 'http:' &&
          !['localhost', '127.0.0.1', '[::1]'].includes(configured.hostname)) ||
        configured.search ||
        configured.hash ||
        configured.username ||
        configured.password
      )
        throw new Error();
    } catch {
      throw new ServiceUnavailableException(
        'L’adresse de partage des proformas est invalide.',
      );
    }
    const downloadUrl = `${base.replace(/\/+$/, '')}/proforma-share/${token}`;
    const message = `Bonjour ${quote.clientName},\nVoici votre facture proforma n° ${quote.proformaNumber} (${money(quote.totalAmount)}).\nTélécharger le PDF : ${downloadUrl}\n\n${quote.subsidiary.subsidiaryName}`;
    return {
      phone,
      message,
      downloadUrl,
      whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      expiresAt: new Date(Date.now() + seconds * 1000).toISOString(),
    };
  }
  async sharedDocument(token: string) {
    let payload: { sub: string; version: string };
    try {
      payload = this.jwt.verify<{ sub: string; version: string }>(token, {
        secret: this.key(),
        algorithms: ['HS256'],
        audience: 'proforma-sharing',
        issuer: 'caapmedia',
      });
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.version !== 'string'
      )
        throw new Error();
    } catch {
      throw new NotFoundException('Ce lien est expiré ou indisponible.');
    }
    const quote = await this.prisma.proforma.findUnique({
      where: { id: payload.sub },
      include,
    });
    if (
      !quote ||
      quote.validityDate <= new Date() ||
      quote.status === ProformaStatus.REJECTED ||
      quote.status === ProformaStatus.EXPIRED ||
      version(quote) !== payload.version
    )
      throw new NotFoundException('Ce lien est expiré ou indisponible.');
    return { quote, buffer: await this.pdf.render(quote) };
  }
}
