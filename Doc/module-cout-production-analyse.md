# Analyse — Module Calcul du Coût de Production

**Date** : 2026-07-21  
**Branche active** : feat/multi-filiale-auth-rbac  
**Statut** : Analyse préalable — aucune modification du code

---

## Cadrage important — Ce module n'est PAS les spécifications

Les spécifications techniques (`ProductSpecification`, Chantier 5) répondent à :
> **Que souhaite le client ?** (format, quantité, dimensions, finitions…)

Ce module répond à :
> **Combien coûte réellement la fabrication de cette commande à l'entreprise ?**

Les deux coexistent dans une commande **mais sont totalement indépendants**.  
Flux commercial concret :
1. Le commercial sélectionne un service dans la commande
2. Il renseigne les spécifications du service (ce que veut le client)
3. **Ensuite**, il accède à la section "Coût de production" : les machines sont pré-chargées si un workflow existe, il ajuste les temps, saisit sa marge négociée, le système calcule le prix
4. Le prix calculé part dans la commande

---

## 1. Analyse de l'existant pertinent

### 1.1 Module Équipements (`backend/src/maintenance/equipement/`)

**Modèle Prisma actuel** (`schema.prisma:1082-1099`) :

```
Equipement {
  id                   UUID
  equipmentName        VARCHAR(255)
  lastMaintenanceDate  DateTime
  nextMaintenanceDate  DateTime
  acquisitionDate      DateTime
  acquisitionValue     Decimal(15,2)   ← coût d'acquisition comptable
  subsidiaryId         FK → Subsidiary
  status               EquipmentStatus (OPERATIONAL / NEEDS_MAINTENANCE / OUT_OF_SERVICE)
  maintenanceRecords[] → MaintenanceRecord[]
}
```

**Constat** : cette table appartient au module Maintenance. Elle ne sera **pas modifiée**. Le coût d'utilisation horaire d'une machine est une donnée commerciale/production — elle aura sa propre table dédiée, séparée.

Les endpoints CRUD complets existent (create, findAll, findOne, update, remove, search). Le module Maintenance n'est pas touché.

### 1.2 Module Commandes (`backend/src/ecommerce/orders/`)

**Modèle OrderItem** (`schema.prisma:739-763`) :

```
OrderItem {
  id             UUID
  quantity       Int
  unitPrice      Decimal(15,2)   ← prix négocié commercial (jamais tiré du catalogue)
  discount       Decimal(15,2)
  total          Decimal(15,2)   ← figé à la création
  specValues     JSON            ← valeurs saisies par le commercial (specs techniques)
  specSnapshot   JSON            ← instantané figé du formulaire de specs
  productId      FK → Item
  orderId        FK → Order
}
```

**Constat critique** : la logique d'instantané figé est déjà maîtrisée dans le code (`orders.service.ts:180-181`, commentaires explicites). La même philosophie s'applique au coût de production : **tous les coûts horaires et temps doivent être figés dans la commande au moment de la création**. Une modification ultérieure du coût horaire d'une machine n'affecte pas les anciennes commandes.

Il n'y a **aucune donnée de coût de production** dans `OrderItem` aujourd'hui. Tout est à créer.

### 1.3 Module Produits/Services (`backend/src/ecommerce/products/`)

**Modèle Item** (`schema.prisma:186-228`) : unifié SERVICE/STOCK_PRODUCT. Pas d'association à un workflow de production. La `ProductSpecification` (`schema.prisma:373-407`) est le formulaire de specs du service — indépendant de ce module.

### 1.4 Paramètres commerciaux

**Inexistants**. Aucune table de configuration des marges dans le schéma. À créer entièrement.

### 1.5 Workflows de production

**Inexistants**. Aucune table, aucun concept de processus de fabrication dans le schéma ou les modules NestJS. À créer entièrement.

### 1.6 Frontend — pages existantes concernées

| Page | Rôle actuel |
|---|---|
| `Frontend/Pages/NewOrder.tsx` | Création commande — saisie des lignes avec prix négocié et specs |
| `Frontend/Pages/Equipements.tsx` | CRUD équipements (maintenance) — **non modifié** |
| `Frontend/Pages/Production.tsx` | Suivi statut de production des commandes |

`NewOrder.tsx` est la page principale à étendre pour la saisie du coût de production.

---

## 2. Analyse de la proposition

### 2.1 Points solides et alignés avec l'existant

- **Instantané figé** : les coûts horaires et les temps saisis sont gelés dans la commande. Cohérent avec le pattern `unitPrice` / `specSnapshot` déjà en place.

- **Table séparée pour les coûts horaires** : séparer les données financières de production de la table `Equipement` (qui appartient à la Maintenance) est la bonne décision architecturale. Couplage minimal entre modules.

- **Workflows globaux** : un workflow est associé à un service (un catalogue de services est global), il est donc logique que les workflows le soient aussi. Pas de duplication par filiale.

- **Workflow = proposition non contraignante** : le commercial garde la main totale sur les machines, les temps, et l'ordre. Le workflow est uniquement un point de départ.

- **Contrôle de la marge côté backend** : le backend est l'autorité pour valider que la marge est dans l'intervalle autorisé. Le frontend calcule en temps réel pour l'UX, mais la validation finale est serveur.

### 2.2 Décisions actées

**`CommercialParams` : global (singleton)**  
Une seule ligne en base, pas de `subsidiaryId`. Le Super Admin configure une fois pour toute la plateforme. Si la table est vide, le backend refuse toute création de commande avec coût de production jusqu'à ce que les bornes soient définies.

**`unitPrice` dans `OrderItem` : le prix calculé est le prix de la commande**  
Le prix final (coût de production + marge) devient directement le `unitPrice` de la ligne. Ce n'est plus saisi manuellement pour les services — c'est le résultat du calcul. Cohérent avec la proposition : le commercial ne calcule rien, le système le fait.

**Unité de temps : heures décimales (`Decimal(5,2)`)**  
1.5 = 1h30, 0.5 = 30min. Plus lisible dans les formulaires, cohérent avec les autres champs `Decimal` du schéma.

**Périmètre : services uniquement (`ItemType.SERVICE`)**  
Les produits stock (`ItemType.STOCK_PRODUCT`) ont un coût d'achat connu via les bons de commande fournisseur. La section coût de production n'apparaît que pour les lignes de commande de type SERVICE.

---

## 3. Faisabilité

**Faisable. Aucun obstacle architectural.**

Architecture NestJS modulaire, Prisma extensible, pattern d'instantané figé déjà maîtrisé. Pas de dette technique bloquante.

**Points d'attention** :
- La validation de la marge doit être recalculée côté backend à la création de la commande — jamais faire confiance au calcul frontend.
- La transaction Prisma de création de commande devra englober les `OrderItemProductionStep` et `OrderItemProductionSummary` pour garantir la cohérence.
- La table `EquipementCostConfig` référence `Equipement` mais vit dans un module production — bien définir quel module possède cet endpoint (Super Admin production, pas Maintenance).

---

## 4. Charge de travail — Ce qu'il faut faire

### 4.1 Backend — Prisma Schema (nouvelles tables)

**Règle** : la table `Equipement` n'est pas touchée.

| # | Action | Complexité |
|---|---|---|
| B1 | Créer `EquipementCostConfig` (id, equipmentId FK unique → Equipement, hourlyRate Decimal(15,2), updatedAt, updatedById FK → User) — coût horaire d'utilisation, indépendant du module Maintenance | Faible |
| B2 | Créer `ProductionWorkflow` (id, name, description, itemId FK unique → Item, isActive Boolean) — global, pas de subsidiaryId | Faible |
| B3 | Créer `ProductionWorkflowStep` (id, workflowId FK → ProductionWorkflow, equipmentId FK → Equipement, stepOrder Int) — liste ordonnée de machines | Faible |
| B4 | Créer `CommercialParams` (id, minMarginPercent Decimal(5,2), maxMarginPercent Decimal(5,2)) — singleton global, pas de subsidiaryId | Faible |
| B5 | Créer `OrderItemProductionStep` (id, orderItemId FK → OrderItem, equipmentId FK → Equipement, equipmentNameSnapshot VarChar, stepOrder Int, estimatedTimeHours Decimal(5,2), hourlyRateSnapshot Decimal(15,2), calculatedCost Decimal(15,2)) — données figées à la création | Moyen |
| B6 | Créer `OrderItemProductionSummary` (id, orderItemId FK unique → OrderItem, totalProductionCost Decimal(15,2), marginPercent Decimal(5,2), finalPrice Decimal(15,2)) — figé | Faible |
| B7 | Générer et appliquer la migration Prisma | Faible |

**Effort** : ~0,5 journée

---

### 4.2 Backend — Nouveau module `equipment-cost-config`

Nouveau module NestJS : `backend/src/ecommerce/production/equipment-cost-config/`  
Ce module expose les coûts horaires des machines pour le Super Admin et pour les workflows. Il ne modifie pas le module Maintenance.

| # | Action | Complexité |
|---|---|---|
| B8 | `equipment-cost-config.module.ts`, `controller.ts`, `service.ts` | Faible |
| B9 | `POST /production/equipment-costs` — créer/mettre à jour le coût horaire d'un équipement (upsert par equipmentId), protégé SUPER_ADMIN | Faible |
| B10 | `GET /production/equipment-costs` — liste tous les équipements avec leur coût horaire (joint `Equipement` + `EquipementCostConfig`), filtrable par filiale et par coût renseigné | Faible |
| B11 | `GET /production/equipment-costs/:equipmentId` — détail d'un équipement avec son coût | Faible |
| B12 | DTOs de validation : `UpsertEquipmentCostDto` (equipmentId UUID, hourlyRate Min(0)) | Faible |

**Effort** : ~3h

---

### 4.3 Backend — Nouveau module `production-workflows`

Nouveau module NestJS : `backend/src/ecommerce/production/production-workflows/`  
Global — pas de subsidiaryId. Chaque service peut avoir au maximum un workflow associé.

| # | Action | Complexité |
|---|---|---|
| B13 | `production-workflows.module.ts`, `controller.ts`, `service.ts` | Faible |
| B14 | `POST /production/workflows` — créer un workflow (nom, description, itemId optionnel, steps[]) — SUPER_ADMIN | Moyen |
| B15 | `GET /production/workflows` — liste tous les workflows (avec steps et équipements) | Faible |
| B16 | `GET /production/workflows/:id` — détail complet d'un workflow | Faible |
| B17 | `PATCH /production/workflows/:id` — modifier nom, description, isActive, steps | Moyen |
| B18 | `DELETE /production/workflows/:id` — supprimer | Faible |
| B19 | `GET /production/workflows/resolve/:itemId` — endpoint clé : retourne le workflow associé au service, avec pour chaque step : nom machine, stepOrder, et coût horaire actuel depuis `EquipementCostConfig` (pour pré-remplir le formulaire de commande) | Moyen |
| B20 | DTOs : `CreateWorkflowDto`, `UpdateWorkflowDto`, `WorkflowStepDto` (equipmentId, stepOrder) | Faible |
| B21 | Enregistrer le module dans `app.module.ts` | Faible |

**Effort** : ~1 journée

---

### 4.4 Backend — Nouveau module `commercial-params`

Nouveau module NestJS : `backend/src/ecommerce/production/commercial-params/`

| # | Action | Complexité |
|---|---|---|
| B22 | `commercial-params.module.ts`, `controller.ts`, `service.ts` | Faible |
| B23 | `GET /production/commercial-params` — récupère le singleton global (accessible à tous les commerciaux connectés pour validation côté frontend) | Faible |
| B24 | `PUT /production/commercial-params` — upsert du singleton, SUPER_ADMIN seulement | Faible |
| B25 | DTOs : `UpsertCommercialParamsDto` (minMarginPercent, maxMarginPercent — validation : 0 < min < max ≤ 100) | Faible |

**Effort** : ~3h

---

### 4.5 Backend — Extension du module Commandes

Étendre la création de commande pour y intégrer le coût de production par ligne de service.

| # | Action | Fichier | Complexité |
|---|---|---|---|
| B26 | Ajouter `productionSteps[]` (optionnel) et `productionSummary` (optionnel) dans `CreateOrderItemDto` — présents uniquement pour les services avec calcul de coût | `dto/create-order.dto.ts` | Moyen |
| B27 | Dans `orders.service.ts > createBySalesRep()` : si `productionSteps` présents → (1) récupérer `CommercialParams` de la filiale, (2) valider que `marginPercent` est dans [min, max], (3) recalculer le coût total côté backend pour vérifier cohérence, (4) créer `OrderItemProductionStep[]` et `OrderItemProductionSummary` dans la même transaction Prisma | `orders.service.ts` | Élevé |
| B28 | Dans `findOne()` : inclure `productionSteps` et `productionSummary` dans la réponse d'une commande | `orders.service.ts` | Faible |
| B29 | Ajouter les types TypeScript correspondants dans `Frontend/types/models.ts` | `types/models.ts` | Faible |

**Effort** : ~1 journée

---

### 4.6 Vue consolidée Super Admin — Principe architectural (toutes les pages)

Le Super Admin supervise toutes les filiales. Sur **toutes** les pages admin de ce module, il voit les données de l'ensemble des filiales et dispose d'un filtre par filiale en haut de page. C'est le comportement par défaut partout, sans exception.

**Règle backend uniforme** : chaque endpoint admin accepte `?subsidiaryId=` en query param optionnel.
- SUPER_ADMIN sans param → toutes filiales confondues
- SUPER_ADMIN avec param → filiale ciblée uniquement
- Autre rôle → scopé automatiquement sur sa filiale, le param est ignoré

**Règle frontend uniforme** : chaque page admin charge la liste de toutes les filiales au montage (`GET /subsidiaries`), affiche un sélecteur "Toutes les filiales / Filiale X" en haut de page, et passe `subsidiaryId` dans les appels API quand une filiale est sélectionnée.

Comportement de la vue consolidée selon la nature des données :

| Page | Nature des données | Effet du filtre filiale |
|---|---|---|
| `EquipementCosts.tsx` | `Equipement` scopé par filiale | Filtre les machines affichées |
| `ProductionWorkflows.tsx` | Workflows globaux, mais les machines dans les steps appartiennent à des filiales | Filtre les workflows qui utilisent des machines de la filiale sélectionnée |
| `CommercialParams.tsx` | Singleton global | Filtre désactivé — affiché mais grisé avec mention "Configuration globale" |

| # | Action | Complexité |
|---|---|---|
| B30 | Dans chaque service admin (equipment-cost-config, production-workflows) : implémenter la logique de filtre `subsidiaryId` optionnel selon le rôle | Moyen |
| B31 | Enrichir les réponses avec `subsidiaryId` + `subsidiaryName` sur chaque entité retournée (jointure `→ Subsidiary`) pour permettre l'affichage de la colonne Filiale | Faible |
| B32 | `GET /subsidiaries` accessible au SUPER_ADMIN (existant ou à vérifier) pour alimenter le dropdown de filtre côté frontend | Faible |

---

### 4.7 Frontend — Page configuration des coûts horaires (Super Admin)

Nouvelle page : `Frontend/Pages/EquipementCosts.tsx`

| # | Action | Complexité |
|---|---|---|
| F1 | Page `EquipementCosts.tsx` : tableau consolidé toutes filiales, colonnes : **Filiale** / Équipement / Statut / Coût/heure | Moyen |
| F2 | Sélecteur filiale en haut (pattern uniforme) — sans sélection = toutes filiales ; avec sélection = filtre actif + colonne Filiale masquée | Moyen |
| F3 | Bouton "Définir le coût" par équipement → modal de saisie (hourlyRate) | Faible |
| F4 | Badge "Non configuré" pour les équipements sans coût horaire | Faible |
| F5 | Service API : `Frontend/services/apiProduction/apiEquipementCosts.ts` (param `subsidiaryId` optionnel) | Faible |
| F6 | Route dans `router.tsx` (protégée SUPER_ADMIN) | Faible |
| F7 | Traductions i18n | Faible |

**Effort** : ~5h

---

### 4.8 Frontend — Page gestion des Workflows (Super Admin)

Nouvelle page : `Frontend/Pages/ProductionWorkflows.tsx`

| # | Action | Complexité |
|---|---|---|
| F8 | Page `ProductionWorkflows.tsx` : liste consolidée de tous les workflows, colonnes : Nom / Service associé / Machines utilisées / Statut | Moyen |
| F9 | Sélecteur filiale en haut (pattern uniforme) — filtre les workflows qui contiennent au moins une machine appartenant à la filiale sélectionnée | Moyen |
| F10 | Formulaire création/édition : nom, description, service associé (dropdown `Item` SERVICE, optionnel), liste ordonnée des étapes | Élevé |
| F11 | Dans le formulaire, dropdown machines : filtrable par filiale (sélecteur interne au dropdown), affichage du nom de la filiale de chaque machine, coût horaire en lecture seule | Moyen |
| F12 | Bouton "Ajouter une machine" | Faible |
| F13 | Service API : `Frontend/services/apiProduction/apiProductionWorkflows.ts` | Faible |
| F14 | Route dans `router.tsx` (protégée SUPER_ADMIN) | Faible |
| F15 | Traductions i18n | Faible |

**Effort** : ~1,5 journées

---

### 4.9 Frontend — Page Paramètres Commerciaux (Super Admin)

Nouvelle page : `Frontend/Pages/CommercialParams.tsx`  
Singleton global — le sélecteur filiale est présent (cohérence UX) mais grisé avec la mention "Configuration globale — s'applique à toutes les filiales".

| # | Action | Complexité |
|---|---|---|
| F16 | Sélecteur filiale présent mais désactivé, mention "Configuration globale" | Faible |
| F17 | Formulaire : marge min (%), marge max (%), sauvegarde via PUT | Faible |
| F18 | Affichage des valeurs actuelles, validation inline : min < max | Faible |
| F19 | Service API : `Frontend/services/apiProduction/apiCommercialParams.ts` | Faible |
| F20 | Route dans `router.tsx` (protégée SUPER_ADMIN) | Faible |
| F21 | Traductions i18n | Faible |

**Effort** : ~3h

---

### 4.10 Frontend — Extension de la création de commande (`NewOrder.tsx`)

Chantier frontend principal. Après la saisie des specs d'un service, le commercial voit apparaître la section "Coût de production" pour cette ligne.

| # | Action | Complexité |
|---|---|---|
| F19 | Au montage de `NewOrder.tsx` : charger le singleton `CommercialParams` global (1 appel API, gardé en état local pour la validation de marge) | Faible |
| F20 | Au moment où le commercial ajoute un **service** au panier : appel `GET /production/workflows/resolve/:itemId` → si workflow existant, pré-remplir les machines avec leurs temps à zéro ; si aucun workflow, section vide | Moyen |
| F21 | Nouveau composant `ProductionCostSection` (affiché **uniquement pour les lignes SERVICE**, invisible pour les produits stock) : liste des étapes machines, champ temps en heures décimales (ex : 1.5) par machine, coût horaire en lecture seule, coût calculé par machine en temps réel | Élevé |
| F22 | Actions commercial dans `ProductionCostSection` : ajouter une machine (dropdown), supprimer, réordonner (haut/bas) | Moyen |
| F23 | Calcul automatique : `temps × coûtHoraire` par machine, total production affiché en bas de section | Faible |
| F24 | Champ "Marge % négociée" avec validation temps réel (bornes min/max depuis `CommercialParams`) et affichage du **prix final = coût total + (coût total × marge%)** — ce prix devient le `unitPrice` de la ligne | Moyen |
| F25 | Modification de `buildItems()` dans `NewOrder.tsx` : pour une ligne SERVICE avec coût de production, inclure `productionSteps[]` et `productionSummary` dans le payload ; `unitPrice` = prix calculé | Moyen |
| F26 | Lignes SERVICE sans coût de production renseigné : payload sans `productionSteps` (optionnel), `unitPrice` reste saisi manuellement comme aujourd'hui | Faible |
| F27 | Traductions i18n complètes (labels, messages d'erreur marge hors intervalle, unité "h") | Faible |

**Effort** : ~2 journées

---

### 4.11 Frontend — Affichage du coût de production dans le détail d'une commande

| # | Action | Complexité |
|---|---|---|
| F28 | Dans la vue détail d'une commande : afficher la section "Coût de production" par ligne de service (tableau des étapes figées) | Moyen |
| F29 | Tableau : Machine / Temps / Coût horaire (figé) / Coût calculé, puis sous-total production, marge %, prix final | Moyen |
| F30 | Si aucun coût de production renseigné pour une ligne : section absente (pas d'affichage vide) | Faible |
| F31 | Traductions i18n | Faible |

**Effort** : ~4h

---

## 5. Récapitulatif de la charge de travail

| Domaine | Tâches | Effort estimé |
|---|---|---|
| Schema Prisma + migration (6 nouvelles tables) | B1 → B7 | 0,5 jour |
| Module `equipment-cost-config` (backend) | B8 → B12 | 3h |
| Vue consolidée Super Admin (backend) | B30 → B31 | 2h |
| Module `production-workflows` (backend) | B13 → B21 | 1 jour |
| Module `commercial-params` (backend) | B22 → B25 | 3h |
| Extension module Commandes (backend) | B26 → B29 | 1 jour |
| Vue consolidée Super Admin (backend — tous modules) | B30 → B32 | 3h |
| Page coûts horaires machines — vue consolidée (frontend) | F1 → F7 | 5h |
| Page gestion workflows — vue consolidée (frontend) | F8 → F15 | 1,5 jours |
| Page paramètres commerciaux — filtre grisé (frontend) | F16 → F21 | 3h |
| Extension création commande (frontend) | F21 → F29 | 2 jours |
| Affichage détail commande (frontend) | F30 → F33 | 4h |
| **Total** | **33 tâches** | **~9 jours** |

---

## 6. Ordre d'implémentation recommandé

```
Sprint 1 — Fondations (backend uniquement)
  B1-B7   : Schema + migration (6 nouvelles tables)
  B8-B12  : Module equipment-cost-config
  B22-B25 : Module commercial-params

Sprint 2 — Workflows + interfaces admin (backend + frontend)
  B30-B32 : Vue consolidée Super Admin (backend — pattern uniforme)
  B13-B21 : Module production-workflows
  F1-F7   : Page coûts horaires machines — vue consolidée
  F16-F21 : Page paramètres commerciaux
  F8-F15  : Page gestion workflows — vue consolidée

Sprint 3 — Calcul intégré aux commandes
  B26-B29 : Extension création commande (backend)
  F19-F27 : Extension NewOrder.tsx (frontend)
  F28-F31 : Affichage détail commande (frontend)
```

Le Sprint 1 est entièrement backend — le Super Admin peut déjà configurer les données (coûts horaires, marges, workflows) avant que l'UI commercial soit prête.

---

## 7. Décisions de conception — Toutes actées

| Décision | Choix retenu |
|---|---|
| Périmètre `CommercialParams` | Global — singleton, pas de `subsidiaryId` |
| `unitPrice` pour les services | Le prix calculé (coût + marge) **est** le `unitPrice` de la ligne |
| Unité de temps | Heures décimales `Decimal(5,2)` — ex : 1.5 = 1h30 |
| Périmètre du module | Services (`ItemType.SERVICE`) uniquement — produits stock exclus |
| Table coûts horaires machines | Table dédiée `EquipementCostConfig` — `Equipement` non modifiée |
| Périmètre des workflows | Global — pas de `subsidiaryId` |
