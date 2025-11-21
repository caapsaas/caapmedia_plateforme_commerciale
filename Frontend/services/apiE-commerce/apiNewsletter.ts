import { api } from '../api';

/**
 * Données pour l'inscription à la newsletter.
 * Correspond au CreateNewsletterDto du backend.
 */
export interface SubscribeNewsletterDto {
  email: string;
}

/**
 * Inscrit un nouvel e-mail à la newsletter.
 */
export const subscribeToNewsletter = async (subscriptionData: SubscribeNewsletterDto) => {
  const { data } = await api.post('/newsletter/subscribe', subscriptionData);
  return data;
};
