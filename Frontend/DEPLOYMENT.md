# Déploiement du frontend

Depuis `Frontend/`, avec Node.js 22.19 (version utilisée pour ce build) :

```bash
npm ci --include=dev
npm run build
npm run check:build
```

Publier **le contenu de `dist/`**, y compris le fichier caché `.htaccess` sur Apache. Node.js et `node_modules` ne sont pas nécessaires pour servir les fichiers générés. `npm run preview` sert à la vérification locale, pas à l'hébergement de production.

## API et environnement

L'origine API par défaut est `https://caapmedia.com`. Pour une autre origine, copier `.env.production.example` dans `.env.production.local` avant compilation et définir `VITE_API_ORIGIN`, sans préfixe `/api-caapmedia` ni chemin `/public`. Une modification de cette variable nécessite un nouveau build. Éviter toute surcharge localhost dans `.env.local`, également chargé pendant la compilation ; le build production refuse les origines HTTP/locales.

Les valeurs intégrées au JavaScript sont publiques. Le build refuse `GEMINI_API_KEY` en production pour éviter de publier une clé secrète ; les fonctions IA restent indisponibles tant qu'un accès via le backend n'est pas implémenté. Aucun secret backend, SMTP ou R2 ne doit figurer dans les variables frontend.

Le backend doit autoriser l'origine exacte du site dans `CORS_ORIGINS`, utiliser HTTPS et accepter les cookies. Héberger de préférence le frontend et l'API sur la même origine (`https://caapmedia.com`), comme prévu par la configuration actuelle et les cookies de session/CSRF.

## Routage du serveur web

La SPA doit renvoyer `index.html` pour `/login`, `/account` et les pages `/dashboard/*`. Sur Apache, `.htaccess` fourni exige `mod_rewrite` et l'autorisation des règles de réécriture. Il conserve les 404 des assets absents et ne réécrit pas les routes du backend. Configurer séparément le proxy vers NestJS pour `/api-caapmedia/` et `/public/` ; ne pas remplacer ces routes par le fallback SPA et ne pas exposer le dossier privé du backend.

Sur Nginx, adapter les blocs frontend suivants à la configuration HTTPS existante, en conservant les blocs proxy du backend :

```nginx
root /chemin/vers/Frontend/dist;
index index.html;

location /assets/ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
location = /index.html {
    add_header Cache-Control "no-cache";
}
location / {
    try_files $uri $uri/ /index.html;
}
```

Conserver l'ancien dossier d'assets pendant le remplacement atomique du site pour ne pas interrompre les sessions ouvertes, puis nettoyer les anciens fichiers après expiration des caches.

## Vérifications

`check:build` vérifie les références JS/CSS de l'HTML, les fichiers publics, l'origine API attendue et l'absence de fichiers d'environnement ou de clé Google identifiable dans le bundle. Il ne valide pas la disponibilité de l'hébergement ni de l'API.

Après publication, tester le chargement et le rechargement direct d'une page dashboard, la connexion, les images et les appels API. Les erreurs TypeScript préexistantes du dépôt restent à corriger ; `vite build` ne remplace pas `npx tsc --noEmit`.
