# Plan de migration : uniformisation des IDs préfixés + suppression du drift `@db.Uuid`

Statut : **Terminé.** Phases 0, 1, 2 et 3 (tous domaines) livrées et vérifiées en conditions réelles. Phase 4 (vérification) faite en continu à chaque lot — voir §7 pour le détail complet.
Auteur : session Claude Code du 2026-07-27, suite au bug "Erreur lors de la sauvegarde" sur Configuration > Production > coût horaire par machine.

## 1. Contexte

Le projet a deux façons concurrentes de générer un ID de ligne :

1. **Le défaut Prisma** `@default(uuid())` → un vrai UUID Postgres (`e697afb5-fc03-4567-...`).
2. **`generateId(ID_PREFIXES.X)`** (`backend/src/common/utils/generate-id.util.ts`), appelé explicitement dans le `.create()` du service → un ID lisible du type `USR-MS312RFJL91`, `EMP-MS312RBUTWI`, etc.

Le second est la convention voulue par l'équipe (voir `backend/src/common/constants/id-prefixes.const.ts`, déjà rempli pour 66 entités). Mais **rien n'empêche le premier de continuer à s'appliquer en silence** : `@default(uuid())` reste déclaré dans `schema.prisma` pour les 81 modèles, y compris ceux déjà migrés vers `generateId()`. Tant qu'un chemin de création oublie de passer un id explicite, Prisma retombe sur un vrai UUID.

En parallèle, une conversion en masse (migration `20260717100439_complete_uuid_to_text_fixed`) a already changé **toutes** les colonnes physiques UUID de la base en `TEXT`, pour permettre les IDs préfixés. Mais `schema.prisma` n'a pas suivi partout : 44 champs sont encore annotés `@db.Uuid` alors qu'aucune colonne de la base n'est réellement de type `uuid` (vérifié par requête directe sur `information_schema.columns`, 0 résultat).

Conséquence concrète : quand un champ annoté `@db.Uuid` reçoit une valeur au format préfixé (ex. `updatedById: user.id` où `user.id = "USR-MS312RFJL91"`), Prisma type le bind parameter en `uuid` côté requête, Postgres rejette avec `invalid input syntax for type uuid` → 500 → message générique "Erreur lors de la sauvegarde" côté frontend. C'est exactement le bug reporté sur le coût horaire des machines.

## 2. Preuves (audit du 2026-07-27)

### 2.1 Colonnes réellement `uuid` en base : **0**

```sql
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public' AND data_type = 'uuid';
-- => 0 lignes
```

Donc **tous** les `@db.Uuid` restants dans `schema.prisma` sont du drift pur — aucun ne reflète la base réelle. Les retirer est mécanique et sans risque de perte de données (le type physique ne change pas, TEXT était déjà là).

### 2.2 Format réel des IDs, table par table (scan complet, pas un échantillon)

| Statut | Tables |
|---|---|
| **`*** MIXTE ***`** (incohérence réelle à corriger) | `contacts` (6 uuid / 14 préfixé), `subsidiaries` (3 uuid / 1 préfixé), `tax_rates` (2 uuid / 1 préfixé) |
| **`prefix-only`** (déjà 100% migré) | `employee_leave_balances`, `employees`, `equipment`, `maintenance_records`, `suppliers`, `treasury_accounts`, `users` |
| **`uuid-only`** (jamais migré, `@default(uuid())` toujours actif) | `accounts`, `auth_audit_logs`, `equipement_cost_config`, `item_packaging_units`, `item_stocks`, `items`, `opportunities`, `order_item`, `order_production_history`, `orders`, `product_image`, `product_spec_groups`, `product_specifications`, `refresh_tokens`, `spec_reference_lists`, `spec_reference_values`, `units` |
| **`EMPTY`** (aucune ligne — pas de signal, à vérifier via le code) | tout le reste (voir tableau §5) |

Le cas `contacts` (6 uuid / 14 préfixé) est le plus préoccupant : ce n'est pas juste de vieilles données de seed, ça sent un **deuxième chemin de création qui ne passe pas par `generateId()`** (ex. inscription libre côté vitrine vs création admin) — à investiguer avant de décider quoi faire (voir Phase 2).

### 2.3 Utilisation réelle de `generateId(ID_PREFIXES.X)` (code de service, hors `.spec.ts`)

37 clés sur 66 définies sont effectivement appelées dans un `.create()` de service :

```
ABSENCE, ACCOUNT, ACCOUNTINGACCOUNT, ACCOUNTINGJOURNAL, ACCOUNTINGPERIOD, ATTENDANCE,
CONTACT, CONTRACT, CREDITACCOUNT, EMPLOYEE, EMPLOYEEDOCUMENT, EMPLOYEELEAVEBALANCE,
EMPLOYEELEAVERECORD, EMPLOYEEPERFORMANCEREVIEW, EMPLOYEEPOSITIONHISTORY, EMPLOYEETRAINING,
EXPENSE, FIXEDASSET, INTERACTION, JOURNALENTRY, JOURNALENTRYLINE, LONGTERDEBT,
MAINTENANCERECORD, NEWSLETTER, OPPORTUNITY, OPPORTUNITYPRODUCT, ORDERPRODUCTIONHISTORY,
PAYROLL, PRODUCTIMAGE, PROFORMA, PROFORMAITEM, SECRETARIATASK, SUBSIDIARY, SUPPLIER,
TAXRATE, TREASURY, USER
```

Piège relevé pendant l'audit : `PRODUCT` et `ORDER` apparaissaient "utilisés" dans un premier grep, mais uniquement depuis `generate-id.util.spec.ts` — **aucun code de service réel** ne les appelle. D'où le classement `uuid-only` de `items`/`orders` ci-dessus malgré la présence de ces clés dans le registre.

## 3. Objectif cible

- Chaque table a **un seul et même format d'ID** pour toutes ses lignes, passées et futures.
- Chaque modèle utilise `generateId(ID_PREFIXES.X)` explicitement dans tous ses chemins de création.
- Aucun champ `schema.prisma` n'est annoté `@db.Uuid` (plus aucun ne reflète la réalité physique).
- `@default(uuid())` est retiré modèle par modèle une fois son unique chemin de création confirmé migré, pour qu'un oubli futur échoue bruyamment (id manquant = erreur Prisma explicite) plutôt que de retomber silencieusement sur un vrai UUID.

## 4. Non-objectifs / risques écartés

- **On ne renomme pas les IDs déjà en base.** Une ligne existante en format UUID reste un ID opaque valide à vie — la réécrire impliquerait de mettre à jour en cascade toutes les FK qui la référencent ailleurs dans la base, un risque bien plus élevé que le bénéfice cosmétique. Seule la **génération de nouvelles lignes** est concernée.
- **Aucune migration destructive de colonnes.** Toutes les `ALTER COLUMN ... TYPE TEXT` sont des no-op physiques (déjà TEXT) — confirmé Phase 1 ci-dessous.
- Les 3 tables `MIXTE` ne seront pas "corrigées" par un script de renommage automatique sans un point de décision explicite (voir Phase 2) — il faut d'abord comprendre POURQUOI elles sont mixtes.

## 5. Plan par phases

### Phase 0 — déjà livrée (cette session)
Correction du bug initial : suppression de `@db.Uuid` sur `EquipementCostConfig.equipmentId`/`.updatedById`, `CommercialParams.updatedById`, `StockMovement.createdById`. Migration `20260727132446_fix_user_id_uuid_text_drift` appliquée. Vérifié par un upsert réel.

### Phase 1 — Nettoyage schéma : retirer tous les `@db.Uuid` restants
Mécanique, zéro risque (confirmé §2.1 : 0 colonne réellement uuid en base).

44 champs sur 15 modèles à traiter (liste complète, issue de l'audit) :

| Modèle | Champs `@db.Uuid` à retirer |
|---|---|
| `RefreshToken` | `id`, `userId` |
| `AuthAuditLog` | `id`, `userId` |
| `Item` | `id`, `mainSupplierId`, `baseUnitId` |
| `Unit` | `id` |
| `ItemPackagingUnit` | `id`, `itemId`, `unitId` |
| `ItemStock` | `id`, `itemId`, `subsidiaryId` |
| `StockMovement` | `id`, `itemId`, `subsidiaryId`, `orderId`, `purchaseOrderId` |
| `ProductImage` | `productId` |
| `ProductSpecGroup` | `id`, `productId` |
| `ProductSpecification` | `id`, `productId`, `groupId` |
| `SpecReferenceList` | `id` |
| `SpecReferenceValue` | `id`, `listId` |
| `OrderItem` | `productId`, `orderId` |
| `PurchaseOrderItem` | `purchaseOrderId`, `productId`, `purchaseUnitId` |
| `ProductionWorkflow` | `id`, `itemId` |
| `ProductionWorkflowStep` | `id`, `workflowId`, `equipmentId` |
| `OrderItemProductionStep` | `id`, `orderItemId`, `equipmentId` |
| `OrderItemProductionSummary` | `id`, `orderItemId` |
| `ProformaItem` | `productId` |

Étapes :
1. Retirer `@db.Uuid` sur chaque ligne ci-dessus dans `schema.prisma`.
2. `npx prisma format` puis `npx prisma generate`.
3. **Ne pas utiliser `prisma migrate dev`** (le remplissage de la shadow DB par rejeu de l'historique de migrations ne correspond pas à l'état réel de la base — déjà rencontré en Phase 0, cf. erreurs "no cast exists" sur des tables même pas touchées). Écrire la migration SQL à la main (uniquement des `ALTER COLUMN ... TYPE TEXT`, no-op) et l'appliquer via `npx prisma migrate deploy`, comme en Phase 0.
4. `npx tsc --noEmit` côté backend pour valider.

### Phase 2 — Résoudre les 3 tables `MIXTE`
1. **`contacts`** — ✅ **résolu** pendant la Phase 3/E-commerce-Item : le chemin manquant était `prisma/seeders/movements.seeder.ts` (`prisma.contact.upsert` sans `generateId()`), corrigé. Les 6 lignes déjà en UUID restent telles quelles (non-objectif §4) ; à confirmer qu'aucun autre chemin (ex. inscription libre côté vitrine) n'a été manqué avant de cocher définitivement.
2. **`subsidiaries`** : probablement une filiale bootstrap/seed créée avant l'introduction de `generateId()` pour ce modèle. Vérifier `prisma/seeds.ts` et tout script de seed filiale. Corriger le chemin de création s'il existe encore en prod (`subsidiaries.service.ts`).
3. **`tax_rates`** : idem, vérifier `ecommerce/taxes/taxes.service.ts` — `TAXRATE` est dans les clés utilisées (§2.3), donc un chemin est déjà bon ; trouver le second chemin qui ne l'utilise pas (seed ? migration de données ? création via un autre service qui touche `TaxRate` directement ?).

### Phase 3 — Généraliser `generateId()` sur les tables `uuid-only`
Pour chacune des 17 tables listées en `uuid-only` (§2.2) :
1. Localiser le(s) service(s) `.create()` correspondant(s).
2. Ajouter `id: generateId(ID_PREFIXES.X)` à l'appel Prisma.
3. Si la clé n'existe pas encore dans `id-prefixes.const.ts` (à vérifier au cas par cas — plusieurs existent déjà mais ne sont pas branchées, cf. piège `PRODUCT`/`ORDER` en §2.3), l'ajouter avec un préfixe 3 lettres unique.
4. Une fois TOUS les chemins de création d'un modèle confirmés migrés, retirer `@default(uuid())` de son champ `id` dans `schema.prisma` (empêche tout oubli futur de retomber silencieusement sur un UUID — Prisma lèvera une erreur explicite "id manquant" à la place).

Modèles concernés (regrouper par domaine pour limiter le nombre de PR/sessions) :
- **E-commerce/Item** — ✅ fait (voir §7). `Item`, `ItemPackagingUnit`, `ItemStock`, `ProductImage`, `ProductSpecGroup`, `ProductSpecification`, `SpecReferenceList`, `SpecReferenceValue`, `Unit`, `StockMovement`.
- **Ventes** : `Order`/`OrderItem`/`OrderProductionHistory` — seeder fait (§7), **services runtime restants** (`orders.service.ts` et tout autre point de création de commande, ex. checkout vitrine).
- **CRM** : `Account` (prefixe `ACCOUNT` déjà utilisé ailleurs — vérifier le chemin manquant), `Opportunity` (idem `OPPORTUNITY`).
- **Auth/infra** : `RefreshToken`, `AuthAuditLog` — analyser si un prefixe a du sens ici (ce sont des logs/tokens techniques, peut-être hors périmètre de la convention métier ; à trancher).
- **Production** : `EquipementCostConfig` (déjà corrigé pour le typage en Phase 0, migration de génération d'id encore à faire — prefixe à créer, ex. `EQUIPEMENTCOSTCONFIG: 'ECC'`).

> Note : pour `ProductImage`, `Order`, `Account`, `Opportunity`, `OrderProductionHistory` — le préfixe existe et EST utilisé quelque part dans le code, mais la table est pourtant 100% uuid. Ça veut dire que le chemin de création qui utilise `generateId()` n'est peut-être pas celui qui alimente ces tables (mauvais modèle Prisma visé, ou code mort). Ça mérite une vérification ciblée avant de toucher au schéma, sinon on risque de dupliquer un correctif qui ne s'applique pas au bon endroit.

### Phase 4 — Vérification
1. `npx tsc --noEmit` (backend) après chaque lot de changements.
2. `npm run lint` backend.
3. Test manuel ciblé par domaine touché (créer une ligne, vérifier le format d'id en base, vérifier qu'aucune requête ne 500).
4. Mettre à jour ce document au fur et à mesure (cocher les phases/domaines terminés) plutôt que de le considérer figé.

## 6. Séquencement recommandé

1. Phase 1 (nettoyage schéma) — peut se faire en une seule fois, risque nul, gros effet de bord positif immédiat (élimine tout risque de futur crash "invalid input syntax for type uuid" sur les 44 champs restants).
2. Phase 3 par domaine, en commençant par **Production** (déjà en cours de correction, contexte frais) puis **E-commerce/Item** (le plus gros volume de données : `items` 78 lignes, `item_stocks` 48, `item_packaging_units` 44).
3. Phase 2 (les 3 tables mixtes) en parallèle ou juste après, une fois les chemins de création de `Contact`/`Subsidiary`/`TaxRate` bien compris.
4. Phase 4 en continu à chaque lot.

## 7. Statut d'exécution — tout terminé

- [x] **Phase 0** — bug initial (EquipementCostConfig, CommercialParams, StockMovement).
- [x] **Phase 1** — nettoyage `@db.Uuid` (44 champs, 19 modèles). Migration `20260727140454_id_prefixes_phase1_drop_uuid_type` appliquée.
- [x] **Phase 2** — les 3 tables mixtes, toutes résolues :
  - **`contacts`** (6 uuid / 14 préfixé) — cause : `prisma/seeders/movements.seeder.ts` créait des `Contact` sans `generateId()`. Corrigé. Tous les autres chemins (`contacts.service.ts` ×2 — création admin et auto-inscription vitrine —, `contact.seeder.ts`, `contact-cities.seeder.ts` ×2) étaient déjà corrects.
  - **`subsidiaries`** (3 uuid / 1 préfixé) — cause : `prisma/seeders/subsidiary.seeder.ts` n'avait un `id` explicite que sur la première filiale (Douala) ; Siège, Kribi et Edéa en étaient dépourvues. Corrigé, et bug connexe réparé au passage : l'`upsert` réutilisait le même objet pour `update`/`create`, ce qui aurait fait réécrire l'`id` d'une filiale existante à chaque reseed — séparé proprement.
  - **`tax_rates`** (2 uuid / 1 préfixé) — cause : `prisma/seeders/tax_rate.seeder.ts` contenait un vrai bug de duplication (code mort) : un `create` inconditionnel sans id, suivi d'un `if(existing)/else` où `existing` était toujours faux à ce stade (déjà filtré plus haut par un `continue`) — donc la branche `else` (avec id) s'exécutait aussi, créant deux lignes par taux à chaque run. Logique entièrement réécrite en un seul `find-then-create-or-update` propre.
- [x] **Phase 3** — généralisation `generateId()`, tous domaines :
  - **Production** — `EquipementCostConfig`, `ProductionWorkflow`, `ProductionWorkflowStep`, `CommercialParams`, `OrderItemProductionStep`, `OrderItemProductionSummary`. Prefixes `ECC`, `PWF`, `PWS`, `CPR`, `OPS`, `OPM`. `generateId()` branché partout (services + seeders). `@default(uuid())` retiré. Vérifié (create réel + rollback).
  - **E-commerce/Item** — `Item`, `Unit`, `ItemPackagingUnit`, `ItemStock`, `ProductSpecGroup`, `ProductSpecification`, `SpecReferenceList`, `SpecReferenceValue`, `StockMovement`, `ProductImage`. Prefixes `PRODUCT` (réutilisé), `UNT`, `IPU`, `IST`, `PSG`, `PSF`, `SRL`, `SRV`, `SMV`. `generateId()` branché dans 10 fichiers services + 3 seeders. `@default(uuid())` retiré. Vérifié (create réel multi-modèles + rollback).
  - **Ventes** — `Order`, `OrderItem`, `ProductOption`, `OrderProductionHistory`, `Sale`. `generateId()` branché dans `orders.service.ts` (create principal : order + orderItems imbriqués + productOptions imbriquées + productionHistory imbriquée, et le `sale.createMany` post-paiement), `sales.service.ts` (vente directe), et `order.seeder.ts` (3 commandes de démo, chacune avec ses steps imbriqués). `@default(uuid())` retiré des 5 modèles. Vérifié (create réel Order+OrderItem + rollback).
  - **CRM** — `Account`, `Opportunity`, `OpportunityProduct`. Les chemins runtime (`accounts.service.ts`, `opportunities.service.ts`) étaient déjà corrects. Deux chemins manquants trouvés et corrigés : `leads.service.ts` (conversion lead→opportunité) et `prisma/seeders/opportunity.seeder.ts` (compte + opportunité de démo) — **c'est ce dernier qui explique le 100% uuid observé sur `accounts`/`opportunities`** malgré le préfixe déjà utilisé ailleurs (piège identifié en §2.3/§3, confirmé). `@default(uuid())` retiré des 3 modèles. Vérifié (create réel Account+Opportunity + rollback).
  - **Contact** — au passage, tous les chemins vérifiés exhaustivement (5 fichiers) et confirmés propres ; `@default(uuid())` retiré.
  - **Auth/infra** (`RefreshToken`, `AuthAuditLog`) — **décision : pas de migration.** Ce sont des tables techniques internes (tokens de session, journal d'audit), jamais exposées à l'utilisateur ni référencées dans une UI — un préfixe métier n'apporte rien. Laissées en UUID Prisma standard (`@default(uuid())` conservé), sans risque puisque leur typage `@db.Uuid` a déjà été nettoyé en Phase 1.
- [x] **Phase 4** — vérification continue à chaque lot : `tsc --noEmit` propre après chaque étape, migrations appliquées et confirmées (`prisma migrate status` = up to date), client régénéré + serveur redémarré après chaque changement de schéma, et un script de vérification réel (create + rollback) exécuté pour chaque domaine. Lint (`eslint`) vérifié sur les fichiers touchés : aucune erreur nouvelle, tout le bruit constaté est un problème préexistant (fins de ligne CRLF sur tout le repo + `any` non typés déjà présents avant cette session, `strict: false` dans `tsconfig.json`).

### Note transverse : double registre de préfixes
`id-prefixes.const.ts` existe en **deux copies indépendantes** qui avaient déjà divergé avant cette session : `backend/src/common/constants/id-prefixes.const.ts` (services runtime) et `backend/prisma/seeders/id-prefixes.const.ts` (seeders, imports relatifs locaux). Les deux ont été tenues strictement synchronisées pour toutes les clés ajoutées dans cette session, mais elles restent deux sources de vérité distinctes. Nettoyage futur suggéré (hors périmètre de cette migration) : faire pointer les seeders vers la constante unique de `src/common/constants/`.
