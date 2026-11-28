import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ProformaStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  ProformaDeliveryService,
  normalizeWhatsAppPhone,
} from './proforma-delivery.service';
import { DeliveryProforma, ProformaPdfService } from './proforma-pdf.service';
import { ProformaMailerService } from './proforma-mailer.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';

describe('Proforma delivery', () => {
  const originalEnv = { ...process.env };
  const user = {
    id: 'seller',
    subsidiaryId: 'A',
    role: UserRole.COMMERCIAL,
    activeRole: UserRole.COMMERCIAL,
    roles: [UserRole.COMMERCIAL],
  } as JwtUser;
  const prisma = { proforma: { findUnique: jest.fn(), updateMany: jest.fn() } };
  const pdf = { render: jest.fn().mockResolvedValue(Buffer.from('%PDF-test')) };
  const mailer = { send: jest.fn() };
  const service = new ProformaDeliveryService(
    prisma as unknown as PrismaService,
    pdf as unknown as ProformaPdfService,
    mailer as unknown as ProformaMailerService,
  );
  let quote: DeliveryProforma;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'unit-test-secret-longer-than-32-characters';
    quote = {
      id: 'quote',
      proformaNumber: 'PRO-2026-001',
      status: ProformaStatus.DRAFT,
      subsidiaryId: 'A',
      clientName: 'Client',
      clientPhone: '+237 699 123 456',
      clientEmail: 'client@example.test',
      clientCompany: 'Company',
      notes: '',
      createdAt: new Date(),
      validityDate: new Date(Date.now() + 30 * 86400000),
      subtotal: new Decimal(100),
      taxRate: new Decimal(19.25),
      taxAmount: new Decimal(19.25),
      totalAmount: new Decimal(119.25),
      items: [
        {
          id: 'item',
          productId: 'product',
          product: { name: 'Affiches' },
          quantity: 1,
          unitPrice: new Decimal(100),
          description: 'A3',
        },
      ],
      subsidiary: {
        subsidiaryName: 'CaapMedia',
        email: 'office@example.test',
        address: 'Douala',
        phone: '237600000000',
        bankName: 'Bank',
        accountNumber: '123',
        niu: 'NIU',
        rccm: 'RCCM',
      },
    } as unknown as DeliveryProforma;
    prisma.proforma.findUnique.mockImplementation(
      ({ where }: { where: { subsidiaryId?: string } }) =>
        Promise.resolve(
          !where.subsidiaryId || where.subsidiaryId === quote.subsidiaryId
            ? quote
            : null,
        ),
    );
    prisma.proforma.updateMany.mockResolvedValue({ count: 1 });
    mailer.send.mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
    process.env = { ...originalEnv };
  });

  it('previews the server PDF without recording a customer view or sending it', async () => {
    quote.status = ProformaStatus.SENT;
    await expect(service.preview('quote', user)).resolves.toEqual({
      quote,
      buffer: Buffer.from('%PDF-test'),
    });
    expect(pdf.render).toHaveBeenCalledWith(quote);
    expect(prisma.proforma.updateMany).not.toHaveBeenCalled();
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('sends the generated document only to the stored client and marks it sent afterwards', async () => {
    expect(await service.email('quote', user, quote.clientEmail)).toEqual({
      channel: 'email',
      recipient: quote.clientEmail,
      success: true,
    });
    expect(mailer.send).toHaveBeenCalledWith(quote, Buffer.from('%PDF-test'));
    expect(mailer.send.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.proforma.updateMany.mock.invocationCallOrder[0],
    );
  });
  it('never marks an email sent when SMTP fails', async () => {
    mailer.send.mockRejectedValue(new ServiceUnavailableException());
    await expect(
      service.email('quote', user, quote.clientEmail),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.proforma.updateMany).not.toHaveBeenCalled();
  });
  it('does not disclose another subsidiary proforma', async () => {
    quote.subsidiaryId = 'B';
    await expect(service.preview('quote', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(pdf.render).not.toHaveBeenCalled();
    await expect(
      service.email('quote', user, quote.clientEmail),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.whatsapp('quote', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mailer.send).not.toHaveBeenCalled();
  });
  it('prepares a WhatsApp caption without a document link or status change', async () => {
    const share = await service.whatsapp('quote', user);
    expect(share.phone).toBe('237699123456');
    const chat = new URL(share.whatsappUrl);
    expect(chat.pathname).toBe('/237699123456');
    expect(chat.searchParams.get('text')).toBe(share.caption);
    expect(share.caption).toContain('PRO-2026-001');
    expect(share.caption).not.toMatch(/https?:\/\//);
    expect(share).not.toHaveProperty('downloadUrl');
    expect(prisma.proforma.updateMany).not.toHaveBeenCalled();
  });
  describe('direct WhatsApp delivery', () => {
    beforeEach(() => {
      process.env.WHATSAPP_GRAPH_API_VERSION = 'v27.0';
      process.env.WHATSAPP_PHONE_NUMBER_ID = '1234';
      process.env.WHATSAPP_ACCESS_TOKEN = 'test-token';
      process.env.WHATSAPP_PROFORMA_TEMPLATE = 'proforma_caapmedia';
    });

    afterEach(() => jest.restoreAllMocks());

    it('uploads the PDF and sends one template message with a document, then marks it sent', async () => {
      const request = jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(Response.json({ id: 'media-id' }))
        .mockResolvedValueOnce(
          Response.json({ messages: [{ id: 'message-id' }] }),
        );

      await expect(
        service.sendWhatsApp('quote', user, '699123456'),
      ).resolves.toMatchObject({
        messageId: 'message-id',
      });
      const [upload, send] = request.mock.calls;
      expect(upload[0]).toBe('https://graph.facebook.com/v27.0/1234/media');
      const attachment = (upload[1]?.body as FormData).get('file') as Blob;
      expect(attachment.type).toBe('application/pdf');
      await expect(attachment.text()).resolves.toBe('%PDF-test');
      expect(send[0]).toBe('https://graph.facebook.com/v27.0/1234/messages');
      expect(JSON.parse(send[1]?.body as string)).toMatchObject({
        to: '237699123456',
        type: 'template',
        template: {
          components: [
            {
              type: 'header',
              parameters: [{ type: 'document', document: { id: 'media-id' } }],
            },
            {
              type: 'body',
              parameters: [{ type: 'text', text: quote.proformaNumber }],
            },
          ],
        },
      });
      expect(prisma.proforma.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ProformaStatus.SENT,
          }) as unknown,
        }),
      );
    });

    it('leaves the status unchanged when Meta refuses the message', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(Response.json({ id: 'media-id' }))
        .mockResolvedValueOnce(
          Response.json({ error: { code: 132001 } }, { status: 400 }),
        );
      await expect(
        service.sendWhatsApp('quote', user, quote.clientPhone),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(prisma.proforma.updateMany).not.toHaveBeenCalled();
    });
  });

  it('rejects forged legacy document links', async () => {
    await expect(service.sharedDocument('forged')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('supports resending sent quotes and refuses expired or rejected quotes', async () => {
    quote.status = ProformaStatus.SENT;
    await expect(
      service.email('quote', user, quote.clientEmail),
    ).resolves.toHaveProperty('success', true);
    quote.status = ProformaStatus.REJECTED;
    await expect(service.whatsapp('quote', user)).rejects.toThrow();
    quote.status = ProformaStatus.DRAFT;
    quote.validityDate = new Date(Date.now() - 1000);
    await expect(
      service.email('quote', user, quote.clientEmail),
    ).rejects.toThrow();
  });
  it('normalizes local Cameroon and international phone numbers without guessing an arbitrary destination', () => {
    expect(normalizeWhatsAppPhone('699 123 456')).toBe('237699123456');
    expect(normalizeWhatsAppPhone('0033 6 12 34 56 78')).toBe('33612345678');
    expect(() => normalizeWhatsAppPhone('not-a-number')).toThrow();
  });

  it('does not send to a changed recipient without a refreshed confirmation', async () => {
    await expect(
      service.email('quote', user, 'previous@example.test'),
    ).rejects.toThrow('coordonnées');
    expect(mailer.send).not.toHaveBeenCalled();
  });
});
