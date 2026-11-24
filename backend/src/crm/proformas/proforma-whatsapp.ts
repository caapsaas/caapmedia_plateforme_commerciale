import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { proformaFilename } from './proforma-pdf.service';

const logger = new Logger('ProformaWhatsApp');

export async function sendProformaDocument(
  phone: string,
  proformaNumber: string,
  pdf: Buffer,
): Promise<string> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? '';
  const version = process.env.WHATSAPP_GRAPH_API_VERSION?.trim() ?? '';
  const template = process.env.WHATSAPP_PROFORMA_TEMPLATE?.trim() ?? '';
  if (
    !token ||
    !/^\d+$/.test(phoneId) ||
    !/^v\d+\.\d+$/.test(version) ||
    !/^[a-z0-9_]+$/.test(template)
  ) {
    throw new ServiceUnavailableException(
      'L’envoi direct WhatsApp Business doit être configuré sur le serveur.',
    );
  }

  const base = `https://graph.facebook.com/${version}/${phoneId}`;
  const authorization = `Bearer ${token}`;
  const filename = proformaFilename(proformaNumber);
  const media = new FormData();
  media.set('messaging_product', 'whatsapp');
  media.set(
    'file',
    new Blob([Uint8Array.from(pdf)], { type: 'application/pdf' }),
    filename,
  );

  let stage: 'media' | 'messages' = 'media';
  try {
    const uploaded = await fetch(`${base}/media`, {
      method: 'POST',
      redirect: 'error',
      headers: { Authorization: authorization },
      body: media,
      signal: AbortSignal.timeout(30000),
    });
    const mediaResult = (await uploaded.json()) as {
      id?: string;
      error?: { code?: number };
    };
    if (!uploaded.ok || !mediaResult.id) {
      throw new Error(
        `HTTP ${uploaded.status}, code ${mediaResult.error?.code ?? 'unknown'}`,
      );
    }

    stage = 'messages';
    const sent = await fetch(`${base}/messages`, {
      method: 'POST',
      redirect: 'error',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: template,
          language: { code: 'fr' },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'document',
                  document: { id: mediaResult.id, filename },
                },
              ],
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: proformaNumber.replace(/\s+/g, ' ').trim(),
                },
              ],
            },
          ],
        },
      }),
    });
    const result = (await sent.json()) as {
      messages?: { id?: string }[];
      error?: { code?: number };
    };
    const messageId = result.messages?.[0]?.id;
    if (!sent.ok || !messageId) {
      throw new Error(
        `HTTP ${sent.status}, code ${result.error?.code ?? 'unknown'}`,
      );
    }
    return messageId;
  } catch (error) {
    logger.error(
      `Échec WhatsApp (${stage}) : ${error instanceof Error ? error.name + ': ' + error.message : 'unknown'}`,
    );
    throw new ServiceUnavailableException(
      stage === 'media'
        ? 'WhatsApp n’a pas pu recevoir le PDF.'
        : 'L’envoi WhatsApp n’a pas pu être confirmé. Vérifiez la conversation avant de réessayer.',
    );
  }
}
