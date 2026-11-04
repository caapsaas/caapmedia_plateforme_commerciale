import * as nodemailer from 'nodemailer';
import { ProformaMailerService } from './proforma-mailer.service';
import { DeliveryProforma } from './proforma-pdf.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
describe('Proforma SMTP transport', () => {
  const originalEnv = { ...process.env };
  const sendMail = jest.fn();
  const close = jest.fn();
  const quote = {
    clientEmail: 'client@example.test',
    clientName: 'Client',
    proformaNumber: 'PRO-001',
    subsidiary: { email: 'office@example.test', subsidiaryName: 'CaapMedia' },
  } as DeliveryProforma;
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(process.env, {
      SMTP_HOST: 'smtp.example.test',
      SMTP_PORT: '587',
      SMTP_USER: 'sender@example.test',
      SMTP_PASS: 'test-only',
      SMTP_SECURE: 'false',
    });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail,
      close,
    });
    sendMail.mockResolvedValue({ accepted: [quote.clientEmail], rejected: [] });
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });
  it('attaches a buffer PDF without allowing external attachment paths or URLs', async () => {
    const pdf = Buffer.from('%PDF-test');
    await new ProformaMailerService().send(quote, pdf);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        requireTLS: true,
        disableFileAccess: true,
        disableUrlAccess: true,
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { address: quote.clientEmail, name: 'Client' },
        attachments: [
          {
            filename: 'proforma_PRO-001.pdf',
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      }),
    );
    expect(close).toHaveBeenCalled();
  });
  it('reports rejected recipients as failures instead of claiming delivery', async () => {
    sendMail.mockResolvedValue({ accepted: [], rejected: [quote.clientEmail] });
    await expect(
      new ProformaMailerService().send(quote, Buffer.from('%PDF-test')),
    ).rejects.toThrow();
    expect(close).toHaveBeenCalled();
  });
  it('fails closed when SMTP configuration is missing', async () => {
    delete process.env.SMTP_HOST;
    await expect(
      new ProformaMailerService().send(quote, Buffer.from('%PDF-test')),
    ).rejects.toThrow();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
