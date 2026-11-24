import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { isEmail } from 'class-validator';
import {
  createSmtpTransport,
  smtpTransportOptions,
} from '../../common/utils/email/smtp-transport';
import { DeliveryProforma, proformaFilename } from './proforma-pdf.service';

@Injectable()
export class ProformaMailerService {
  private readonly logger = new Logger(ProformaMailerService.name);

  async send(quote: DeliveryProforma, pdf: Buffer): Promise<void> {
    const options = smtpTransportOptions();
    if (!isEmail(quote.clientEmail))
      throw new ServiceUnavailableException(
        'L’adresse e-mail du client est invalide.',
      );
    const transport = createSmtpTransport(options);
    try {
      const result = await transport.sendMail({
        from: process.env.SMTP_FROM || options.auth.user,
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
      if (smtpError.code === 'EAUTH' || smtpError.responseCode === 535) {
        throw new ServiceUnavailableException(
          'Le serveur de messagerie a refusé l’authentification SMTP. Demandez à un administrateur de vérifier les identifiants de la boîte d’envoi.',
        );
      }
      throw new ServiceUnavailableException(
        `L’e-mail n’a pas pu être transmis (diagnostic SMTP : ${diagnostic}). Réessayez ou contactez un administrateur.`,
      );
    } finally {
      transport.close();
    }
  }
}
