import { api } from '../api';

interface StorefrontContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  honeypot: string;
}

export async function sendStorefrontContact(message: StorefrontContactMessage): Promise<void> {
  await api.post('/storefront/contact', message);
}
