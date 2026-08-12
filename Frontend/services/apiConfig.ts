/**
 * Source unique de vérité pour l'origine du backend.
 *
 * L'API JSON et les fichiers statiques (images produits, uploads) sont servis
 * par le même serveur NestJS, mais sur deux chemins différents :
 *   - API      : <origine>/api-caapmedia  (préfixe global défini dans main.ts)
 *   - statique : <origine>/public/...     (useStaticAssets, sans le préfixe API)
 *
 * Les deux DOIVENT pointer vers la même origine : sinon on lit les produits
 * d'un serveur et on demande leurs images à un autre, et toutes les images
 * tombent en 404. D'où ce fichier unique importé par api.ts et imageUtils.ts.
 *
 * Pour basculer entre prod et dev local, ne changer QUE la ligne ci-dessous.
 * VITE_API_ORIGIN permet de surcharger sans éditer le code — à placer dans
 * Frontend/.env.development.local (et NON .env.local, que Vite charge aussi
 * pendant `vite build` et qui enverrait donc localhost en production).
 */
const DEFAULT_ORIGIN = 'https://caapmedia.com';
// const DEFAULT_ORIGIN = 'http://localhost:3000'; // développement local

/** Origine nue du backend, sans slash final, ex: http://localhost:3000 */
export const BACKEND_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN || DEFAULT_ORIGIN
).replace(/\/+$/, '');

/** Préfixe global de l'API, cf. app.setGlobalPrefix() dans backend/src/main.ts */
export const API_PREFIX = 'api-caapmedia';

/** URL de base des appels JSON, ex: http://localhost:3000/api-caapmedia */
export const API_BASE_URL = `${BACKEND_ORIGIN}/${API_PREFIX}`;
