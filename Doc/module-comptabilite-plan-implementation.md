# Plan d'implémentation — Module Comptabilité (architecture cible basée sur gmo)

Statut : **plan à valider avant implémentation**. Aucune ligne de code n'a été modifiée pour produire ce document.
Périmètre de l'analyse : `gmo-plateforme-commerciale-241025/Backend_GMO/src/accounting/`, `.../accounting-access/`, `.../finance/balancesheet/`, `.../finance/incomestatement/`, `.../prisma/schema.prisma` (modèles comptables), et `Frontend_GMO/components/{Accounting.tsx,accounting/,finance/}`, `Frontend_GMO/services/{AccountingService,accountingAccessService,balanceSheetService,incomeStatementService}.ts`.

**Consigne du demandeur : ce document ignore délibérément l'implémentation actuelle de caapmedia pour la conception cible.** L'état actuel n'est mentionné qu'en §4, à titre de repère pour savoir quels fichiers seront remplacés/étendus — il ne doit pas limiter l'ambition du design décrit en §2/§3.

---

## 0. Résumé exécutif

Le module comptabilité de gmo (dans son état ACTUEL, pas la doc générique `GUIDE_TECHNIQUE_COMPTABILITE.md` qui décrit une architecture jamais construite — voir avertissement §1) est un moteur de comptabilité en partie double conforme OHADA/AUDCIF, multi-filiale, avec :

- Un point d'entrée unique et non dupliqué pour toute écriture (`EntriesService.createAutomaticEntry`), qui gère l'équilibre débit/crédit, la résolution de compte/période, la **numérotation légale séquentielle par journal/filiale/exercice** (compteur atomique), et l'**anti-doublon** par référence métier stable.
- Une **extourne/contre-passation** propre (principe d'intangibilité OHADA) : une écriture validée ne se modifie jamais, seule une écriture inverse liée peut la corriger.
- Une génération automatique d'écritures depuis **8 domaines métier** (ventes, achats, trésorerie, paie/bonus, charges diverses, transport, ajustement de stock), passant par un **pattern Outbox transactionnel** : l'intention d'écrire est enregistrée dans la même transaction que l'opération métier (jamais perdue), puis traitée en tâche de fond avec retry borné — au lieu du classique "après commit, appel bloquant, erreur avalée".
- Un moteur de calcul de solde **unifié** (`AccountingBalanceService`), consommé à la fois par la Balance/Grand Livre et par le Bilan/Compte de Résultat OHADA (template-driven, lignes AUTO/INPUT/CALCULATED avec formules).
- Un **Bilan et Compte de Résultat multi-filiale** : calculés et stockés par filiale ET sous une sentinelle "consolidé", avec drill-down.
- Un module **Immobilisations** complet : fiche d'actif, amortissement linéaire au prorata temporis, cession avec plus/moins-value.
- Un modèle de scope multi-filiale **paramétrable par domaine** : la vue consolidée est réservée par défaut à l'ADMIN, mais le périmètre comptabilité/finance l'étend explicitement à `[ADMIN, FINANCIAL_DIRECTOR]`, avec drill-down par filiale sur toute vue consolidée.
- Un mécanisme d'**accès temporaire à la comptabilité** (JIT) pour les rôles non habilités en permanence : demande → validation par un ADMIN siège → accès expirant automatiquement.

Le frontend correspondant est un module à onglets (pas de sous-routes), 100 % TanStack Query, avec un formulaire d'écriture multi-lignes à validation d'équilibre en temps réel, des rapports imprimables/exportables PDF, et le même modèle "consolidé par défaut pour ADMIN/FINANCIAL_DIRECTOR, filtrable par filiale" répercuté côté UI via un sélecteur de filiale conditionnel.

**Ce que ce document propose** : porter cette architecture (avec des corrections déjà identifiées côté gmo lui-même, voir §1.1) dans caapmedia, en remplaçant le module comptabilité actuel — sensiblement plus simple (pas de numérotation légale, pas d'extourne, pas d'outbox, pas d'immobilisations, chart of accounts dupliqué par filiale au lieu d'être global).

---

## 1. Avertissement méthodologique

gmo possède DEUX documents qui parlent de son architecture comptable, et ils ne décrivent PAS la même chose :

1. `Doc/GUIDE_TECHNIQUE_COMPTABILITE.md` — un guide **générique/aspirationnel** (modèles `Account`/`JournalEntry`/`JournalEntryLine`/`FiscalYear`, framework "Express.js" au lieu de NestJS, structure de dossiers `entities/services/controllers/dto/repositories` jamais utilisée dans le code réel). **Ce guide ne correspond à aucune ligne de code réellement écrite.** C'est très probablement le document dont s'est inspiré le schéma Prisma ACTUEL de caapmedia (`AccountingAccount`/`JournalEntry`/`JournalEntryLine`/`FiscalYear`, champs `accountNumber`/`entryNumber`/`totalAmount`/`balance`) — la ressemblance est trop précise pour être une coïncidence.
2. `Doc/AUDIT_ARCHITECTURE_COMPTABILITE.md` — un audit de rétro-ingénierie du **code réel** (daté, commit `a08b764`), qui documente franchement la dette technique de l'époque de l'audit (god-service de 1462 lignes, pas d'extourne, pas de numérotation légale, pas d'immobilisations, failles multi-filiale...).

**Ce document-ci (le mien) analyse le code source ACTUEL de gmo**, qui s'est avéré **plus mature que ce que l'audit décrit** : depuis l'audit, l'équipe gmo a déjà exécuté une bonne partie de son propre plan de refactor — `AccountingIntegrationService` a été découpé en handlers par domaine, le pattern Outbox a été généralisé (pas juste piloté sur un domaine), la numérotation légale et l'extourne ont été ajoutées, le module Immobilisations a été construit, et le scope multi-filiale a été corrigé pour inclure `FINANCIAL_DIRECTOR`. Les sections §2/§3 ci-dessous décrivent cet état réel et actuel — vérifié fichier par fichier, pas déduit de la documentation.

---

## 2. Architecture de référence — Backend (gmo, état actuel)

### 2.1 Schéma de données (modèles clés)

```prisma
// Plan comptable — GLOBAL (pas de subsidiaryId : un seul référentiel partagé,
// contrairement à caapmedia actuel où AccountingAccount est dupliqué par filiale)
model AccountingAccount {
  id, code (unique), label, type: AccountType, isActive, parentId (hiérarchie), class: Int?
}

model AccountingJournal {
  id, code (unique), name, type: JournalType   // 5 journaux fixes : AC/VT/BQ/CA/OD
}

// Compteur atomique de numérotation légale, par journal x filiale x exercice
model AccountingJournalSequence {
  journalId, subsidiaryId, year, lastNumber
  @@unique([journalId, subsidiaryId, year])
}

model AccountingEntry {
  id, date, reference, label, journalId, periodId?, status: EntryStatus (DRAFT/VALIDATED/CANCELLED),
  isValidated, validatedAt, validatedById, subsidiaryId,
  sequentialNumber?      // assigné SEULEMENT à la validation, jamais en DRAFT
  reversalOfEntryId?     // lien vers l'écriture d'origine si ceci est une extourne
  @@unique([subsidiaryId, sequentialNumber])
}

model AccountingEntryLine {
  id, entryId, accountId, description?, debit: Decimal(15,2), credit: Decimal(15,2)
}

model AccountingDocument { id, name, url, entryId }   // pièces jointes

model AccountingPeriod {
  id, startDate, endDate, status: PeriodStatus (OPEN/CLOSED), subsidiaryId
}

model AccountingMapping { id, key (unique), accountCode }   // "SALES_CLIENT" -> "411100"

// Pattern Outbox transactionnel — voir §2.3
model AccountingOutboxEntry {
  id, eventType, payload: Json, status: AccountingOutboxStatus (PENDING/PROCESSED/FAILED),
  attempts, lastError?, subsidiaryId, createdAt, processedAt?
}

// Immobilisations — voir §2.9
model Immobilisation {
  id, label, category: ImmobilisationCategory, accountCode, amortizationAccountCode (défaut "281000"),
  acquisitionDate, acquisitionCost, residualValue, usefulLifeYears, method (LINEAIRE),
  cumulativeAmortization, lastAmortizationYear?, status: ImmobilisationStatus (ACTIVE/DISPOSED),
  disposalDate?, disposalAmount?, subsidiaryId
}

// Bilan/Compte de Résultat OHADA — template-driven, multi-filiale + consolidé (voir §2.8)
model BalanceSheetTemplate { id, ref (unique, ex "AH"/"BI"/"CA"), label, position, side: ACTIF/PASSIF,
  type: AUTO/INPUT/CALCULATED, formula? }
model BalanceSheetValue { id, year, templateId, subsidiaryId (ou sentinelle "consolidé"),
  amountBrutN, amountAmortN, amountNetN, amountNetN1, isManual
  @@unique([templateId, year, subsidiaryId]) }
// IncomeStatementTemplate/IncomeStatementValue : structure miroir pour le Compte de Résultat.

enum AccountType { CAPITAUX_PROPRES, DETTES_FINANCIERES, IMMOBILISATIONS, AMORTISSEMENTS, STOCK,
  DETTES, CREANCES, DETTES_SOCIALES, DETTES_FISCALES, ASSOCIES, TRESORERIE, CHARGES, PRODUITS }
enum JournalType { SALES, PURCHASE, CASH, BANK, GENERAL }
enum EntryStatus { DRAFT, VALIDATED, CANCELLED }
enum PeriodStatus { OPEN, CLOSED }
```

**Différences structurantes à noter vs. le schéma actuel de caapmedia** (détaillées en §4) : plan comptable global (pas par filiale), pas de champ `balance` stocké sur les lignes (toujours recalculé), séparation `CASH` (Journal de Caisse) / `BANK` (Journal de Banque) plutôt qu'un seul journal `TRESORERIE`.

### 2.2 Le moteur d'écriture — `EntriesService`

Point d'entrée unique et non dupliqué (confirmé : **zéro** `prisma.accountingEntry.create` en dehors de ce service dans tout le repo gmo). Méthodes :

- **`create(data)`** — transaction Prisma : valide l'équilibre (`Math.abs(totalDebit - totalCredit) > 0.01` → rejet), résout/valide la période comptable ouverte, crée l'écriture + ses lignes, et **si le statut est `VALIDATED` dès la création** (cas des écritures automatiques), assigne immédiatement le numéro séquentiel légal dans la même transaction — jamais de numéro "consommé" sans écriture associée.
- **`validateEntry(id)`** — passe une écriture `DRAFT` à `VALIDATED`, assigne le numéro séquentiel à ce moment-là (pas avant).
- **`reverseEntry(id)`** — extourne : vérifie que l'écriture est `VALIDATED` et n'a pas déjà été extournée (recherche `reversalOfEntryId`), construit les lignes inversées (débit↔crédit), crée une **nouvelle** écriture liée via `reversalOfEntryId`, validée immédiatement. L'écriture d'origine n'est jamais modifiée.
- **`assignSequentialNumber(tx, journalId, subsidiaryId, date)`** — `upsert` atomique sur `AccountingJournalSequence` (`update: { lastNumber: { increment: 1 } }`), format retourné : `"{code_journal}-{année}-{numéro sur 6 chiffres}"` (ex. `VT-2026-000042`). Une seule opération UPDATE Postgres : deux validations concurrentes sur le même journal/filiale/exercice ne peuvent jamais obtenir le même numéro.
- **`createAutomaticEntry(data)`** — utilisée par tous les handlers de génération automatique (§2.3) : résout le journal par code, **anti-doublon par `(reference, journalId, subsidiaryId)`** (retourne l'écriture existante sans en recréer une si un appel identique est rejoué), résout tous les comptes par code en une seule requête batch (`findMany({ code: { in: [...] } })`), rejette si un compte est désactivé, puis délègue à `create()` avec `status: VALIDATED` directement (les écritures automatiques n'existent jamais en `DRAFT`).

### 2.3 Génération automatique par domaine — handlers + pattern Outbox

**Le problème que ce pattern résout** : générer une écriture comptable *après* le commit de l'opération métier (pour ne jamais faire échouer une vente/un achat à cause d'un souci comptable), sans jamais perdre silencieusement l'écriture si l'appel échoue.

**Le flux** :
1. L'opération métier commite normalement dans sa propre transaction Prisma.
2. **Dans cette même transaction**, une ligne est insérée dans `AccountingOutboxEntry` (`eventType`, `payload: Json`, `subsidiaryId`) — atomique avec l'opération métier, ne peut donc jamais être perdue même si le service comptable est indisponible au moment du commit.
3. `AccountingOutboxProcessor` (Cron `*/20 * * * * *`, toutes les 20s) traite par lots de 50, `dispatch()`-e vers le bon handler selon `eventType`, marque `PROCESSED` en cas de succès ou incrémente `attempts`/logue `lastError` en cas d'échec (`FAILED` après 5 tentatives).

**Les 5 handlers** (extraits du god-service historique, logique inchangée à l'extraction) :

| Handler | Fichier | Domaines couverts |
|---|---|---|
| `SalesAccountingService` | `entries/handlers/sales-accounting.service.ts` | `autoGenerateSaleEntry` (reconnaissance CA, gère le prorata livraison partielle via `computeDeliveryPortion`), `autoGenerateStockExitEntry` (sortie de stock valorisée, groupée par compte) |
| `PurchaseAccountingService` | `.../purchase-accounting.service.ts` | `autoGeneratePurchaseEntry` (dette fournisseur), `autoGeneratePurchaseStockEntry` (entrée de stock à réception) |
| `TreasuryAccountingService` | `.../treasury-accounting.service.ts` | `autoGenerateTreasuryEntry` — **le plus complexe** (~420 lignes) : dispatch par `treasuryType` (versement TVA/BIC/IUTS/CNSS/TPA/Rosalaire, paiement salaire/bonus, virement interne coffre↔banque, paiement fournisseur, dépenses classiques) avec sélection du journal (BQ/CA/OD) selon le type de compte de trésorerie source/destination |
| `PayrollAccountingService` | `.../payroll-accounting.service.ts` | `autoGeneratePayrollEntry`/`autoGenerateBonusEntry` — agrège les fiches de paie de la période, calcule le net à payer **comme solde équilibrant** (débit total − autres crédits), avec vérification de cohérence contre le net des fiches individuelles |
| `MiscAccrualAccountingService` | `.../misc-accrual-accounting.service.ts` | `autoGenerateExpenseAccrual`, `autoGenerateNeedExpressionAccrual`, `autoGenerateTransportAccrual`, `autoGenerateStockAdjustmentEntry` — engagements simples à 2 lignes |
| `ImmobilisationAccountingService` | `.../immobilisation-accounting.service.ts` | `autoGenerateAmortizationEntry`, `autoGenerateDisposalEntry` — **appelé directement par `ImmobilisationsService`, pas via l'outbox** (déclenché par une action explicite de l'utilisateur — générer la dotation annuelle, céder un bien — pas par un événement métier asynchrone) |

Tous partagent `AccountingMappingsCacheService` (cache en mémoire de `AccountingMapping`, TTL 5 min — limite connue et documentée : pas d'invalidation au `MappingsService.update()`, acceptable en instance unique).

**Références déterministes obligatoires** : chaque référence d'écriture automatique doit être construite à partir d'un identifiant métier stable (ex. `ADJ-{stockMovementId}`, `AMORT-{immobilisationId}-{year}`, `PAY-{year}-{month}`) — **jamais** `Date.now()`/UUID aléatoire, sous peine de casser l'anti-doublon de `createAutomaticEntry` en cas de rejeu (retry réseau, double appel).

### 2.4 Comptes & Mappings

- `AccountsService.seedOhadaAccounts()` — seed idempotent (`upsert` par `code`) du plan comptable. **Point d'attention pour caapmedia** : le seed de gmo contient des libellés spécifiques à leur activité (fournisseurs nommés MABUCIG/SONABEL/ONEA, produits de stock nominatifs "Cigarettes Hamilton Classic"...) — à généraliser pour caapmedia plutôt qu'à copier tel quel. La **structure des comptes** (codes, classes 1-7, types) correspond exactement à `Doc/plan_comptable.md`, qui est **déjà identique mot pour mot entre gmo et caapmedia** (vérifié par diff) — donc directement réutilisable.
- `MappingsService` — `findAll()`/`update(key, accountCode)`/`seedDefaultMappings()`. Table de correspondance **clé fonctionnelle → code de compte**, permettant de reconfigurer le plan comptable sans toucher au code (ex. changer `SALES_CLIENT` de `411100` vers un autre compte). ~40 clés par défaut, organisées par domaine (VENTES/ACHATS/TRESORERIE/TAXES/PAIE/DEPENSES/TRANSPORT).

### 2.5 Périodes comptables — `PeriodsService`

Périodes à bornes libres (`startDate`/`endDate`, pas forcément calées sur l'année civile) par filiale, avec détection de chevauchement à la création (`overlapping` check). `closePeriod` refuse si des écritures `DRAFT` subsistent dans la période. `findOpenPeriodForDate`/`validatePeriodOpen` sont utilisées par `EntriesService.create` pour bloquer toute création d'écriture sur une période clôturée.

### 2.6 Journaux — `JournalsService`

5 journaux fixes, globaux (pas par filiale) : `AC` (achats), `VT` (ventes), `BQ` (banque), `CA` (caisse), `OD` (opérations diverses). Seedés via `seedJournals()`.

### 2.7 Rapports — Balance, Grand Livre, Dashboard

`ReportsService` (`accounting/reports/`) :
- **`getGeneralBalance`** — balance générale paginée : agrège `AccountingEntryLine` en deux passes (`initialAggregates` avant `startDate`, `movementAggregates` dans la période) via `groupBy(['accountId'])`, calcule solde initial/mouvements/solde final par compte.
- **`getGeneralLedger`** — grand livre d'UN compte : même logique initial + mouvements, mais retourne aussi le détail ligne par ligne (pour l'affichage "carte de compte").
- **`getDashboardStats`** — agrège par préfixe de compte (classe 6/7, 571/521/411/401) pour produire CA/charges/résultat net/trésorerie/créances/dettes + `getExpenseBreakdown` (répartition par journal).
- Toutes ces méthodes appliquent le scope multi-filiale via `hasGlobalScope(context)` (voir §2.11) — **consolidé par défaut pour ADMIN/FINANCIAL_DIRECTOR siège, avec `subsidiaryIdFilter` optionnel pour drill-down**.

**`AccountingBalanceService`** (`accounting/shared/`) — extrait pour **unifier** un calcul de solde auparavant dupliqué 3 fois (Balance, Bilan, Compte de Résultat) : `getAccountBalance(codes[], startDate|null, endDate, 'DEBIT'|'CREDIT', subsidiaryId?)`, `getAccountBalanceByPrefix(prefix, ...)` (déduit le signe automatiquement selon la classe — 7 = crédit-débit, tout le reste = débit-crédit), `evaluateFormula(formula, values)` (évalue dynamiquement les formules type `"TA - RA - RB"` des lignes CALCULATED du Bilan/CdR en substituant les références à 2 lettres). **Source de vérité unique retenue : `isValidated: true`** (pas `status: 'VALIDATED'`, même si les deux champs existent et sont maintenus synchrones par `EntriesService`).

### 2.8 Bilan & Compte de Résultat OHADA — template-driven, multi-filiale

`BalancesheetService`/`IncomestatementService` (dans `finance/`, PAS dans `accounting/` — séparation volontaire : finance = flux/opérationnel, accounting = écritures/reporting réglementaire).

**Modèle** : chaque ligne du Bilan/CdR est un `BalanceSheetTemplate` avec un `ref` (code SYSCOHADA, ex. `AH`/`BI`/`CA`), une position d'affichage, un côté (ACTIF/PASSIF), et un **type** :
- `AUTO` — calculé automatiquement depuis les soldes de comptes (`calculateAutoValue(ref, year, ...)` — un `switch` sur `ref` mappant chaque ligne du Bilan vers les codes de comptes OHADA qui l'alimentent, ex. `AM` "Matériel, mobilier" = brut compte 241000+245000, amortissement = solde crédit 281000).
- `INPUT` — saisie manuelle (via `updateInputValue`), utile pour des lignes non déductibles automatiquement des écritures.
- `CALCULATED` — évaluée par formule arithmétique référençant d'autres lignes déjà calculées (`evaluateFormula`).

**Multi-filiale + consolidé** : `generateBalanceSheet(year, context)` calcule **pour chaque filiale ET pour une sentinelle consolidée** (`CONSOLIDATED_SCOPE_ID = '__CONSOLIDATED__'`, nécessaire car deux `NULL` ne sont jamais égaux dans une contrainte `UNIQUE` Postgres) si l'utilisateur a la portée globale. `getBalanceSheet(year, context, subsidiaryIdFilter?)` résout le scope à afficher via `resolveScopeId` (drill-down si demandé, sinon consolidé pour ADMIN/FINANCIAL_DIRECTOR, sinon la propre filiale). Les valeurs `isManual` (saisies à la main) sont **préservées** lors d'une régénération automatique — seules les lignes jamais touchées manuellement sont recalculées. Comparatif N/N-1 automatique (`amountNetN1` copié depuis l'année précédente à chaque génération).

**`Compte de Résultat`** suit la même architecture (confirmée par la référence croisée `incomeStatementValue.findFirst({ ref: 'UZ' })` dans le calcul du Bilan pour injecter le résultat net de l'exercice comme ligne "CI").

### 2.9 Immobilisations

`ImmobilisationsService` (`accounting/immobilisations/`) :
- **Amortissement linéaire au prorata temporis** : `computeAnnualDotation(asset, year)` — base amortissable = coût d'acquisition − valeur résiduelle ; l'année d'acquisition, la dotation est proratisée sur les mois restants (mois d'acquisition inclus) ; plafonnée pour ne jamais amortir sous la valeur résiduelle sur la dernière année.
- **`generateAnnualDepreciation(context, year)`** — traite toutes les immobilisations `ACTIVE` de la filiale en une passe, **idempotent** (`lastAmortizationYear >= year` → ignoré ; la référence `AMORT-{id}-{year}` empêche tout doublon même en cas de rejeu), génère l'écriture (débit 681300 "Dotation aux amortissements" / crédit compte d'amortissement, ex. 281000) et met à jour `cumulativeAmortization`.
- **`dispose(id, dto, context)`** — cession : solde l'amortissement cumulé, sort le bien de l'actif à sa valeur brute, constate une créance sur cession si `disposalAmount > 0`, et reconnaît la plus-value (crédit 754000) ou la moins-value (débit 654000) selon que le montant de cession dépasse ou non la valeur nette comptable. Marque le bien `DISPOSED` — devient intangible ensuite (`update()` refuse toute modification sur un bien cédé).

### 2.10 Accès temporaire à la comptabilité (JIT) — `accounting-access`

Un mécanisme indépendant du RBAC standard, spécifique au périmètre comptable :
- `AccountingAccessGuard` — accès libre pour `ADMIN` siège ; pour tout autre utilisateur, vérifie une `AccountingAccessRequest` `APPROVED` et non expirée (`hasActiveAccess`).
- `AccountingAccessService.createRequest` — un utilisateur non-ADMIN soumet une justification texte ; bloque si une demande `PENDING` ou un accès actif existe déjà ; notifie (in-app + email) tous les ADMIN siège.
- `approve(id, { duration, unit: HOURS|DAYS })` / `reject(id, { rejectionNote? })` — réservés à l'ADMIN siège ; l'approbation fixe une `expiresAt` calculée depuis maintenant.
- `countPending()` — alimente un badge dans la sidebar.

### 2.11 Scope multi-filiale — `common/utils/subsidiary-scope.ts`

Le point le plus important à bien reproduire, car c'est le pattern qui a corrigé plusieurs failles de sécurité identifiées dans l'audit historique :

```typescript
// Vue consolidée réservée à l'ADMIN seul, par défaut (autres domaines : stock, RH...)
effectiveScopeContext(context) // neutralise isHeadquarter sauf pour ADMIN

// Comptabilité/Finance : liste de rôles habilités, PAS un seul rôle en dur
const ACCOUNTING_GLOBAL_SCOPE_ROLES = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];

hasGlobalScope(context, allowedRoles = ACCOUNTING_GLOBAL_SCOPE_ROLES): boolean
  // isHeadquarter && activeRole ∈ allowedRoles

resolveSubsidiaryFilter(context, subsidiaryIdFilter?, allowedRoles?): string | undefined
  // pas de portée globale -> toujours sa propre filiale (subsidiaryIdFilter IGNORÉ, jamais un moyen de contourner le scope)
  // portée globale + filtre fourni -> drill-down sur cette filiale
  // portée globale + rien -> undefined (vue consolidée, aucun filtre where)

assertSubsidiaryAccess(entitySubsidiaryId, context, allowedRoles?): void
  // à appeler après TOUT findUnique/findFirst par id, avant lecture/modification/suppression
  // lève ForbiddenException si pas de portée globale ET filiale différente

accountingScopeContext(context) // adapte le contexte pour withSubsidiaryScope existant, sans changer son comportement pour les autres domaines (CRM, RH...)
```

**Règle produit explicite (documentée dans le code)** : "consolidé par défaut pour ADMIN+FINANCIAL_DIRECTOR du siège, avec drill-down filiale au choix — jamais un simple binaire tout-ou-ma-filiale". Chaque endpoint qui expose une vue consolidée doit accepter un paramètre `subsidiaryId` optionnel de drill-down, silencieusement ignoré pour un utilisateur non habilité.

---

## 3. Architecture de référence — Frontend (gmo, état actuel)

### 3.1 Structure

```
components/
  Accounting.tsx                    # shell : tabs + gate d'accès JIT + countdown
  accounting/
    AccountingDashboard.tsx         # KPI + graphiques (Recharts)
    ChartOfAccounts.tsx             # plan comptable (table + seed + toggle actif)
    EntryModal.tsx                  # ⭐ formulaire d'écriture multi-lignes
    AccountModal.tsx                # créer/éditer un compte
    JournalEntries.tsx              # liste paginée + valider
    JournalDetail.tsx               # regroupé par journal > compte
    GeneralLedger.tsx                # grand livre (1 compte à la fois)
    TrialBalance.tsx                 # balance générale
    FinancialStatements.tsx          # wrapper Bilan/CdR/TAFIRE (accès restreint ADMIN+FINANCIAL_DIRECTOR)
    AccountingSettings.tsx           # 3 sous-onglets : mappings / journaux / périodes
    AccountingAccessAdmin.tsx        # (route dédiée) liste + approuver/rejeter les demandes JIT
    AccountingAccessRequestView.tsx  # écran "accès refusé, demander l'accès"
  finance/
    BalanceSheetView.tsx / BalanceSheetPrintContent.tsx
    IncomeStatementView.tsx / IncomeStatementPrintContent.tsx
    TafireView.tsx / TafirePrintContent.tsx
  filters/SubsidiaryFilter.tsx       # sélecteur filiale réutilisable (auto-fetch)
  ui/{TableSkeleton,EmptyState,AsyncButton}.tsx

services/
  AccountingService.ts               # accounts/entries/balance/ledger/dashboard/journals/mappings/periods
  accountingAccessService.ts
  balanceSheetService.ts / incomeStatementService.ts
```

**Constat important** : le frontend gmo **ne couvre pas tout ce que le backend sait faire** — pas de page Immobilisations, pas de bouton "extourner" une écriture. À corriger dans le plan caapmedia plutôt qu'à reproduire cette lacune (§5).

### 3.2 Pages — description détaillée

Le module est **un seul écran à onglets côté client** (`/dashboardview/accounting`), pas des sous-routes — aucun deep-link vers un onglet précis. Onglets : Dashboard, Plan comptable, Écritures, Journal (vue groupée), Grand Livre, Balance, États financiers (Bilan/CdR/TAFIRE, restreint), Paramètres (mappings/journaux/périodes). Une seconde route séparée (`/dashboardview/accounting-access-requests`) gère l'administration des demandes d'accès JIT.

Tout l'accès au module passe par un **gate JIT** : `Accounting.tsx` vérifie `accountingAccessService.getMyAccess()` (poll 60s) et affiche `AccountingAccessRequestView` tant qu'aucun accès actif n'existe (sauf ADMIN siège, libre). Une fois accordé, un badge "expire dans Xh" reste affiché en permanence (recalculé toutes les 30s).

### 3.3 Composant clé — `EntryModal.tsx` (validation d'équilibre en temps réel)

```tsx
// État : lignes {accountId, description, debit, credit}[], initialisé à 2 lignes vides
// updateLine(index, field, value) : maj immuable + validation par champ (validateAmount, min 0.01)
//   -> erreurs stockées par clé "line-2.debit", bordure rouge + message sous le champ

const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;   // tolérance flottant

// Bannière verte "Équilibré" / rouge "Non équilibré — Écart : X FCFA"
// Bouton Enregistrer : disabled={!isBalanced || isPending || hasAmountErrors}

// Garde-fous supplémentaires au submit (défense en profondeur, même si le bouton
// devrait déjà bloquer) : équilibre, journal sélectionné, chaque ligne a un compte
// -> toast.error() ciblé pour chacun.
```
Aucun aller-retour serveur pendant la saisie — la validation d'équilibre est 100% client, le backend revalide de toute façon à la création.

### 3.4 Data fetching — TanStack Query partout

Pas de couche de hooks custom : les composants appellent directement `useQuery`/`useMutation` avec des fonctions de service simples (objets de fonctions async, pas de classes) important un client axios partagé (`services/apiClient.ts`, interceptor `Authorization: Bearer` depuis `localStorage`).

```ts
// Clé de requête = [ressource, ...tous les filtres qui doivent déclencher un refetch]
useQuery({
  queryKey: ['accounting-entries', selectedSubsidiaryId, startDate, endDate, page, pageSize],
  queryFn: () => accountingService.getEntries(selectedSubsidiaryId || undefined, startDate, endDate, page, pageSize),
});

useMutation({
  mutationFn: (id) => accountingService.validateEntry(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounting-entries'] }),
});
```
Requêtes dépendantes via `enabled:` (ex. Grand Livre : `enabled: !!selectedAccount`). Polling (`refetchInterval`) réservé aux écrans "vivants" : accès JIT (30-60s), badge de demandes en attente (60s).

### 3.5 Pattern consolidé/drill-down côté UI

```ts
const isSiegeView = !!subsidiary?.isHeadquarter &&
  (activeRole === UserRole.ADMIN || activeRole === UserRole.FINANCIAL_DIRECTOR);
```
- Sélecteur de filiale **conditionnellement rendu** (pas juste désactivé) : absent pour tout utilisateur sans portée globale.
- `selectedSubsidiaryId === ''` → transmis comme `undefined` au service → le backend l'interprète comme "vue consolidée".
- Deux implémentations coexistent dans le code gmo lui-même : les écrans "historiques" (Écritures/Journal/Grand Livre/Balance/Dashboard) gèrent leur propre `<select>` inline sans vérifier le rôle pour l'AFFICHAGE (seulement pour la modification, via `canModify`) ; les écrans "récents" (Bilan/CdR) utilisent le composant extrait `SubsidiaryFilter` et gate l'affichage lui-même sur `isSiegeView`. **Recommandation pour caapmedia : repartir directement du pattern `SubsidiaryFilter` + gate par rôle partout, pas de la version historique moins cohérente.**

### 3.6 Navigation

2 routes réelles seulement (`/accounting`, `/accounting-access-requests`) ; tout le reste est du state de tab client. Sidebar : lien "Comptabilité" visible pour `ADMIN`/`FINANCIAL_DIRECTOR` uniquement (absent pour les autres rôles — le gate de navigation s'ajoute au gate JIT applicatif) ; lien "Demandes comptabilité" visible seulement pour `ADMIN` siège, avec badge de comptage en direct (poll 60s).

### 3.7 UX à reprendre telles quelles

- **Confirmation avant action irréversible** : pattern `showConfirm(message, action)` + modal générique — répété ~5 fois dans le code gmo (à **extraire en hook/composant partagé** pour caapmedia plutôt qu'à copier-coller, c'est une dette déjà identifiable dans la référence elle-même).
- **`TableSkeleton`** (lignes `<tr>` animées pulse, mêmes colonnes que la vraie table) + **`EmptyState`** (icône + titre + description, rendu dans un `<td colSpan>` pour ne pas casser la mise en page de la table).
- **Impression vs export PDF** : deux boutons distincts et deux mécanismes distincts — `html2canvas` (capture pixel-perfect de l'écran, pour l'impression et le Bilan/CdR) vs `jsPDF` + `jspdf-autotable` (rendu vectoriel/tabulaire, meilleur pour les rapports longs comme la Balance/le Grand Livre). Pattern "jumeau hors-écran" pour les templates de rapport : le même composant de présentation est monté deux fois — une fois visible, une fois `position:fixed; opacity:0; width:1100px` — pour que la capture soit toujours pleine largeur, jamais tronquée par le scroll/la responsivité de l'écran réel.
- **Année archivée = lecture seule** : Bilan/CdR désactivent la génération et la saisie pour toute année < année courante, avec un badge rouge explicite.
- **Erreurs de champ inline** (bordure + texte rouge sous le champ) vs **erreurs métier en toast** (déséquilibre, période fermée, 400 backend) — jamais mélangés.
- **Contrôles désactivés, pas cachés** pour les utilisateurs en lecture seule (`canModify` → `opacity-50 cursor-not-allowed`), pour garder la mise en page stable et communiquer "ça existe mais tu n'y as pas droit".

### 3.8 Style

Tailwind utilitaire pur, accent `#F7941F` (à remplacer par la couleur de marque caapmedia `#c6e911`, cohérent avec le reste de l'app déjà en place), palette neutre `slate-*`, cartes `bg-white rounded-xl shadow-sm border p-6`, tables avec zones colorées douces pour distinguer solde initial (gris) / mouvements (bleu) / solde final (orange) sur Balance et Grand Livre, `lucide-react` pour les icônes, `recharts` pour les graphiques du dashboard.

---

## 4. État actuel de caapmedia (repère, pas une contrainte de design)

| Aspect | caapmedia (actuel) | gmo (cible) |
|---|---|---|
| Plan comptable | `AccountingAccount` **par filiale** (`subsidiaryId`) | Global, partagé |
| Écritures | `JournalEntry`/`JournalEntryLine`, statut `DRAFT/POSTED/CANCELLED` | `AccountingEntry`/`AccountingEntryLine`, `DRAFT/VALIDATED/CANCELLED` |
| Numérotation | `entryNumber` : simple `String @unique`, pas de compteur légal | `AccountingJournalSequence`, compteur atomique par journal/filiale/exercice |
| Extourne | Absente | `reverseEntry()` avec `reversalOfEntryId` |
| Génération auto | `JournalizationService.journalize()` — point d'entrée unique mais étroit (7 `sourceType`, pas de ventes/achats/paie/immobilisations/transport), erreurs **avalées silencieusement** (`catch` + `logger.error`, jamais remonté) | 8 domaines, 13 générateurs, pattern Outbox (jamais perdu) |
| Comptes de trésorerie | `journalCode` fixe par catégorie de dépense (`EXPENSE_CATEGORY_ACCOUNT`), pas de table de mapping consultée dynamiquement en base pour la trésorerie | `AccountingMapping` consultée pour tout, reconfigurable sans déploiement |
| Périodes | `FiscalYear` — granularité année civile, `isActive`/`isClosed` | `AccountingPeriod` — bornes libres, `OPEN/CLOSED` |
| Immobilisations | `FixedAsset` — coquille minimale (nom, coût, taux, date), pas de suivi d'amortissement cumulé ni de cession | `Immobilisation` complet (§2.9) |
| Bilan/CdR | `finance/balancesheet`, `finance/incomestatement` déjà présents (mêmes noms que gmo !) — profondeur à vérifier séparément, hors périmètre de cette analyse | Template-driven, multi-filiale + consolidé |
| Scope multi-filiale | `common/utils/subsidiary-scope.ts` **déjà générique** : `resolveScopeContext(user, extraGlobalRoles)` accepte déjà une liste de rôles supplémentaires — il suffit de l'appeler avec `[UserRole.FINANCIAL_DIRECTOR]` pour le périmètre compta/finance, **pas besoin de reconstruire ce helper** | `hasGlobalScope`/`resolveSubsidiaryFilter`/`assertSubsidiaryAccess` avec `ACCOUNTING_GLOBAL_SCOPE_ROLES` |
| Accès JIT comptabilité | Inexistant | `accounting-access` (demande/approbation/expiration) |
| Frontend | `Frontend/Pages/Accounting.tsx` + `Frontend/components/accounting/{ChartOfAccounts,JournalCentralisateur,JournalEntries}.tsx` + `Frontend/services/apiAccounting/apiAccounting.ts` — 3 composants seulement | 8 écrans + Bilan/CdR/TAFIRE + accès JIT |

**Bonne nouvelle pour l'implémentation** : `Doc/plan_comptable.md` (référentiel de comptes OHADA) est **déjà identique** entre les deux projets, et le helper de scope multi-filiale de caapmedia est **déjà plus générique** que celui que gmo a dû retro-corriger — deux briques réutilisables sans adaptation.

---

## 5. Plan d'implémentation pour caapmedia

Approche recommandée : **Strangler Fig**, comme gmo l'a fait pour son propre refactor (§7.1 de son audit) — pas de big-bang. Construire le nouveau moteur à côté, migrer domaine par domaine, ne retirer l'ancien qu'une fois chaque domaine validé.

### Phase 1 — Schéma Prisma (fondations)
1. Nouveau modèle `AccountingAccount` **global** (retirer `subsidiaryId`) — ou, si le choix produit est de garder un plan comptable par filiale (à trancher, voir §6), au minimum ajouter les champs manquants (`class: Int?`, hiérarchie `parentId` déjà présente).
2. `AccountingJournalSequence` (nouveau) — compteur atomique.
3. `AccountingEntry` : ajouter `sequentialNumber?`, `reversalOfEntryId?`, `isValidated` (garder `status` en source de vérité unique, cf. recommandation gmo §2.7 — ne PAS dupliquer les deux champs comme gmo l'a fait par accident historique).
4. `AccountingPeriod` (remplace/complète `FiscalYear`) — bornes libres par filiale.
5. `AccountingMapping` — passer de "par filiale" (si c'est le cas actuellement) à global, ou clarifier le choix.
6. `AccountingOutboxEntry` + enum `AccountingOutboxStatus`.
7. Étendre `FixedAsset` → `Immobilisation` (category, amortizationAccountCode, cumulativeAmortization, lastAmortizationYear, status, disposalDate/Amount) — **suivre le même pattern de migration ID préfixé** que la session précédente sur ce projet (voir `Doc/migration-id-prefixes-plan.md`) : `generateId(ID_PREFIXES.IMMOBILISATION)`, pas `@default(uuid())`.
8. `BalanceSheetTemplate`/`BalanceSheetValue` (si la profondeur actuelle de `finance/balancesheet` ne les a pas déjà) + équivalents Compte de Résultat, avec la sentinelle `CONSOLIDATED_SCOPE_ID`.

### Phase 2 — Moteur d'écriture (`EntriesService`)
Réécrire selon le contrat de §2.2 : `create`/`validateEntry`/`reverseEntry`/`assignSequentialNumber`/`createAutomaticEntry`, en réutilisant `resolveScopeContext`/`assertSubsidiaryAccess` déjà existants dans caapmedia (pas besoin de recréer `hasGlobalScope` — juste passer `extraGlobalRoles: [UserRole.FINANCIAL_DIRECTOR]` à `resolveScopeContext` sur ce domaine).

### Phase 3 — Outbox + handlers par domaine
1. `AccountingOutboxService.enqueue(tx, {...})` + `AccountingOutboxProcessor` (Cron `@nestjs/schedule`, déjà une dépendance probable vu son usage ailleurs dans caapmedia — à vérifier).
2. Extraire `JournalizationService` actuel (394 lignes, point d'entrée unique mais synchrone/erreurs avalées) en handlers par domaine, en élargissant la couverture aux domaines caapmedia pertinents : ventes (`ecommerce/orders`), achats (`purchase/purchase-orders`), trésorerie (`finance/treasury`), paie (`hr/payrollrecord`), charges (`finance/expense`), ajustement de stock (`purchase/stock-movements` — cohérent avec le travail déjà fait cette session sur ce module).
3. Brancher `enqueue()` dans la même transaction Prisma que chaque opération métier source, à la place de l'appel synchrone actuel.

### Phase 4 — Comptes / Mappings / Journaux
1. Généraliser `AccountingMapping` en registre global consulté par tous les handlers (avec cache TTL comme gmo, ou directement sans cache si le volume ne le justifie pas encore).
2. `seedOhadaAccounts()` à partir de `Doc/plan_comptable.md` (déjà partagé), **sans** les libellés nominatifs spécifiques à gmo (fournisseurs/produits) — génériques ou paramétrables par filiale via la config existante.
3. 5 journaux fixes (AC/VT/BQ/CA/OD) si pas déjà le cas.

### Phase 5 — Rapports
1. `AccountingBalanceService` partagé (`accounting/shared/`), unifiant le calcul de solde.
2. `ReportsService` : Balance générale, Grand Livre, Dashboard — branchés sur le service partagé, avec `subsidiaryIdFilter` optionnel partout où une vue consolidée existe.

### Phase 6 — Bilan / Compte de Résultat OHADA
1. Vérifier la profondeur actuelle de `finance/balancesheet`/`finance/incomestatement` (déjà présents dans caapmedia sous les mêmes noms — probablement une base à étendre plutôt qu'à recréer, à auditer séparément avant de décider si c'est une extension ou une réécriture).
2. Ajouter la dimension filiale + sentinelle consolidée si absente, avec drill-down.

### Phase 7 — Immobilisations
Construire `accounting/immobilisations/` (service + controller + DTOs) sur le modèle de §2.9, branché sur `ImmobilisationAccountingService` (nouveau handler, appel direct, pas via l'outbox — cohérent avec gmo).

### Phase 8 — Accès temporaire à la comptabilité (à valider avec l'utilisateur, §6)
Optionnel selon la politique de sécurité souhaitée pour caapmedia — porter `accounting-access` (demande/approbation/expiration) si le besoin existe, sinon s'appuyer uniquement sur le RBAC standard déjà en place (`FINANCIAL_DIRECTOR`/`ADMIN`).

### Phase 9 — Frontend
1. `Frontend/Pages/Accounting.tsx` — shell à onglets (garder la convention TanStack Router de caapmedia, cf. `router.tsx` existant).
2. `Frontend/components/accounting/` — un composant par écran (Dashboard, ChartOfAccounts, EntryModal, JournalEntries, JournalDetail, GeneralLedger, TrialBalance, AccountingSettings), **plus** deux écrans absents chez gmo mais utiles : gestion des immobilisations, bouton d'extourne sur une écriture validée.
3. `Frontend/components/finance/` — BalanceSheetView/IncomeStatementView, réutilisant `SubsidiaryFilter` (`Frontend/components/filters/`, déjà existant dans caapmedia) dès le départ plutôt que de dupliquer un sélecteur inline comme les écrans historiques de gmo.
4. `Frontend/services/apiAccounting/` — un fichier par sous-domaine plutôt qu'un seul `apiAccounting.ts` monolithique, cohérent avec la convention caapmedia observée ailleurs (`apiE-commerce/`, `apiCrm/` éclatés en plusieurs fichiers).
5. Extraire un `useConfirm()`/`<ConfirmModal>` partagé dès le départ (gmo ne l'a pas fait, c'est une dette qu'ils ont eux-mêmes accumulée — autant l'éviter).
6. Formulaire d'écriture (`EntryModal`) : reprendre exactement le pattern de validation d'équilibre en temps réel de §3.3 (logique éprouvée, aucune raison de la redessiner).
7. i18n : namespace `accounting.*` dans les fichiers de locale existants de caapmedia (`i18n/index.tsx`, structure déjà vue dans ce projet), pas de chaînes en dur.

### Phase 10 — Migration des données existantes
Point de décision produit, pas juste technique — voir §6. Si des `JournalEntry` existent déjà en production, il faut soit les migrer vers le nouveau modèle (mapping de champs + génération rétroactive de numéros séquentiels dans l'ordre chronologique), soit démarrer le nouveau moteur à blanc à une date de bascule et conserver l'ancien historique en lecture seule.

---

## 6. Points de décision à trancher avant de commencer l'implémentation

1. **Plan comptable global vs par filiale** — gmo est global (un seul plan comptable partagé). caapmedia actuel est par filiale. C'est un choix structurant qui touche tout le reste (mappings, seed, requêtes de solde) — à confirmer avec l'utilisateur avant la Phase 1.
2. **Accès temporaire JIT (Phase 8)** — fonctionnalité métier réelle chez gmo (accès sensible, traçabilité), mais c'est un chantier à part entière (notifications, emails, UI d'administration dédiée). Vaut-il la peine dès la V1, ou le RBAC standard (`FINANCIAL_DIRECTOR`/`ADMIN`) suffit-il pour caapmedia ?
3. **Bilan/CdR** : périmètre exact de ce qui existe déjà dans `finance/balancesheet`/`finance/incomestatement` de caapmedia — à auditer avant de décider "étendre" vs "réécrire" (hors périmètre de cette analyse, qui portait sur gmo).
4. **Migration de l'historique** (Phase 10) — y a-t-il des écritures `JournalEntry` en production à préserver, ou peut-on repartir à blanc ?
5. **Portée immédiate** — vu l'ampleur (10 phases), veut-on tout construire d'un coup, ou prioriser un sous-ensemble (ex. Phases 1-2-3-5 = moteur + rapports, en repoussant Immobilisations/Bilan-CdR/Accès-JIT à une itération suivante) ?

---

## Annexe — Fichiers gmo analysés pour ce document

```
Backend_GMO/src/accounting/accounting.module.ts
Backend_GMO/src/accounting/entries/entries.service.ts, entries.controller.ts
Backend_GMO/src/accounting/entries/handlers/{sales,purchase,treasury,payroll,misc-accrual,immobilisation}-accounting.service.ts
Backend_GMO/src/accounting/entries/handlers/accounting-mappings-cache.service.ts
Backend_GMO/src/accounting/outbox/accounting-outbox.{service,processor}.ts
Backend_GMO/src/accounting/accounts/accounts.service.ts, mappings.service.ts
Backend_GMO/src/accounting/journals/journals.service.ts
Backend_GMO/src/accounting/periods/periods.service.ts, periods.controller.ts
Backend_GMO/src/accounting/reports/reports.service.ts
Backend_GMO/src/accounting/shared/accounting-balance.service.ts
Backend_GMO/src/accounting/immobilisations/immobilisations.service.ts, immobilisations.controller.ts
Backend_GMO/src/accounting-access/accounting-access.service.ts, accounting-access.guard.ts
Backend_GMO/src/finance/balancesheet/balancesheet.service.ts
Backend_GMO/src/common/utils/subsidiary-scope.ts
Backend_GMO/prisma/schema.prisma (modèles comptabilité/immobilisations/bilan, ~lignes 1780-2140)
Doc/AUDIT_ARCHITECTURE_COMPTABILITE.md (918 lignes, lu en entier)
Doc/GUIDE_TECHNIQUE_COMPTABILITE.md (661 lignes, lu en entier — identifié comme non représentatif du code réel)
Doc/plan_comptable.md (identique à la version caapmedia, vérifié par diff)

Frontend_GMO/components/Accounting.tsx, accounting/*.tsx (11 fichiers), finance/{BalanceSheetView,BalanceSheetPrintContent,IncomeStatementView}.tsx
Frontend_GMO/components/filters/{SubsidiaryFilter,PeriodFilter}.tsx
Frontend_GMO/services/{AccountingService,accountingAccessService,balanceSheetService,incomeStatementService,apiClient}.ts
Frontend_GMO/router.tsx, components/Sidebar.tsx
(exploration frontend menée par un agent dédié, rapport intégré en §3)

Fichiers caapmedia consultés pour le repère §4 (pas pour contraindre le design) :
backend/prisma/schema.prisma (modèles AccountingAccount/FiscalYear/AccountingJournal/AccountMapping/JournalEntry/JournalEntryLine/FixedAsset)
backend/src/accounting/journalization/journalization.service.ts
backend/src/finance/{balancesheet,incomestatement,assets}/*.service.ts
backend/src/common/utils/subsidiary-scope.ts
Frontend/Pages/Accounting.tsx, Frontend/components/accounting/*.tsx, Frontend/services/apiAccounting/apiAccounting.ts
Doc/plan_comptable.md
```
