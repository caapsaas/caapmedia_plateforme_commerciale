import { Request, Response, NextFunction } from 'express';
import { ACCESS_TOKEN_COOKIE, CSRF_TOKEN_COOKIE, CSRF_HEADER } from './cookie.util';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Protection CSRF en double-submit cookie. `sameSite: strict` sur les
 * cookies d'auth couvre deja la majorite des scenarios, mais pas tous (ex.
 * navigation top-level depuis un lien externe dans certains navigateurs) -
 * cette couche est une defense en profondeur pour les requetes mutantes.
 *
 * Ne s'applique qu'aux requetes qui s'appuient sur le cookie access_token
 * (auth "user" interne). Les clients Bearer-only (portail client "contact",
 * outils API) n'ont jamais de cookie access_token et ne sont donc pas
 * concernes - un site tiers ne peut de toute facon pas forcer l'ajout d'un
 * header Authorization personnalise sans passer une preflight CORS.
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const hasSessionCookie = Boolean(req.cookies?.[ACCESS_TOKEN_COOKIE]);
  if (!hasSessionCookie) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_TOKEN_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ message: 'CSRF token invalide ou manquant', error: 'Forbidden', statusCode: 403 });
    return;
  }

  next();
}
