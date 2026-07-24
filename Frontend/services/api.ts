import axios from 'axios';

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Création d'une instance Axios avec une configuration de base.
const api = axios.create({

//baseURL: 'https://caapmedia.com/api-caapmedia',
 baseURL: 'http://localhost:3000/api-caapmedia',


  // L'URL de base de votre backend NestJS
  headers: {
    'Content-Type': 'application/json',
  },
  // Le token "user" vit dans un cookie httpOnly, envoyé automatiquement par
  // le navigateur - nécessaire pour que ce cookie parte sur chaque requête.
  withCredentials: true,
});


// Cette fonction sera appelée avant que chaque requête ne soit envoyée.
api.interceptors.request.use(
  (config) => {
    // Le token "contact" (portail client CRM) reste géré en Bearer/localStorage,
    // système distinct du token "user" désormais en cookie httpOnly.
    const contactToken = localStorage.getItem('contactToken');
    if (contactToken && config.url?.includes('/crm/')) {
      config.headers.Authorization = `Bearer ${contactToken}`;
    }

    // Double-submit CSRF: échoe le cookie csrf_token (non httpOnly) dans un
    // header sur toute requête mutante, requis par le backend dès qu'un
    // cookie access_token est présent (voir csrf.middleware.ts backend).
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

// Rafraîchit une seule fois la session sur un 401, puis rejoue la requête
// initiale. Ne concerne que les requêtes "user" (cookie httpOnly) - les
// requêtes du portail client "contact" utilisent leur propre Bearer token et
// ne peuvent pas être réparées par /auth/refresh.
let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string | undefined = originalRequest?.url;
    const isAuthBootstrapRoute = !!url && (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register'));
    const isContactRequest = !!url && url.includes('/crm/') && !!localStorage.getItem('contactToken');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthBootstrapRoute && !isContactRequest) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
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
