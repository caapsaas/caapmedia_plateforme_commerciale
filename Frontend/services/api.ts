import axios from 'axios';
import { API_BASE_URL } from './apiConfig';
import { clearSessionHint, hasSession, needsRefresh } from './sessionHint';

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

// Routes qui servent a OBTENIR une session: elles ne peuvent pas etre
// reparees par un refresh (ce serait circulaire pour /auth/refresh lui-meme).
const AUTH_BOOTSTRAP_ROUTES = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/2fa'];

function isAuthBootstrap(url: string | undefined): boolean {
  return !!url && AUTH_BOOTSTRAP_ROUTES.some((route) => url.includes(route));
}

/** Requete du portail client "contact": Bearer token propre, /auth/refresh ne la concerne pas. */
function isContactRequest(url: string | undefined): boolean {
  return !!url && url.includes('/crm/') && !!localStorage.getItem('contactToken');
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Création d'une instance Axios avec une configuration de base.
const api = axios.create({
  // L'URL de base du backend NestJS. Définie dans apiConfig.ts, partagée avec
  // imageUtils.ts pour que JSON et images pointent toujours au même endroit.
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Le token "user" vit dans un cookie httpOnly, envoyé automatiquement par
  // le navigateur - nécessaire pour que ce cookie parte sur chaque requête.
  withCredentials: true,
});


// Un seul /auth/refresh en vol à la fois: sans ça, 5 requêtes parallèles qui
// expirent ensemble déclenchent 5 rotations concurrentes du refresh token,
// dont 4 sur un token déjà tourné - donc 4 déconnexions.
let refreshPromise: Promise<unknown> | null = null;

export function refreshSession(): Promise<unknown> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .catch((error) => {
        // Le serveur a tranché: plus de session récupérable. On efface le
        // témoin pour que les chargements suivants n'émettent plus aucun
        // appel authentifié (et donc plus aucun 401 en console).
        clearSessionHint();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Cette fonction sera appelée avant que chaque requête ne soit envoyée.
api.interceptors.request.use(
  async (config) => {
    // Le token "contact" (portail client CRM) reste géré en Bearer/localStorage,
    // système distinct du token "user" désormais en cookie httpOnly.
    const contactToken = localStorage.getItem('contactToken');
    if (contactToken && config.url?.includes('/crm/')) {
      config.headers.Authorization = `Bearer ${contactToken}`;
    }

    // Refresh PROACTIF: l'access token ne vit que 15 min, donc sans ça la
    // première requête après ce délai part forcément en 401 (visible en rouge
    // dans la console, même rattrapée ensuite). Le témoin de session nous dit
    // quand il expire: on renouvelle AVANT d'envoyer, et le 401 n'existe plus.
    if (!isAuthBootstrap(config.url) && !isContactRequest(config.url) && needsRefresh()) {
      // Si le refresh échoue, on laisse quand même partir la requête: c'est au
      // serveur de trancher, et l'intercepteur de réponse gérera le 401.
      await refreshSession().catch(() => {});
    }

    // Double-submit CSRF: échoe le cookie csrf_token (non httpOnly) dans un
    // header sur toute requête mutante, requis par le backend dès qu'un
    // cookie access_token est présent (voir csrf.middleware.ts backend).
    // Lu APRÈS un éventuel refresh ci-dessus: celui-ci fait tourner le cookie
    // csrf_token, et échoer l'ancienne valeur donnerait un 403.
    const method = config.method?.toLowerCase();
    if (method && MUTATING_METHODS.has(method)) {
      const csrfToken = getCookie('csrf_token');
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    // Gérer les erreurs de configuration de la requête.
    return Promise.reject(error);
  }
);

// Filet de sécurité: rafraîchit une seule fois la session sur un 401 imprévu
// (horloge client décalée, cookie révoqué côté serveur...), puis rejoue la
// requête initiale. Ne concerne que les requêtes "user" (cookie httpOnly) -
// les requêtes du portail client "contact" utilisent leur propre Bearer token
// et ne peuvent pas être réparées par /auth/refresh.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string | undefined = originalRequest?.url;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthBootstrap(url) &&
      !isContactRequest(url) &&
      // Inutile de tenter un refresh sans session: /auth/refresh répondrait
      // 401 à son tour, soit une deuxième erreur en console pour rien.
      hasSession()
    ) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export const apiClient = api; // Export for loading interceptors
