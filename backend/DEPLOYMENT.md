# Déploiement du backend

Exécuter les commandes depuis `backend/`. Utiliser Node.js 22.19 ou ultérieur dans la branche 22 (version utilisée pour vérifier ce build), avec PostgreSQL accessible depuis le serveur.

## Préparation

1. Transférer le code, `package.json`, `package-lock.json`, `prisma.config.ts`, tout le dossier `prisma/`, les scripts et la configuration TypeScript/Nest.
2. Configurer les variables de `.env.production.example` dans un fichier `.env` ou dans l'environnement du service. Utiliser les vrais paramètres du serveur ; ne pas transférer le `.env` local. HTTPS est nécessaire pour les cookies d'authentification en production.
3. Configurer R2 : le mode local des images produits est refusé en production. Renseigner également SMTP pour les e-mails.
4. Préserver les dossiers persistants `public/` et `private/` lors des mises à jour. Le processus doit pouvoir y écrire. `private/` ne doit jamais être exposé par le serveur web. Les images R2 ne sont pas contenues dans `dist/`.

## Installation et démarrage

```bash
npm ci --include=dev
npm run build
npm run check:build
npm run migrate:deploy
npm run start:prod
```

La compilation régénère le client Prisma. Elle produit le point d'entrée **`dist/src/main.js`**. Les dépendances de développement sont nécessaires pendant la compilation et les migrations (Nest CLI et Prisma CLI) ; ne pas les retirer avant ces étapes. Ne pas copier `node_modules` de Windows vers un serveur Linux : installer les dépendances sur le serveur cible.

`check:build` charge les modules compilés avec Node.js et la configuration d'environnement, sans démarrer HTTP, les tâches planifiées ou une connexion Prisma. Il détecte notamment les imports manquants à l'exécution ; il ne remplace pas le contrôle du démarrage réel sur le serveur.

Avant d'appliquer les migrations, sauvegarder la base de production. `migrate:deploy` applique les migrations déjà présentes, sans reset ni seed. Ne pas utiliser `prisma migrate dev` ou les seeders pour une mise à jour de production. Ne pas réécrire une migration déjà appliquée.

Le service Node doit démarrer avec `backend/` comme répertoire de travail et `NODE_ENV=production`. Le reverse proxy HTTPS transmet les routes `/api-caapmedia/` et `/public/` au port configuré. Les fichiers privés restent servis uniquement par les routes authentifiées de l'API. Configurer les origines autorisées dans `CORS_ORIGINS` sans barre finale et conserver le même domaine de site pour le frontend et l'API.

## Vérifications après démarrage

- Vérifier les logs de démarrage et la connexion PostgreSQL, puis tester une requête API et une connexion utilisateur.
- Vérifier un affichage d'image R2 et un téléchargement de document privé avec authentification.
- Vérifier que les migrations sont appliquées avec `npx prisma migrate status`.

Un build réussi ne valide pas les identifiants et services de production. Les tests et le lint globaux du dépôt présentent encore des échecs hors du module fournisseurs ; les tests ciblés de ce module et le test local transactionnel sont documentés dans `../Doc/suppression-fournisseurs.md`.
