import { ServiceUnavailableException } from '@nestjs/common';
import { validate } from 'class-validator';
import * as nodemailer from 'nodemailer';
import { StorefrontContactController } from './contact.controller';
import { StorefrontContactService } from './contact.service';
import { ContactMessageDto } from './dto/contact-message.dto';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('Storefront contact', () => {
  const originalEnv = process.env;
  const sendMail = jest.fn();
  const close = jest.fn();
  const message: ContactMessageDto = {
    name: 'Visitor',
    email: 'visitor@example.test',
    subject: 'Product enquiry',
    message: 'Could you send me a quote?',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      SMTP_HOST: 'smtp.example.test',
      SMTP_PORT: '587',
      SMTP_USER: 'support@caapmedia.com',
      SMTP_PASS: 'test-password',
      SMTP_SECURE: 'false',
      SMTP_FROM: 'support@caapmedia.com',
      SMTP_TLS_CA_BASE64: '',
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail,
      close,
    });
    sendMail.mockResolvedValue({
      accepted: ['support@caapmedia.com'],
      rejected: [],
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sends to support and keeps the visitor address in Reply-To', async () => {
    const controller = new StorefrontContactController(
      new StorefrontContactService(),
    );
    await controller.submit({ ...message, subject: 'Subject\r\nBcc: example' });

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ requireTLS: true }),
    );
    expect(sendMail).toHaveBeenCalledWith({
      from: 'support@caapmedia.com',
      to: 'support@caapmedia.com',
      replyTo: { address: message.email, name: '' },
      subject: '[Contact vitrine] Subject Bcc: example',
      text: expect.stringContaining(message.message) as unknown,
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('skips honeypot submissions', async () => {
    const controller = new StorefrontContactController(
      new StorefrontContactService(),
    );
    await controller.submit({ ...message, honeypot: 'filled by a bot' });
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('reports SMTP rejection as unavailable and closes the transport', async () => {
    sendMail.mockResolvedValue({
      accepted: [],
      rejected: ['support@caapmedia.com'],
    });
    await expect(
      new StorefrontContactService().send(message),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid email, blank names, and oversized messages', async () => {
    const dto = Object.assign(new ContactMessageDto(), message, {
      name: '   ',
      email: 'invalid',
      message: 'x'.repeat(5001),
    });
    expect(
      (await validate(dto)).map(({ property }) => property).sort(),
    ).toEqual(['email', 'message', 'name']);
  });
});
