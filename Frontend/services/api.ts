import axios from 'axios';

// Création d'une instance Axios avec une configuration de base.
const api = axios.create({
 baseURL: 'https://caapmedia.com/api-caapmedia',
// baseURL: 'http://localhost:3000/api-caapmedia',

  // L'URL de base de votre backend NestJS
  headers: {
    'Content-Type': 'application/json',
  },
});


// Cette fonction sera appelée avant que chaque requête ne soit envoyée.
api.interceptors.request.use(
  (config) => {
    // Récupérer le token d'authentification depuis le localStorage.
    const token = localStorage.getItem('token');
    const contactToken = localStorage.getItem('contactToken');

    // Gérer les tokens sans conflit - priorité au token de contact pour les endpoints CRM
    if (contactToken && config.url?.includes('/crm/')) {
      // Utiliser le token de contact pour les endpoints CRM
      config.headers.Authorization = `Bearer ${contactToken}`;
    } else if (token) {
      // Utiliser le token utilisateur normal pour les autres endpoints
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Gérer les erreurs de configuration de la requête.
    return Promise.reject(error);
  }
);

export { api };
