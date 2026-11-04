# Commandes pour clients occasionnels

Dans Ventes → Nouvelle commande, choisir « Client occasionnel » puis saisir un nom et un téléphone. L’email est facultatif. Le formulaire partagé conserve le mode « Client existant » et la recherche inter-filiales.

Le backend crée une fiche Contact minimale (`isOccasional: true`) dans la même transaction que la commande. La filiale et le commercial proviennent de la session, sans possibilité de les imposer dans ce formulaire. Aucun mot de passe, accès au portail ou email de bienvenue n’est créé. Un client occasionnel enregistré peut ensuite être sélectionné dans la liste des clients existants. Un email déjà utilisé provoque un conflit invitant à sélectionner la fiche existante.

Les factures, paiements et documents continuent de référencer le client de la commande. Les clients sans email doivent recevoir une adresse email avant activation ou réinitialisation de leur accès au portail.

## Mise en service

Migration ajoutée : `20261102120000_allow_occasional_order_customers`. Elle rend `contacts.email` nullable et ajoute `contacts.is_occasional` avec `false` par défaut pour les fiches existantes.

Appliquer les migrations via la procédure habituelle du projet avant de démarrer la nouvelle version du backend, puis régénérer Prisma et reconstruire les deux applications. Les commandes sont à lancer depuis `backend/` :

```powershell
npx prisma migrate deploy
npx prisma generate
npm run build
```

`migrate deploy` applique toutes les migrations en attente : examiner leur liste avant exécution. La migration a été appliquée à la base locale après vérification qu’elle était la seule en attente. Le client Prisma a été régénéré. Aucun déploiement de production n’a été effectué.

Depuis `Frontend/`, exécuter `npm run build` pour préparer le frontend.

## Vérifications

Tests de création et de validation : clients existants et occasionnels, absence d’email, champs invalides, sélection ambiguë, filiale obligatoire, email existant, accès portail sans email. Les 24 tests ciblés passent et les builds backend/frontend réussissent. La suite globale et la vérification TypeScript globale signalent encore des erreurs existantes. La vérification visuelle dans une session authentifiée et l’essai complet de commande restent à effectuer.
