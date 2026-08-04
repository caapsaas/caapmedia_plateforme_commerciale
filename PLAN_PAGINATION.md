# Plan — Pagination complète, skeletons et empty states (audit exhaustif)

Audit exhaustif du backend (NestJS/Prisma) et du frontend (React/TanStack Query) réalisé le 2026-07-31. Ce document liste **tout** ce qui reste à traiter, chantier par chantier, pour que : (1) chaque endpoint de liste qui peut bénéficier d'une pagination l'ait, back **et** front ; (2) le nombre d'éléments affichés soit uniforme dans toute l'appli ; (3) plus aucun écran n'affiche un texte "Chargement..." brut à la place d'un skeleton ; (4) chaque liste ait un empty state visuel (composant partagé, pas du texte inline).

## 1. Conventions à respecter (uniformisation)

### 1.1 Taille de page standard
- **Pagination cliquable réelle** (CRUD simple, un seul consommateur, pas d'export) : **10 éléments par page**, comme déjà fait sur CRM/secretariat/HR/purchasing/accounting. `<Pagination meta={meta} onPageChange={setPage} />`.
- **Chargement groupé ("bulk-load")** (export CSV/PDF, ou vue consommée par plusieurs écrans qui ont besoin du jeu de données complet — tri/filtre client, croisement multi-onglets) : plafond standard **`limit: 500`**. Exception documentée déjà en place : `ecommerce/orders` reste à `limit: 2000` (~10 consommateurs).
- **Référentiels fixes/petits par nature** (journaux SYSCOHADA, comptes de trésorerie, filiales, unités, taxes, listes de référence specs, mappings comptables) : pas de pagination cliquable utile ; le backend passe quand même par `paginate()`/`PaginationQueryDto` pour uniformité d'API, mais le frontend charge tout sans `<Pagination>`.
- **Endpoints d'agrégat/rapport** (grand livre, balance, tableau de bord, stats) : pas de pagination applicable — uniquement skeleton + empty state à corriger.

### 1.2 Règle de décision pagination réelle vs bulk-load
Vue a un export CSV/PDF, OU sert plusieurs onglets/écrans, OU a un tri/filtre multi-colonnes côté client → **bulk-load** (limit 500, pas de `<Pagination>`).
Sinon (CRUD simple, un seul écran) → **pagination réelle** (limit 10, `<Pagination>` visible).

### 1.3 Backend — pattern à répliquer
```ts
// service
async findAll(user, paginationQuery: PaginationQueryDto = {}) {
  const where = /* scope filiale + filtres existants */;
  if (paginationQuery.search) where.champPertinent = { contains: paginationQuery.search, mode: 'insensitive' };
  return paginate(this.prisma.model, { where, include, orderBy }, paginationQuery);
}
// controller
@Get()
findAll(@CurrentUser() user, @Query() paginationQuery: PaginationQueryDto) {
  return this.service.findAll(user, paginationQuery);
}
```
Vérifier systématiquement les autres appelants internes du service (`grep` sur `serviceName.findAll`) avant de changer la forme du retour.

### 1.4 Frontend — pattern à répliquer
- Skeleton : ne jamais bloquer toute la page derrière un texte de chargement. Le header/card/table `<thead>` reste visible, seul le `<tbody>` (ou la zone de contenu) bascule entre `TableSkeleton rows={pageSize} columns={N}` (N = nombre exact de `<th>`) et le contenu réel.
- Empty state : toujours le composant partagé `Frontend/components/ui/EmptyState.tsx` (icône + titre + description), jamais un `<p>` inline.
- Layout non tabulaire (kanban, grille de cartes, dashboard) : skeleton bespoke qui reproduit la vraie disposition (déjà fait pour Production kanban, Caisse POS grid, Analytics dashboard — réutiliser le même principe).
- Pagination réelle : `useQuery` avec `page`/`search` dans la queryKey, `<Pagination meta={meta} onPageChange={setPage} />` après le tableau.
- Bulk-load : fonction fetcher compat qui demande `limit: 500` et déballe `.data`, **plus** une fonction `xxxPaginated()` séparée pour un usage futur en pagination réelle (déjà le pattern établi).

### 1.5 Selects natifs → AsyncSelect
Tout `<select>` dont les `<option>` viennent d'un `.map()` sur un tableau potentiellement grand (clients, produits, employés, comptes, fournisseurs, commandes...) doit passer par `Frontend/components/ui/AsyncSelect.tsx`. Les selects sur des listes fixes/petites (rôles, statuts, filiales, mois/années, périodes fiscales) restent natifs.

---

## 2. Chantiers backend (endpoints sans pagination)

### Chantier A — HR (le plus gros volume de données)
| Endpoint | Modèle | Action |
|---|---|---|
| `GET hr/attendance-checkin/history-all` | AttendanceRecord | Ajouter `paginate()` (croît avec l'effectif × jours) |
| `GET hr/employees/:id/leave-balances` | LeaveBalance | Petit référentiel par employé — pas de pagination cliquable, juste vérifier le skeleton front |

### Chantier B — Finance (plusieurs gaps à fort volume)
| Endpoint | Modèle | Action |
|---|---|---|
| `GET finance/external-transactions` | ExternalFinancialTransaction | `paginate()` — croissance rapide, gap majeur |
| `GET finance/prefinancement/transactions` | PrefinancementTransaction | `paginate()` — croissance rapide, gap majeur |
| `GET finance/assets/fixed` | FixedAsset | `paginate()` (croissance lente, mais non borné actuellement) |
| `GET finance/debts/long-term` | LongTermDebt | `paginate()` (référentiel petit mais non borné) |
| `GET finance/treasury/accounts` | TreasuryAccount | Référentiel fixe — pas de pagination cliquable, laisser tel quel |

### Chantier C — Accounting
| Endpoint | Modèle | Action |
|---|---|---|
| `GET accounting-access` | AccountingAccessRequest | `paginate()` |
| `GET accounting/mappings` | AccountMapping | `paginate()` (lié au plan comptable, peut grossir) |
| `GET accounting/immobilisations` | FixedAsset | `paginate()` |
| `GET accounting/periods` | FiscalYear | Référentiel petit (1/an) — pas de pagination cliquable |
| `GET accounting/reports/grand-livre/:fiscalYearId` | JournalEntryLine | **Risque le plus élevé** — scan non borné qui grossit très vite. Ajouter pagination par compte ou par plage de lignes ; a minima vérifier qu'un filtre de compte est obligatoire pour limiter le scan |
| `GET accounting/reports/balance/:fiscalYearId` | JournalEntryLine (agrégé) | Sortie petite mais le scan sous-jacent grossit — même vigilance que grand-livre |
| `GET accounting/reports/journal-centralisateur/:fiscalYearId` | JournalEntry | Idem |
| `GET accounting/journals` | Journal | Référentiel SYSCOHADA fixe — pas de pagination, juste skeleton/empty state front |

### Chantier D — CRM (compléments)
| Endpoint | Modèle | Action |
|---|---|---|
| `GET crm/contacts/orders` (portail client) | Order | `paginate()` |
| `GET crm/contacts/search?q` | Contact | Actuellement plafonné à 10 en dur — migrer vers `PaginationQueryDto` standard |
| `GET crm/contacts/orders`, autres routes `search` du domaine | — | Harmoniser sur `paginate()` au lieu d'un `take` ad hoc |

### Chantier E — Ecommerce / Ventes / Production
| Endpoint | Modèle | Action |
|---|---|---|
| `GET ecommerce/sales` | Sale | **`paginate()` — gap majeur, croissance rapide, aucune borne actuelle** |
| `GET ecommerce/orders/credit` | CreditAccount | `paginate()` |
| `GET ecommerce/orders/pending-validation` | Order | `paginate()` (backlog peut pic) |
| `GET ecommerce/orders/customer/:customerId` | Order | `paginate()` |
| `GET ecommerce/taxes` | TaxRate | Référentiel petit — pagination pour uniformité API seulement |
| `GET products/:id/form-definition`, `products/:id/spec-structure` | ProductSpec | Référentiel par produit — pas de pagination cliquable |
| `GET spec-reference-lists` | SpecReferenceList | Référentiel petit — pagination API pour uniformité |
| `GET production/equipment-costs(/configured)` | Equipment | Référentiel petit |
| `GET production/workflows` | ProductionWorkflow | Référentiel petit |

### Chantier F — Purchasing / Maintenance
| Endpoint | Modèle | Action |
|---|---|---|
| `GET purchase/stock-movements` | StockMovement | **`paginate()` — gap majeur, croissance très rapide** |
| `GET purchase/stock-items/:id/packaging-units` | ItemPackagingUnit | Référentiel par produit — pas de pagination cliquable |
| `GET purchase/units` | Unit | Référentiel petit |
| `GET equipements/search` | Equipment | Incohérence : `findAll` a `take: 1000`, `search` n'en a aucun — aligner |
| `GET maintenance-records`, `maintenance-records/search` | MaintenanceRecord | `paginate()` (croît par équipement) |

### Chantier G — Secretariat / Common / Configuration
| Endpoint | Modèle | Action |
|---|---|---|
| `GET secretariat/documents/search`, `meetings/search`, `tasks/search` | — | Ces 3 routes `search` contournent la pagination déjà en place sur leurs endpoints `findAll` — harmoniser sur `paginate()` |
| `GET auth/users`, `auth/users/search` | User | **`paginate()`** (demande explicite de l'utilisateur — voir §0) |
| `GET subsidiaries`, `subsidiaries/search` | Subsidiary | Référentiel petit — pagination API pour uniformité |
| `GET configuration/allowance-rules/...`, `salary-components/...`, `tax-brackets/...` | — | Référentiels petits liés à la config paie — pagination API pour uniformité, pas de pagination cliquable front |

---

## 3. Chantiers frontend (skeleton / empty state / pagination UI)

### Chantier H — HR (le plus de trous)
- `components/hr/AbsenceManagement.tsx` : **aucun skeleton**, empty state en texte inline → `TableSkeleton` + `EmptyState`
- `components/hr/AttendanceManagement.tsx` : **aucun skeleton ni empty state** → ajouter les deux
- `components/hr/PayrollManagement.tsx` : **aucun skeleton ni empty state** → ajouter les deux
- `components/hr/AttendanceHistory.tsx` : texte brut "Chargement..." → skeleton
- `components/hr/AttendanceCards.tsx` : texte brut → skeleton (grille de cartes)
- `components/hr/AttendanceQRComponent.tsx` : texte brut ×2 → skeleton ×2
- Selects natifs → `AsyncSelect` : sélecteurs employé dans `EmployeeFormModal`, `AbsenceFormModal`, `AttendanceActionModal`, `EmployeeFilters`, `secretariat/TaskFormModal`, `secretariat/MeetingFormModal`

### Chantier I — Finance
- `components/finance/CreditManagement.tsx`, `CreditDetailsModal.tsx`, `PrefinancementManagement.tsx`, `ExternalTransactions.tsx` : empty state inline → `EmptyState` partagé
- `components/finance/BalanceSheet.tsx`, `ProfitAndLossStatement.tsx` : **aucun empty state**
- `components/finance/TransactionFormModal.tsx`, `CreditPaymentModal.tsx` : selects natifs (comptes trésorerie / commandes impayées) → `AsyncSelect`
- Corriger le fetch `getOrders(...)` sans `limit` dans `CreditManagement`/`CreditDetailsModal`/`BalanceSheet` une fois le chantier E (ecommerce/orders) posé

### Chantier J — Accounting
- `components/accounting/GrandLivre.tsx`, `JournalCentralisateur.tsx`, `SyscohadaStatements.tsx`, `Immobilisations.tsx` : texte brut "Chargement..." → skeleton adapté (déjà `EmptyState` en place sur la plupart, à vérifier/compléter)
- `components/accounting/AccountingSettings.tsx` (onglet journaux) : texte brut → skeleton
- `Pages/AccountingAccessAdmin.tsx`, `Pages/Accounting.tsx` : texte brut → skeleton
- `Immobilisations.tsx` : select natif comptes trésorerie → `AsyncSelect`

### Chantier K — CRM (compléments)
- `components/crm/OpportunityPipeline.tsx` : **aucun empty state** (colonnes vides silencieuses)
- `components/crm/CreateProformaModal.tsx` : selects natifs (leads + produits) → `AsyncSelect`
- `components/crm/ActivitiesView.tsx` : select natif (contacts) → `AsyncSelect`
- `Pages/Crm.tsx` : selects natifs (filiales + commerciaux) — filiales reste natif (petit), commerciaux (tous les users) → évaluer `AsyncSelect`

### Chantier L — Ecommerce / Ventes / Production / Caisse
- `components/sales/Sales.tsx` : empty state inline seulement ; **6 selects natifs** (filiales, commerciaux, clients complets, produits complets) → `AsyncSelect` sur clients/produits/commerciaux
- `Pages/Production.tsx` : kanban **sans empty state** quand une colonne est vide
- `Pages/NewOrder.tsx` : **aucun skeleton**, pas d'empty state produits, select clients natif → `AsyncSelect`
- `components/production/ProductionValidationView.tsx` : empty state en bloc custom → harmoniser avec `EmptyState`
- `components/caisse/Caisse.tsx` : pas d'empty state sur la grille produits (seulement le panier)
- `components/caisse/OrderSelectionModal.tsx` : empty state inline
- `components/customer/CustomerAccountPage.tsx`, `OrderHistoryView.tsx` : texte brut / empty state inline

### Chantier M — Purchasing / Maintenance
- `components/purchasing/Purchasing.tsx`, `StockMovementsJournal.tsx` : empty state en bloc custom → harmoniser
- `components/purchasing/ManualStockMovementModal.tsx`, `WithdrawMaterialsModal.tsx` : selects natifs (articles) → `AsyncSelect`
- `components/maintenance/Maintenance.tsx`, `Pages/Equipements.tsx` : empty state inline, fetch `getEquipments()` sans `limit`

### Chantier N — Configuration (référentiels)
Harmoniser les empty states inline → composant partagé sur : `UnitsManagement.tsx`, `TreasuryAccountManagement.tsx`, `EquipmentCostManagement.tsx`, `ProductionWorkflowManagement.tsx`, `SpecReferenceListsManagement.tsx`, `PayrollScaleManagement.tsx`. `UserManagement.tsx` : brancher sur la pagination backend une fois le chantier G posé.

### Chantier O — AsyncSelect (liste consolidée, transverse)
Tous les selects natifs restants sur listes potentiellement grandes, à convertir en une seule passe une fois les endpoints paginés/recherchables disponibles :
`Sales.tsx` (clients, produits), `NewOrder.tsx` (clients), `MesCommandes.tsx` (produits), `CreateProformaModal.tsx` (leads, produits), `ActivitiesView.tsx` (contacts), `ManualStockMovementModal.tsx`/`WithdrawMaterialsModal.tsx`/`StockItemFormModal.tsx` (articles, unités), `Immobilisations.tsx`/`TransactionFormModal.tsx` (comptes trésorerie), `CreditPaymentModal.tsx` (commandes impayées), `ProductionWorkflowManagement.tsx` (services, équipements), modales coûts production ecommerce (équipements), `SpecConfigDrawer` (listes de référence), sélecteurs employé HR/secretariat listés au Chantier H.

---

## 4. Ordre d'implémentation proposé

1. **Chantier A (HR)** — le plus de trous frontend + gap backend attendance-history-all
2. **Chantier E (Ecommerce/Sales)** — `ecommerce/sales` est le gap backend le plus critique (aucune borne du tout)
3. **Chantier F (Purchasing/Maintenance)** — `stock-movements` gap tout aussi critique
4. **Chantier B (Finance)** — external-transactions + prefinancement, forte croissance
5. **Chantier C (Accounting)** — grand-livre/balance/journal-centralisateur (risque de scan non borné) + référentiels
6. **Chantier D + K (CRM compléments)**
7. **Chantier L (Ventes/Production/Caisse/Portail client)**
8. **Chantier G + N (Secretariat/Common/Configuration — harmonisation search + référentiels + users)**
9. **Chantier H/I/J/M restants (skeleton/empty state ménage fin)**
10. **Chantier O (AsyncSelect, passe finale transverse)** — fait en dernier car dépend des endpoints recherchables posés dans les chantiers précédents

Chaque chantier se conclut par : `npm run lint && tsc --noEmit` (backend et frontend concernés) avant de passer au suivant, comme fait jusqu'ici.

---

## 5. Ce qui est déjà conforme (ne pas retoucher)

Vues déjà sur le pattern cible (TableSkeleton dans le tbody, colonnes correctes, `EmptyState` partagé, `<Pagination>` réelle) : les 5 vues CRM (`AccountManagement`, `ContactManagement`, `ContractManagement`, `LeadsManagement`, `ProformasManagement`), `ServicesCatalogManagement`, `SupplierManagement`, `EmployeeDatabaseModern`, les 3 vues secretariat (`DocumentManagement`, `MeetingManagement`, `TaskManagement`). Domaines backend déjà en `paginate()` : crm (contacts/accounts/contracts/leads/proformas/opportunities/crmtasks/interactions sur `findAll`), accounting/accounts, accounting/entries, ecommerce/products, finance/debts (supplier)/expense/treasury (transactions), hr (employee/attendancerecord/absencerecord/payrollrecord), purchase (stock-items/suppliers/purchase-orders), secretariat (documents/meetings/tasks sur `findAll`, pas `search`).
