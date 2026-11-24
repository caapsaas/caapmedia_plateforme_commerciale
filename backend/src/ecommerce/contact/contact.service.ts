import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  createSmtpTransport,
  smtpTransportOptions,
} from '../../common/utils/email/smtp-transport';
import { ContactMessageDto } from './dto/contact-message.dto';

const SUPPORT_EMAIL = 'support@caapmedia.com';

@Injectable()
export class StorefrontContactService {
  private readonly logger = new Logger(StorefrontContactService.name);

  async send(message: ContactMessageDto): Promise<void> {
    const options = smtpTransportOptions();
    const transport = createSmtpTransport(options);
    try {
      const subject =
        message.subject?.replace(/[\r\n]+/g, ' ').trim() || 'Nouveau message';
      const lines = [
        `Nom : ${message.name.trim()}`,
        `E-mail : ${message.email}`,
        ...(message.phone?.trim()
          ? [`Téléphone : ${message.phone.trim()}`]
          : []),
        '',
        message.message.trim(),
      ];
      const result = await transport.sendMail({
        from: process.env.SMTP_FROM || options.auth.user,
        to: SUPPORT_EMAIL,
        replyTo: { address: message.email, name: '' },
        subject: `[Contact vitrine] ${subject}`,
        text: lines.join('\n'),
      });
      if (!result.accepted.length || result.rejected.length) {
        throw new Error('Support mailbox rejected');
      }
    } catch {
      this.logger.warn('SMTP could not accept the storefront contact message');
      throw new ServiceUnavailableException(
        'Le formulaire de contact est temporairement indisponible.',
      );
    } finally {
      transport.close();
    }
  }
}
