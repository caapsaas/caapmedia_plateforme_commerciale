import { Response } from 'express';
import { randomBytes } from 'crypto';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_TOKEN_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';
export const SESSION_HINT_COOKIE = 'session_expires_at';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes, aligne sur signOptions.expiresIn du JwtModule
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours, aligne sur RefreshTokenService

// Le refresh token n'est envoye par le navigateur que sur les routes /auth/*
// (refresh, logout) - inutile de l'exposer a chaque requete de l'app.
const AUTH_ROUTES_PATH = '/api-caapmedia/auth';

function baseCookieOptions() {
  // En production: toujours Secure (HTTPS obligatoire)
  // En dev: Secure seulement si NODE_ENV=production
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction, // ← Force true si NODE_ENV est 'production'
    sameSite: 'strict' as const,
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    path: '/',
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: AUTH_ROUTES_PATH,
  });
  setSessionHintCookie(res);
}

/**
 * Temoin de session lisible en JS (PAS httpOnly) - ne contient aucun secret,
 * seulement l'instant d'expiration de l'access token en epoch ms.
 *
 * Raison d'etre: access_token et refresh_token sont httpOnly, donc le
 * frontend ne peut pas savoir s'il existe une session avant d'appeler le
 * serveur. Sans ce temoin, chaque chargement de page par un visiteur anonyme
 * declenche GET /auth/Userprofile -> 401 puis POST /auth/refresh -> 401,
 * deux erreurs rouges en console qu'aucun try/catch ne peut masquer (elles
 * sont emises par la couche reseau du navigateur, pas par JS).
 *
 * Sa duree de vie est celle du refresh token, pas celle de l'access token:
 * sa presence signifie "une session existe probablement, un refresh vaut la
 * peine d'etre tente", et sa valeur permet au frontend de rafraichir de
 * facon PROACTIVE au lieu d'attendre un 401 (voir Frontend/services/
 * sessionHint.ts). Il est efface par clearAuthCookies() au logout.
 */
export function setSessionHintCookie(res: Response): void {
  res.cookie(
    SESSION_HINT_COOKIE,
    String(Date.now() + ACCESS_TOKEN_MAX_AGE_MS),
    {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
      path: '/',
    },
  );
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseCookieOptions(), path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseCookieOptions(),
    path: AUTH_ROUTES_PATH,
  });
  res.clearCookie(CSRF_TOKEN_COOKIE, {
    secure: baseCookieOptions().secure,
    sameSite: 'strict',
    path: '/',
  });
  res.clearCookie(SESSION_HINT_COOKIE, {
    httpOnly: false,
    secure: baseCookieOptions().secure,
    sameSite: 'strict',
    path: '/',
  });
}

/**
 * Cookie CSRF en double-submit: PAS httpOnly (le JS frontend doit pouvoir le
 * lire pour l'echoer dans le header x-csrf-token sur chaque requete
 * mutante). Sa valeur n'a pas besoin d'etre stockee cote serveur - la seule
 * garantie recherchee est que cookie et header proviennent du meme
 * navigateur, ce qu'un site tiers ne peut pas falsifier (il ne peut pas lire
 * le cookie pour le recopier dans un header).
 */
export function setCsrfCookie(res: Response): void {
  res.cookie(CSRF_TOKEN_COOKIE, randomBytes(32).toString('hex'), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    path: '/',
  });
}
