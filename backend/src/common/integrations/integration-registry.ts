export const integrationRegistry = [
  { id: 'postgresql', category: 'infrastructure', capability: 'databaseQuery' },
  { id: 'smtp', category: 'server', capability: 'smtpAuthentication' },
  { id: 'r2', category: 'server', capability: 'r2ObjectMetadata' },
  { id: 'whatsapp', category: 'server', capability: 'whatsappApiAccess' },
  { id: 'gemini', category: 'browser', capability: 'geminiModels' },
  { id: 'google-fonts', category: 'browser', capability: 'publicHttpResponse' },
  { id: 'unsplash', category: 'browser', capability: 'publicHttpResponse' },
  { id: 'picsum', category: 'browser', capability: 'publicHttpResponse' },
  {
    id: 'placeholder-images',
    category: 'browser',
    capability: 'publicHttpResponse',
  },
  {
    id: 'google-cloud-storage',
    category: 'seed',
    capability: 'publicHttpResponse',
  },
  { id: 'whatsapp-links', category: 'link', capability: 'whatsappLinkOrigin' },
  { id: 'google-maps', category: 'link', capability: 'publicHttpResponse' },
  { id: 'facebook', category: 'link', capability: 'publicHttpResponse' },
  { id: 'instagram', category: 'link', capability: 'publicHttpResponse' },
  { id: 'linkedin', category: 'link', capability: 'publicHttpResponse' },
] as const;

export type IntegrationId = (typeof integrationRegistry)[number]['id'];
export type ConfigurationState =
  | 'configured'
  | 'incomplete'
  | 'disabled'
  | 'notApplicable';
export const CHECK_INTERVAL_MS = 5 * 60 * 1000;
export const CHECK_STALE_MS = 3 * CHECK_INTERVAL_MS;
export const HISTORY_PAGE_SIZE = 20;
