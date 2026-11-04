import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    if (mode === 'production') {
      const origin = new URL(env.VITE_API_ORIGIN || 'https://caapmedia.com');
      if (origin.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
        || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
        throw new Error('VITE_API_ORIGIN doit être une origine HTTPS de production, sans chemin ni identifiants.');
      }
      if (env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY serait intégrée au JavaScript public. Retirez-la de l’environnement de build production ; les appels utilisant une clé secrète doivent passer par le backend.');
      }
    }
    return {
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
