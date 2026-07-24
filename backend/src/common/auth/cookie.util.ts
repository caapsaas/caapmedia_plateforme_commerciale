import { Response } from 'express';
import { randomBytes } from 'crypto';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_TOKEN_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes, aligne sur signOptions.expiresIn du JwtModule
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours, aligne sur RefreshTokenService

// Le refresh token n'est envoye par le navigateur que sur les routes /auth/*
// (refresh, logout) - inutile de l'exposer a chaque requete de l'app.
const AUTH_ROUTES_PATH = '/api-caapmedia/auth';

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
