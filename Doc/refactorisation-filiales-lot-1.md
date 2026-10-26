# Refactorisation des accès aux filiales — lot 1

## Périmètre

Socle commun de rôles et de filiales, équipements, proformas et attribution du commercial à la création des commandes et ventes. Les paiements bancaires ne sont pas modifiés.

## Politique appliquée

- L'identifiant canonique d'un membre du personnel est `JwtUser.id`. Les alias historiques `role` et `userRole` restent compatibles pendant la migration.
- Les permissions opérationnelles et les exceptions de consolidation financière suivent `activeRole`. Posséder un rôle secondaire inactif ne suffit pas.
- L'exception existante du `SUPER_ADMIN` est explicite : son accès global reste actif lorsqu'il change de rôle d'affichage. Dans les équipements et proformas, il peut consulter et gérer les ressources des autres filiales.
- Tout utilisateur, y compris le super administrateur, reste rattaché à une filiale. Un contexte sans filiale est refusé par les fonctions communes.
- Un utilisateur local ne peut consulter, modifier, supprimer ou changer le statut que des ressources de sa filiale. Le filtre de filiale reste dans les prédicats d'écriture.
- Un équipement ne change pas de filiale lors d'une modification ordinaire. La création locale ignore une filiale cible fournie par le client ; le super administrateur peut explicitement choisir la cible.
- Un proforma est créé dans la filiale du lead autorisé. Son opportunité éventuelle doit appartenir à cette même filiale. La conversion conserve cette filiale, quel que soit l'administrateur qui l'effectue.
- Les listes et compteurs de proformas sont consolidés pour le super administrateur et locaux pour les autres rôles.
- Les réponses de proformas ne sélectionnent que l'identifiant, le nom et l'email de leur créateur, sans secrets d'authentification.

## Intégrité des proformas

Le remplacement des lignes utilise une seule mise à jour Prisma imbriquée (suppression et création atomiques). Les totaux sont recalculés aussi lorsque seul le taux de taxe change ; un taux nul est respecté.

Les transitions écrivent avec le statut attendu. L'action « marquer comme vu » refuse les états terminaux pour ne pas rouvrir un devis déjà converti, accepté ou rejeté. La conversion revendique le proforma dans la transaction avant toute création de commande ; une conversion concurrente devenue invalide est rejetée. Une erreur dans la transaction annule aussi cette revendication.

## Vérification

```powershell
npx jest 'subsidiary-scope|proformas.service|equipement|ecommerce/orders' --runInBand
npm run build
npm run lint -- --no-fix
npm test -- --runInBand
```

Les tests HTTP utilisent les vrais contrôleurs, services, ValidationPipe et RoleGuard. Seule l'identité JWT est injectée par une garde de test et Prisma est simulé. Ils vérifient les réponses HTTP et l'absence d'écriture sur les refus.

Les tests de services couvrent les accès entre deux filiales, le super administrateur, les rôles inactifs, les contextes incomplets, les références locales, le remplacement des lignes, les taxes et le refus d'une conversion déjà revendiquée.

Ces tests ne remplacent pas une campagne sur une base PostgreSQL dédiée : rollback réel et concurrence réelle restent à valider avant une garantie complète en production. Aucun accès à une base métier n'est nécessaire pour ce lot et aucune migration n'est ajoutée.

## Travaux suivants

1. Migrer les autres services vers le même contrat d'identité et la même politique, sans déclarer l'ensemble de la plateforme sécurisé à ce stade.
2. Formaliser le partage des contacts et la production entre filiales.
3. Réparer la couverture des événements comptables, puis la réservation et l'idempotence du traitement.
4. Harmoniser les contrats API et les clés de cache frontend.
5. Ajouter une campagne PostgreSQL dédiée et auditer les données historiques potentiellement mal rattachées.

Les défauts existants hors de ce lot, notamment la numérotation des proformas et la normalisation des taxes lors de leur conversion, nécessitent un traitement séparé. Les échecs globaux de tests et de lint doivent être distingués des tests ciblés du lot.

## Résultat de la vérification du lot

- 57 tests ciblés réussis dans 7 suites, dont 10 scénarios HTTP.
- Compilation NestJS réussie.
- Lint ciblé réussi pour les services et contrôleurs équipements/proformas, le contrat JwtUser, les utilitaires de politique et leurs nouveaux tests.
- Suite globale exécutée : 39 suites en échec et 14 réussies au moment de cette vérification, avec des échecs hors du périmètre du lot. Le lint global reste également en échec ; aucune correction automatique globale n'a été appliquée afin de préserver les modifications en cours.
- Les tests ne contactent aucune base métier et ne valident pas les garanties transactionnelles d'une instance PostgreSQL réelle.
