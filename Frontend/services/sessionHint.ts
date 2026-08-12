/**
 * Lecture du temoin de session pose par le backend (voir backend/src/common/
 * auth/cookie.util.ts :: setSessionHintCookie).
 *
 * Les tokens d'auth "user" vivent dans des cookies httpOnly, illisibles en
 * JS: sans ce temoin, le frontend ne peut savoir s'il existe une session
 * qu'en interrogeant le serveur - donc un visiteur anonyme declenche a chaque
 * chargement un GET /auth/Userprofile en 401 suivi d'un POST /auth/refresh en
 * 401. Ces deux erreurs sont emises par la couche reseau du navigateur: elles
 * s'affichent en console meme si le code JS les attrape. Le seul moyen de ne
 * plus les voir est de ne pas emettre les requetes - ce que ce module permet.
 *
 * Le cookie ne contient aucun secret: uniquement l'instant d'expiration de
 * l'access token, en epoch ms. Il n'est donc PAS une preuve d'authentification
 * (un utilisateur peut le fabriquer a la main) - le serveur reste seul juge,
 * il sert uniquement a eviter des appels reseau voues a l'echec.
 */

const SESSION_HINT_COOKIE = 'session_expires_at';

/**
 * Marge appliquee a l'expiration: on rafraichit un peu avant l'echeance
 * reelle, pour couvrir la latence reseau et une eventuelle derive d'horloge
 * entre le navigateur et le serveur.
 */
export const EXPIRY_SKEW_MS = 30 * 1000;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Instant d'expiration de l'access token (epoch ms), ou null si aucune
 * session n'existe cote navigateur.
 */
export function readSessionHint(): number | null {
  const raw = readCookie(SESSION_HINT_COOKIE);
  if (!raw) return null;
  const expiresAt = Number(raw);
  return Number.isFinite(expiresAt) ? expiresAt : null;
}

/** true des qu'un cookie de session existe, meme expire (un refresh est alors tentable). */
export function hasSession(): boolean {
  return readSessionHint() !== null;
}

/** true si l'access token est expire (ou sur le point de l'etre) et qu'il faut donc rafraichir avant d'appeler l'API. */
export function needsRefresh(): boolean {
  const expiresAt = readSessionHint();
  return expiresAt !== null && expiresAt - Date.now() <= EXPIRY_SKEW_MS;
}

/**
 * Efface le temoin cote client. A appeler quand le serveur a repondu qu'il
 * n'y a plus de session (401 sur /auth/refresh): le backend efface deja ses
 * propres cookies dans ce cas, mais on ne veut pas dependre du fait que la
 * reponse d'erreur ait bien porte les Set-Cookie d'effacement.
 */
export function clearSessionHint(): void {
  document.cookie = `${SESSION_HINT_COOKIE}=; Max-Age=0; path=/; SameSite=Strict`;
}
