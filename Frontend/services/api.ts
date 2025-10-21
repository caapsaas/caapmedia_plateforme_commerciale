import axios from 'axios';

// Création d'une instance Axios avec une configuration de base.
const api = axios.create({
  baseURL: 'http://localhost:3000/api-caapmedia', // L'URL de base de votre backend NestJS
  headers: {
    'Content-Type': 'application/json',
  },
});


// Cette fonction sera appelée avant que chaque requête ne soit envoyée.
api.interceptors.request.use(
  (config) => {

    // Récupérer le token d'authentification depuis le localStorage.
    const token = localStorage.getItem('token');
    const contactToken = sessionStorage.getItem('contactToken');

    //console.log("Token from localStorage:", token); // Ajout de ce log
    //console.log("contactToken from sessionStorage:", contactToken); // Ajout de ce log
    // Si un token existe, l'ajouter à l'en-tête 'Authorization'.

    
    // Si un token existe, l'ajouter à l'en-tête 'Authorization'.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (contactToken) {
      config.headers.Authorization = `Bearer ${contactToken}`;
    }
    
    return config;
  },
  (error) => {
    // Gérer les erreurs de configuration de la requête.
    return Promise.reject(error);
  }
);

export { api };
