import { BACKEND_ORIGIN } from '../services/apiConfig';

/**
 * Les fichiers statiques sont servis par le backend SANS le préfixe
 * /api-caapmedia (cf. app.useStaticAssets({ prefix: '/public' }) dans main.ts),
 * donc on part de l'origine nue et pas de l'URL de l'API.
 */
const STATIC_URL = BACKEND_ORIGIN;

/** URLs déjà complètes ou locales au navigateur : à ne surtout pas préfixer. */
const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\/|^(data|blob):/i;

/**
 * Construit l'URL complète pour une ressource image du backend.
 *
 * @param relativeUrl - Chemin stocké en base, ex: /public/products/image.jpg.
 *   Une URL absolue (http(s)://, //, data:, blob:) est renvoyée telle quelle :
 *   certains produits pointent vers un CDN externe et les previews d'upload
 *   sont des blob: — les préfixer produirait des URLs invalides.
 * @param fallback - Valeur renvoyée si aucune URL n'est fournie.
 * @returns L'URL complète et accessible par le navigateur.
 */
export const getImageUrl = (
  relativeUrl?: string | null,
  fallback: string = '',
): string => {
  if (!relativeUrl) {
    return fallback;
  }

  const url = relativeUrl.trim();
  if (!url) {
    return fallback;
  }

  if (ABSOLUTE_URL_PATTERN.test(url)) {
    return url;
  }

  // Tolère les chemins stockés sans slash initial (public/products/x.jpg)
  // et les séparateurs Windows hérités d'anciens uploads.
  const path = url.replace(/\\/g, '/');
  return `${STATIC_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
