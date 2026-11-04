import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { isEmail } from 'class-validator';
import * as nodemailer from 'nodemailer';
import { DeliveryProforma, proformaFilename } from './proforma-pdf.service';

@Injectable()
export class ProformaMailerService {
  async send(quote: DeliveryProforma, pdf: Buffer): Promise<void> {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 587);
    if (
      !host ||
      !user ||
      !pass ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      throw new ServiceUnavailableException(
        'L’envoi d’e-mails n’est pas configuré. Contactez un administrateur.',
      );
    }
    if (!isEmail(quote.clientEmail))
      throw new ServiceUnavailableException(
        'L’adresse e-mail du client est invalide.',
      );
    const secure =
      process.env.SMTP_SECURE === 'true' ||
      (process.env.SMTP_SECURE === undefined && port === 465);
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    try {
      const result = await transport.sendMail({
        from: process.env.SMTP_FROM || user,
        to: { address: quote.clientEmail, name: quote.clientName },
        ...(isEmail(quote.subsidiary.email)
          ? { replyTo: quote.subsidiary.email }
          : {}),
        subject: `Votre facture proforma ${quote.proformaNumber.replace(/[\r\n]/g, ' ')}`,
        text: `Bonjour ${quote.clientName},\n\nVeuillez trouver en pièce jointe votre facture proforma ${quote.proformaNumber}.\n\nNous restons à votre disposition.\n${quote.subsidiary.subsidiaryName}`,
        attachments: [
          {
            filename: proformaFilename(quote.proformaNumber),
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      });
      if (!result.accepted.length || result.rejected.length)
        throw new Error('Recipient rejected');
    } catch {
      throw new ServiceUnavailableException(
        'L’e-mail n’a pas pu être transmis. Réessayez ou contactez un administrateur.',
      );
    } finally {
      transport.close();
    }
  }
}
