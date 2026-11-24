import { ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { createSecureContext, rootCertificates } from 'tls';

export function smtpTransportOptions(env = process.env) {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const port = Number(env.SMTP_PORT || 587);
  if (
    !host?.trim() ||
    !user?.trim() ||
    !pass ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new ServiceUnavailableException(
      'L’envoi d’e-mails n’est pas configuré. Contactez un administrateur.',
    );
  }

  const secure =
    env.SMTP_SECURE === 'true' ||
    (env.SMTP_SECURE === undefined && port === 465);
  const encodedCa = env.SMTP_TLS_CA_BASE64?.trim();
  let ca: string[] | undefined;
  if (encodedCa) {
    try {
      const certificate = Buffer.from(encodedCa, 'base64').toString('utf8');
      if (
        !certificate.includes('-----BEGIN CERTIFICATE-----') ||
        !certificate.includes('-----END CERTIFICATE-----')
      ) {
        throw new Error('PEM certificate markers are missing');
      }
      ca = [...rootCertificates, certificate];
      createSecureContext({ ca });
    } catch {
      throw new ServiceUnavailableException(
        'Le certificat CA configuré pour SMTP est invalide.',
      );
    }
  }

  return {
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
    ...(ca ? { tls: { ca } } : {}),
  };
}

export function createSmtpTransport(options = smtpTransportOptions()) {
  return nodemailer.createTransport(options);
}
