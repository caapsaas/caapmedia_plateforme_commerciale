import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
    process.env.PUBLIC_API_URL = 'https://backend.example/api-caapmedia';
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
        ifu: 'IFU',
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
    await expect(
      service.email('quote', user, quote.clientEmail),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.whatsapp('quote', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mailer.send).not.toHaveBeenCalled();
  });
  it('prepares WhatsApp without changing status and uses a separate signed sharing token', async () => {
    const share = await service.whatsapp('quote', user);
    expect(share.phone).toBe('237699123456');
    expect(new URL(share.whatsappUrl).searchParams.get('text')).toContain(
      share.downloadUrl,
    );
    expect(prisma.proforma.updateMany).not.toHaveBeenCalled();
    const token = share.downloadUrl.split('/').pop()!;
    expect(() =>
      new JwtService().verify(token, { secret: process.env.JWT_SECRET }),
    ).toThrow();
    expect((await service.sharedDocument(token)).quote).toBe(quote);
    quote.status = ProformaStatus.SENT;
    expect((await service.sharedDocument(token)).quote).toBe(quote);
  });
  it('invalidates the link after document content changes', async () => {
    const share = await service.whatsapp('quote', user);
    quote.clientName = 'Changed client';
    await expect(
      service.sharedDocument(share.downloadUrl.split('/').pop()!),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('expires links after at most seven days and rejects forged tokens', async () => {
    jest.useFakeTimers();
    const share = await service.whatsapp('quote', user);
    await expect(service.sharedDocument('forged')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    jest.advanceTimersByTime(8 * 86400000);
    await expect(
      service.sharedDocument(share.downloadUrl.split('/').pop()!),
    ).rejects.toBeInstanceOf(NotFoundException);
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

  it('refuses malformed or insecure public sharing addresses', async () => {
    for (const address of [
      'not-a-url',
      'http://public.example/api-caapmedia',
      'https://user:password@example.test/api-caapmedia',
    ]) {
      process.env.PUBLIC_API_URL = address;
      await expect(service.whatsapp('quote', user)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    }
  });

  it('does not send to a changed recipient without a refreshed confirmation', async () => {
    await expect(
      service.email('quote', user, 'previous@example.test'),
    ).rejects.toThrow('coordonnées');
    expect(mailer.send).not.toHaveBeenCalled();
  });
});
