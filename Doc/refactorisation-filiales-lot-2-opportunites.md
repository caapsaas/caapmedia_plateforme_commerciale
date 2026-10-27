# Refactorisation des filiales — lot 2 : opportunités CRM

## Politique d'accès

La liste, le détail, la modification et la suppression utilisent le même prédicat d'accès construit à partir du contrat `JwtUser`.

| Rôle actif | Lecture et gestion |
| --- | --- |
| ADMIN, SECRETARY | Opportunités de leur filiale, tous propriétaires |
| COMMERCIAL, FINANCIAL_DIRECTOR | Leurs propres opportunités dans leur filiale |
| SUPER_ADMIN attribué | Accès global explicite, même pendant un changement de rôle |
| Autre rôle | Refus par RoleGuard sur les routes |

La restriction historique du directeur financier est conservée. La supprimer exigerait une décision métier explicite. Les identités sans identifiant utilisateur ou filiale sont refusées. Les ressources hors périmètre répondent 404, sans préciser leur existence.

## Écritures et relations

- La création locale utilise un compte de la filiale de l'utilisateur. Pour le super administrateur, la filiale cible est déduite du compte autorisé sélectionné.
- Le contact et le compte doivent appartenir à la filiale de l'opportunité ; le contact doit être rattaché au compte sélectionné, conformément au formulaire CRM.
- Ces références sont vérifiées à la création et lors des modifications, y compris quand un seul identifiant change ou que seul le statut change.
- Le catalogue de produits reste global. Les identifiants sont vérifiés avant écriture et dédupliqués. Les associations de produits sont remplacées par une seule mise à jour imbriquée.
- Les validations et l'écriture de création/modification sont regroupées dans une transaction Prisma. Les conditions de filiale et de propriétaire restent présentes dans les prédicats d'écriture.
- Ni le propriétaire ni la filiale ne peuvent être remplacés par des propriétés supplémentaires du corps d'une requête.
- Un tableau de produits absent conserve les associations ; un tableau vide les retire. Une valeur nulle pour un tableau, une référence obligatoire ou une date de modification est refusée.

## Contrat de réponse

Les relations contact et utilisateur utilisent des sélections explicites de champs, sans mots de passe ou secrets de double authentification.

Les réponses de liste restent paginées. Liste, détail, création et modification renvoient les produits du catalogue dans `products`, leurs identifiants dans `productIds`, et la valeur de l'opportunité sous forme numérique. Cela correspond au contrat du formulaire existant : les identifiants d'associations ne sont pas confondus avec ceux des produits.

## Vérification

```powershell
npx jest 'crm/opportunities|subsidiary-scope|proformas.service|equipement|ecommerce/orders' --runInBand
npm run build
npx eslint src/crm/opportunities/**/*.ts src/crm/opportunities/*.ts
npm run lint -- --no-fix
npm test -- --runInBand
```

Les tests HTTP utilisent les vrais contrôleurs, services, ValidationPipe et RoleGuard, une identité de test injectée et un Prisma simulé. Les tests de services couvrent les accès A/B, l'accès global, le rôle actif, les références de contact/compte, les produits absents ou répétés, les contextes incomplets et le contrat de réponse.

## Limites et suite

- Aucune donnée historique n'est corrigée automatiquement. Une opportunité déjà liée à un mauvais contact/compte devra être corrigée avant de pouvoir être modifiée.
- Les tests n'utilisent pas une base PostgreSQL réelle : le rollback et les courses entre transactions doivent être vérifiés dans un environnement dédié.
- Les autres domaines CRM ne sont pas encore migrés. Le partage interfiliales des contacts ne change pas dans ce lot.
- Les paiements bancaires et la journalisation comptable restent hors périmètre.
- Le wrapper frontend historique `apiopportunities.ts` qui attend encore un tableau brut devra être harmonisé s'il est réutilisé ; la page CRM actuelle utilise le wrapper paginé `apiCrm.ts`.

## Résultat des contrôles

- 39 nouveaux tests opportunités, dont 16 scénarios HTTP.
- 96 tests ciblés et de non-régression réussis dans 9 suites.
- Compilation NestJS réussie et lint du dossier opportunités réussi.
- Contrôles globaux exécutés : la suite globale conserve 39 suites en échec hors du lot, et le lint global reste en échec. Les contrôles ciblés ne constituent pas une validation globale de la plateforme.
- Aucun accès à une base métier et aucune migration appliquée.
