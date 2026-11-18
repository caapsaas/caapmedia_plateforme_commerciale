import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { isEmail } from 'class-validator';
import * as nodemailer from 'nodemailer';
import { createSecureContext, rootCertificates } from 'tls';
import { DeliveryProforma, proformaFilename } from './proforma-pdf.service';

@Injectable()
export class ProformaMailerService {
  private readonly logger = new Logger(ProformaMailerService.name);

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
    const smtpCaBase64 = process.env.SMTP_TLS_CA_BASE64?.trim();
    let smtpCa: string | undefined;
    if (smtpCaBase64) {
      try {
        const decodedCa = Buffer.from(smtpCaBase64, 'base64').toString('utf8');
        if (
          !decodedCa.includes('-----BEGIN CERTIFICATE-----') ||
          !decodedCa.includes('-----END CERTIFICATE-----')
        ) {
          throw new Error('PEM certificate markers are missing');
        }
        createSecureContext({ ca: [...rootCertificates, decodedCa] });
        smtpCa = decodedCa;
      } catch {
        throw new ServiceUnavailableException(
          'Le certificat CA configuré pour SMTP est invalide.',
        );
      }
    }
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
      ...(smtpCa
        ? { tls: { ca: [...rootCertificates, smtpCa] } }
        : {}),
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
    } catch (error) {
      const smtpError = error as {
        code?: string;
        responseCode?: number;
        command?: string;
      };
      const diagnostic = smtpError.responseCode || smtpError.code || 'UNKNOWN';
      this.logger.error(
        `Échec d’envoi de la proforma ${quote.proformaNumber}: code=${smtpError.code || 'unknown'}, responseCode=${smtpError.responseCode || 'unknown'}, command=${smtpError.command || 'unknown'}`,
      );
      throw new ServiceUnavailableException(
        `L’e-mail n’a pas pu être transmis (diagnostic SMTP : ${diagnostic}). Réessayez ou contactez un administrateur.`,
      );
    } finally {
      transport.close();
    }
  }
}
