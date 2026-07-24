# Analyse — Vue consolidée Super Admin sur toutes les pages

**Date** : 2026-07-21  
**Statut** : Analyse préalable — aucune modification du code

---

## Contexte

Le Super Admin supervise toutes les filiales. Sur chaque page de l'application, il doit :
- Voir **toutes les données de toutes les filiales** par défaut (vue consolidée)
- Pouvoir **filtrer par filiale** via un sélecteur en haut de page

Ce document couvre les 14 pages protégées de l'application, groupées par section métier.

---

## Constat architectural actuel

Le commentaire dans `Sidebar.tsx` l. 134-136 indique déjà la direction :
> "SUPER_ADMIN voit exactement les mêmes vues qu'ADMIN — seule la donnée affichée diffère (consolidée toutes filiales), résolu côté backend via subsidiary-scope."

**Ce qui existe déjà :**
- Un state `selectedSubsidiaryId` est déclaré dans `Analytics.tsx` mais **non branché** sur les appels API
- Certains services acceptent déjà un `subsidiaryId` optionnel en paramètre (voir détail par page)
- Le reste est scopé automatiquement par le token côté backend, sans possibilité de drill-down par filiale

**Ce qui manque partout :**
- Aucun sélecteur de filiale visible dans l'UI
- Aucun passage de `subsidiaryId` depuis le frontend vers les API qui ne l'acceptent pas encore

---

## Architecture technique recommandée (à implémenter une seule fois)

### A. Composant global `SubsidiarySelector`

Un composant unique `Frontend/components/common/SubsidiarySelector.tsx` placé dans le **Header**, visible uniquement pour le rôle `SUPER_ADMIN`. Il affiche :

- "Toutes les filiales" (valeur par défaut = `null`)
- Liste des filiales : Douala / Siège / Kribi / Edéa

La valeur sélectionnée est stockée dans **AppContext** (déjà existant) comme `selectedSubsidiaryId: string | null`.

### B. Règle backend uniforme

Chaque endpoint qui doit supporter le drill-down filiale accepte `?subsidiaryId=` en query param optionnel :
- **SUPER_ADMIN sans param** → toutes filiales (pas de filtre Prisma sur `subsidiaryId`)
- **SUPER_ADMIN avec param** → filiale ciblée uniquement
- **Autre rôle** → param ignoré, scopé automatiquement sur la filiale du token

### C. Règle frontend uniforme

Chaque page consomme `selectedSubsidiaryId` depuis AppContext et le passe à ses appels API. Quand `selectedSubsidiaryId` change, les données rechargent automatiquement (TanStack Query — `queryKey` inclut `selectedSubsidiaryId`).

| # | Action globale | Complexité |
|---|---|---|
| G1 | Ajouter `selectedSubsidiaryId: string \| null` + `setSelectedSubsidiaryId` dans `AppContext` + reducer | Faible |
| G2 | Créer `SubsidiarySelector.tsx` — dropdown de toutes les filiales (`GET /subsidiaries`), visible SUPER_ADMIN seulement, branché sur AppContext | Moyen |
| G3 | Intégrer `SubsidiarySelector` dans le Header existant | Faible |
| G4 | Vérifier que `GET /subsidiaries` existe et est accessible (sinon : créer l'endpoint) | Faible |

**Effort global** : ~1 journée (fondation de tout le reste)

---

## Section Commerce

### Page Analyses (`/dashboard/`)

5 onglets. State `selectedSubsidiaryId` déjà déclaré dans `Analytics.tsx` mais non utilisé.

| Onglet | Backend supporte `subsidiaryId` ? | Ce qu'il faut faire |
|---|---|---|
| Dashboard | **OUI** — `getDashboardStats(query, subsidiaryId?)` accepte déjà le param | Frontend uniquement : passer `selectedSubsidiaryId` depuis AppContext dans l'appel (state existant, juste à brancher) |
| Analyse des ventes | **NON** — `getSalesAnalysis(query)` sans param | Backend : ajouter `?subsidiaryId=` optionnel + Frontend : passer le param |
| Analyse des achats | **NON** — `getPurchaseAnalysis(query)` sans param | Backend : ajouter `?subsidiaryId=` optionnel + Frontend : passer le param |
| Banques | Scoped par composant `BankView` via prop `subsidiary` | Passer la filiale sélectionnée comme prop au lieu de la filiale du token |
| Caisse / Safe | Même situation que Banques | Idem |

| # | Action | Complexité |
|---|---|---|
| A1 | Frontend : brancher `selectedSubsidiaryId` depuis AppContext dans `getDashboardStats()` (onglet Dashboard) | Faible |
| A2 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /analytics/sales` | Faible |
| A3 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /analytics/purchases` | Faible |
| A4 | Frontend : passer `selectedSubsidiaryId` dans les appels des 4 onglets restants + inclure dans les `queryKey` | Moyen |

**Effort** : ~4h

---

### Page CRM (`/dashboard/crm`)

7 onglets. **Situation la plus avancée de l'app** : tous les services CRM prennent déjà `subsidiaryId` en argument requis.

| Onglet | Backend supporte `subsidiaryId` ? | Ce qu'il faut faire |
|---|---|---|
| Tableau de bord CRM | **NON** — `getCrmAnalysis(query)` sans param | Backend : ajouter `?subsidiaryId=` optionnel |
| Leads | **OUI** — `getLeads(subsidiaryId)` requis | Frontend : passer `selectedSubsidiaryId ?? subsidiary.id` |
| Comptes | **OUI** — `getAccounts(subsidiaryId)` requis | Idem |
| Clients | **OUI** — `getContacts(subsidiaryId)` requis | Idem |
| Contrats | **OUI** — `getContracts(subsidiaryId)` requis | Idem |
| Pipeline | **OUI** — `getOpportunities(subsidiaryId)` requis | Idem |
| Activités | **OUI** — `getCrmTasks(subsidiaryId)`, `getInteractions(subsidiaryId)` requis | Idem |

| # | Action | Complexité |
|---|---|---|
| A5 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /finances-stats/crm-analysis` | Faible |
| A6 | Frontend : sur les 6 onglets avec API déjà prête, remplacer `subsidiary.id` par `selectedSubsidiaryId ?? subsidiary.id` + inclure dans les `queryKey` | Moyen |
| A7 | Frontend : passer `selectedSubsidiaryId` dans l'appel dashboard CRM | Faible |

**Effort** : ~3h

---

### Page Commandes/Ventes (`/dashboard/sales`)

| Vue | Backend supporte `subsidiaryId` ? | Ce qu'il faut faire |
|---|---|---|
| Historique des commandes | **NON** — `getOrders(query?)` sans param | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /ecommerce/orders` + Frontend |
| Top produits vendus | **NON** — `getTopSellingProducts()` sans param | Backend : ajouter `?subsidiaryId=` optionnel |
| Nouvelle commande | Non applicable — la commande est créée dans la filiale du commercial | Pas de filtre |

| # | Action | Complexité |
|---|---|---|
| A8 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /ecommerce/orders` | Faible |
| A9 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /ecommerce/orders/analytics/top-selling` | Faible |
| A10 | Frontend : passer `selectedSubsidiaryId` dans les appels + `queryKey` | Faible |

**Effort** : ~2h

---

### Page Production (`/dashboard/production`)

Kanban des commandes en cours de fabrication. Utilise `GET /ecommerce/orders` (même endpoint que Commandes).

| Backend supporte `subsidiaryId` ? | Ce qu'il faut faire |
|---|---|
| **NON** (couvert par A8 ci-dessus) | Frontend uniquement : passer `selectedSubsidiaryId` dans l'appel de chargement des commandes de production |

| # | Action | Complexité |
|---|---|---|
| A11 | Frontend : passer `selectedSubsidiaryId` dans l'appel de Production.tsx + `queryKey` | Faible |

**Effort** : ~1h

---

### Page Caisse (`/dashboard/caisse`)

La Caisse est physiquement attachée à une filiale (c'est un point de vente). La vue consolidée n'a pas de sens opérationnel ici — un Super Admin ne peut pas "utiliser" la caisse de plusieurs filiales en même temps. En revanche, il peut **consulter** les ventes de toutes les filiales.

| Vue | Backend supporte `subsidiaryId` ? | Ce qu'il faut faire |
|---|---|---|
| Ventes enregistrées | **NON** — `getSales(query?)` sans param | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /ecommerce/sales` |
| Opération de caisse (nouvelle vente / paiement) | Non applicable | Pas de filtre — la caisse est contextualisée à la filiale du token |

| # | Action | Complexité |
|---|---|---|
| A12 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /ecommerce/sales` | Faible |
| A13 | Frontend : si SUPER_ADMIN, afficher un onglet "Vue consolidée" (historique des ventes filtrables) en plus du mode opérationnel | Moyen |

**Effort** : ~3h

---

## Section Opérations

### Page Achats (`/dashboard/purchasing`)

| Backend supporte `subsidiaryId` ? | Ce qu'il faut faire |
|---|---|
| **NON** — `getPurchaseOrders(query?)` sans param | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /purchasing/purchase-orders` + Frontend |

| # | Action | Complexité |
|---|---|---|
| O1 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /purchasing/purchase-orders` | Faible |
| O2 | Frontend : passer `selectedSubsidiaryId` + `queryKey` + afficher colonne Filiale quand vue consolidée | Moyen |

**Effort** : ~2h

---

### Page Stock (`/dashboard/stock`)

3 onglets, tous sans support `subsidiaryId`.

| Onglet | Backend supporte `subsidiaryId` ? | Ce qu'il faut faire |
|---|---|---|
| Niveaux de stock | **NON** — `getStockItemsBySubsidiary()` trompeusement nommé, token-scopé | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /purchase/stock-items` |
| Mouvements de stock | **NON** — `getStockMovements(query?)` sans param | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /purchase/stock-movements` |
| Inventaire | Opération de saisie — pas de vue consolidée (on ajuste l'inventaire d'une filiale à la fois) | Pas de filtre |

| # | Action | Complexité |
|---|---|---|
| O3 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /purchase/stock-items` | Faible |
| O4 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /purchase/stock-movements` | Faible |
| O5 | Frontend : passer `selectedSubsidiaryId` dans les 2 onglets listables + afficher colonne Filiale | Moyen |

**Effort** : ~3h

---

### Page Maintenance (`/dashboard/maintenance`)

| Backend supporte `subsidiaryId` ? | Ce qu'il faut faire |
|---|---|
| **NON** — `getEquipments()` sans param | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /equipements` + Frontend |

| # | Action | Complexité |
|---|---|---|
| O6 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /equipements` | Faible |
| O7 | Frontend : passer `selectedSubsidiaryId` + afficher colonne Filiale | Moyen |

**Effort** : ~2h

---

### Page Équipements (`/dashboard/equipements`)

Même endpoint que Maintenance (`GET /equipements`). La tâche O6 couvre les deux.

| # | Action | Complexité |
|---|---|---|
| O8 | Frontend : passer `selectedSubsidiaryId` dans Equipements.tsx + afficher colonne Filiale (O6 couvre le backend) | Faible |

**Effort** : ~1h

---

## Section Finance & Comptabilité

### Page Finance (`/dashboard/finance`)

8 onglets. Situation **mixte** — certains ont déjà le support `subsidiaryId`, d'autres non.

| Onglet | Backend supporte `subsidiaryId` ? | Ce qu'il faut faire |
|---|---|---|
| Gestion des crédits | **NON** — `getCredit()` sans param | Backend + Frontend |
| Trésorerie | **OUI** — `getTreasuryAccounts(subsidiaryId?)`, `getFinancialTransactions(subsidiaryId?)` | Frontend uniquement |
| Préfinancement | **OUI** — `getPrefinancementAccount/Transactions/Statistics(subsidiaryId?)` | Frontend uniquement |
| Dettes fournisseurs | **NON** — `getSupplierDebts()` sans param | Backend + Frontend |
| Charges | **NON** — `getExpenses()` sans param | Backend + Frontend |
| Compte de résultat (P&L) | **OUI** — `getPnlStatement(query, subsidiaryId?)` | Frontend uniquement |
| Bilan | **OUI** — `getBalanceSheet(subsidiaryId?)` | Frontend uniquement |
| Transactions externes | **OUI** — `getExternalTransactions(subsidiaryId, filters?)` subsidiaryId requis | Déjà fonctionnel — passer `selectedSubsidiaryId ?? subsidiary.id` |

| # | Action | Complexité |
|---|---|---|
| F1 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /ecommerce/orders/credit` | Faible |
| F2 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /finance/debts/supplier` | Faible |
| F3 | Backend : ajouter `?subsidiaryId=` optionnel sur `GET /finance/expenses` | Faible |
| F4 | Frontend : brancher `selectedSubsidiaryId` sur les 5 onglets déjà prêts côté backend (Trésorerie, Préfinancement, P&L, Bilan, Transactions externes) | Moyen |
| F5 | Frontend : brancher `selectedSubsidiaryId` sur les 3 onglets après correction backend (Crédits, Dettes, Charges) | Faible |

**Effort** : ~4h

---

### Page Comptabilité (`/dashboard/accounting`)

8 onglets. Aucun ne supporte `subsidiaryId` — tous scopés par token. La comptabilité est intrinsèquement liée à une entité légale (filiale) dans SYSCOHADA. La vue consolidée multi-filiales en comptabilité a un sens différent (états financiers consolidés = addition de bilans), ce qui est une fonctionnalité complexe dépassant le cadre d'un simple filtre.

**Recommandation** : ajouter le filtre filiale sur tous les onglets comptabilité pour permettre au Super Admin de **consulter la comptabilité de chaque filiale séparément**. La consolidation multi-filiales des états financiers est un chantier à part entière (hors scope de ce plan).

| Onglet | Ce qu'il faut faire |
|---|---|
| Plan comptable | Backend : `?subsidiaryId=` optionnel sur `GET /accounting/accounts` |
| Écritures | Backend : `?subsidiaryId=` optionnel sur `GET /accounting/entries` |
| Exercices / Périodes | Backend : `?subsidiaryId=` optionnel sur `GET /accounting/periods` |
| Grand livre | Backend : `?subsidiaryId=` optionnel sur `GET /accounting/reports/grand-livre` |
| Balance générale | Backend : `?subsidiaryId=` optionnel sur `GET /accounting/reports/balance-generale` |
| Journal centralisateur | Backend : `?subsidiaryId=` optionnel sur `GET /accounting/reports/journal-centralisateur` |
| États financiers SYSCOHADA | Backend : `?subsidiaryId=` optionnel sur `GET /accounting/reports/syscohada` |

| # | Action | Complexité |
|---|---|---|
| F6 | Backend : ajouter `?subsidiaryId=` optionnel sur les 7 endpoints comptabilité | Moyen (7 controllers) |
| F7 | Frontend : brancher `selectedSubsidiaryId` sur tous les onglets Comptabilité + `queryKey` | Moyen |

**Effort** : ~1 journée

---

## Section RH & Administration

### Page RH (`/dashboard/hr`)

4 onglets, aucun ne supporte `subsidiaryId`.

| Onglet | Ce qu'il faut faire |
|---|---|
| Employés | Backend : `?subsidiaryId=` optionnel sur `GET /hr/employees` |
| Présences | Backend : `?subsidiaryId=` optionnel sur `GET /hr/attendance-records` |
| Absences | Backend : `?subsidiaryId=` optionnel sur `GET /hr/absences` |
| Paie | Backend : `?subsidiaryId=` optionnel sur `GET /hr/payroll-records` |

| # | Action | Complexité |
|---|---|---|
| R1 | Backend : ajouter `?subsidiaryId=` optionnel sur les 4 endpoints RH | Moyen |
| R2 | Frontend : brancher `selectedSubsidiaryId` sur les 4 onglets RH + colonne Filiale dans les listes | Moyen |

**Effort** : ~4h

---

### Page Secrétariat (`/dashboard/secretariat`)

3 onglets, aucun ne supporte `subsidiaryId`.

| Onglet | Ce qu'il faut faire |
|---|---|
| Documents | Backend : `?subsidiaryId=` optionnel sur `GET /secretariat/documents` |
| Réunions | Backend : `?subsidiaryId=` optionnel sur `GET /secretariat/meetings` |
| Tâches | Backend : `?subsidiaryId=` optionnel sur `GET /secretariat/tasks` |

| # | Action | Complexité |
|---|---|---|
| R3 | Backend : ajouter `?subsidiaryId=` optionnel sur les 3 endpoints secrétariat | Faible |
| R4 | Frontend : brancher `selectedSubsidiaryId` + colonne Filiale | Faible |

**Effort** : ~2h

---

### Page Configuration (`/dashboard/configuration`)

9 onglets. Analyse onglet par onglet :

| Onglet | Nature des données | Filtre filiale nécessaire ? |
|---|---|---|
| Produits | Catalogue global (pas de subsidiaryId) | **Non** — catalogue partagé toutes filiales |
| Services | Catalogue global | **Non** — idem |
| Unités | Référentiel global | **Non** |
| Listes de référence | Référentiel global | **Non** |
| Taxes | Référentiel global | **Non** |
| Utilisateurs | Utilisateurs staff scopés par filiale | **Oui** — Super Admin voit tous les users, filtre par filiale |
| Fournisseurs | Fournisseurs scopés par filiale | **Oui** |
| Clients | Clients globaux (Chantier 6 — inter-filiale) | **Oui** — filtre pour voir les clients par filiale |
| Trésorerie (comptes) | Comptes par filiale | **Oui** |

| # | Action | Complexité |
|---|---|---|
| R5 | Backend : vérifier et ajouter `?subsidiaryId=` optionnel sur `GET /users`, `GET /purchasing/suppliers`, `GET /crm/contacts`, `GET /finance/treasury/accounts` (comptes config) | Moyen |
| R6 | Frontend : ajouter filtre filiale uniquement sur les 4 onglets concernés (Utilisateurs, Fournisseurs, Clients, Trésorerie) — les 5 autres onglets n'ont pas de filtre | Moyen |

**Effort** : ~4h

---

## Récapitulatif de la charge de travail

### Fondations (à faire en premier — débloque tout le reste)

| # | Action | Effort |
|---|---|---|
| G1-G4 | SubsidiarySelector global dans Header + AppContext + `GET /subsidiaries` | 1 jour |

### Par section

| Section | Page | Tâches | Effort |
|---|---|---|---|
| **Commerce** | Analyses | A1-A4 | 4h |
| | CRM | A5-A7 | 3h |
| | Commandes | A8-A10 | 2h |
| | Production | A11 | 1h |
| | Caisse | A12-A13 | 3h |
| **Opérations** | Achats | O1-O2 | 2h |
| | Stock | O3-O5 | 3h |
| | Maintenance | O6-O7 | 2h |
| | Équipements | O8 | 1h |
| **Finance & Comptabilité** | Finance | F1-F5 | 4h |
| | Comptabilité | F6-F7 | 1 jour |
| **RH & Administration** | RH | R1-R2 | 4h |
| | Secrétariat | R3-R4 | 2h |
| | Configuration | R5-R6 | 4h |

### Total

| Domaine | Effort |
|---|---|
| Fondations (SubsidiarySelector + contexte) | 1 jour |
| Commerce (5 pages) | ~13h |
| Opérations (4 pages) | ~8h |
| Finance & Comptabilité (2 pages) | ~1,5 jours |
| RH & Administration (3 pages) | ~10h |
| **Total** | **~6 jours** |

---

## Ordre d'implémentation recommandé

```
Sprint 0 — Fondations (débloque tout)
  G1-G4 : SubsidiarySelector global + AppContext + GET /subsidiaries

Sprint A — Commerce (impact business immédiat)
  A1-A4  : Analyses
  A5-A7  : CRM (déjà prêt backend pour 6/7 onglets → rapide)
  A8-A11 : Commandes + Production
  A12-A13 : Caisse

Sprint B — Opérations
  O1-O8 : Achats, Stock, Maintenance, Équipements

Sprint C — Finance & Comptabilité
  F1-F5 : Finance (5 onglets à débloquer backend)
  F6-F7 : Comptabilité (7 endpoints backend)

Sprint D — RH & Administration
  R1-R6 : RH, Secrétariat, Configuration
```

---

## Décision clé à prendre

**Comptabilité consolidée** : ajouter `?subsidiaryId=` permet au Super Admin de voir la comptabilité d'une filiale à la fois. Mais une **vue vraiment consolidée** (addition des comptes de plusieurs filiales, états financiers groupe) est une fonctionnalité comptable complexe (éliminations inter-filiales, retraitements) qui dépasse le scope d'un filtre simple. À traiter comme un chantier séparé.
