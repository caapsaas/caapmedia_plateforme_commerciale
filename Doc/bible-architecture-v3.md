# Bible d'Architecture Fonctionnelle & Produit — CaapMedia ERP v3

> **Document de référence issu du cadrage exhaustif complet (Tours 1 à 10).**
> Il définit l'organisation cible des espaces, le nettoyage des doublons, les machines à états exhaustives (cas standards et imprévus réels), la traçabilité des flux d'argent, le référentiel des documents aux normes camerounaises et OHADA, le nouveau Design System ERP, les KPIs utiles par rôle et le découpage en lots de refonte.

---

## Table des matières

1. [Chapitre 1 — Plan de Nettoyage, Fusions & Suppressions](#chapitre-1--plan-de-nettoyage-fusions--suppressions)
2. [Chapitre 2 — Nouvel Organigramme des Espaces, Nomenclature & Gouvernance](#chapitre-2--nouvel-organigramme-des-espaces-nomenclature--gouvernance)
3. [Chapitre 3 — Machines à États & Workflows Complets (Cas Normaux + Exceptions Réelles)](#chapitre-3--machines-à-états--workflows-complets-cas-normaux--exceptions-réelles)
4. [Chapitre 4 — Architecture des Flux d'Argent & Traçabilité Totale](#chapitre-4--architecture-des-flux-dargent--traçabilité-totale)
5. [Chapitre 5 — Référentiel des Documents Officiels (Standard Cameroun & OHADA)](#chapitre-5--référentiel-des-documents-officiels-standard-cameroun--ohada)
6. [Chapitre 6 — Design System ERP « Precision Workspace » & Ergonomie des Formulaires](#chapitre-6--design-system-erp--precision-workspace--ergonomie-des-formulaires)
7. [Chapitre 7 — Cockpits Décisionnels, KPIs & Graphiques par Rôle](#chapitre-7--cockpits-décisionnels-kpis--graphiques-par-rôle)
8. [Chapitre 8 — Feuille de Route : Découpage en Lots de Refonte (Serveur & Client)](#chapitre-8--feuille-de-route--découpage-en-lots-de-refonte-serveur--client)

---

## Chapitre 1 — Plan de Nettoyage, Fusions & Suppressions

L'objectif est de **supprimer tout ce qui fait doublon, trompe ou encombre**, sans perdre aucune capacité métier réelle.

### 1.1 Ce qui est supprimé ou remplacé

| Ancien élément (v2) | Problème constaté | Décision v3 |
|---|---|---|
| **Bilan & Compte de résultat dans Finance** | Doublon approximatif avec la Comptabilité (`COGS = 0`, `Stock = 0`). | **Supprimé.** Une seule vérité légale dans *Comptabilité & Fiscalité* (SYSCOHADA). *Trésorerie / Pilotage* affiche à la place le Cash-Flow réel et la Rentabilité opérationnelle. |
| **Écrans éparpillés : *Mes Commandes*, *Historique des créances*, *Finance → Crédits*** | Trois vues fragmentées pour le même objet (les commandes et leur solde dû). | **Fusionnés** dans *Commandes & Facturation* (avec vues filtrées : *À facturer*, *Créances / Impayés*, *À livrer*, *SAV*). |
| **Onglets fictifs / simulés dans l'Espace Client** | *Moyens de paiement* et *Avis* (« Bientôt disponible »), mot de passe simulé. | **Supprimés ou remplacés par du réel** : Suivi de production, Proformas acceptables en ligne, Factures/Reçus/BL téléchargeables, Solde dû et Changement de mot de passe réel. |
| **Ancien type de caisse (`CAISSE`), anciennes options produit figées, anciens jetons QR redondants** | Cohabitation d'anciens modèles avec les nouveaux. | **Unifiés et purgés** au profit d'un modèle unique par concept (`Caisse enregistreuse`, `Constructeur de formulaires`, `Pointage QR filiale`). |
| **Terminologie mixte `IFU` et devise `XOF`** | Incohérent avec l'activité et la paie camerounaises. | **Normalisé 100 % Cameroun :** `NIU` (Numéro d'Identifiant Unique), `RCCM`, `Centre des Impôts`, `FCFA (XAF)`. |
| **KPIs factices ou à zéro** (*Valeur du stock = 0*, *Revenu net = Ventes payées*, graphique *Achats dans le temps* vide) | Perte de confiance des utilisateurs dans les chiffres affichés. | **Remplacés** par des métriques calculées sur des données réelles (stock valorisé au CMP/dernier prix, marge brute réelle, achats chronologiques réels). |
| **Boutons/modales débranchés sur la vitrine** (favoris cachés, modale devis non câblée) | Code mort et parcours cassés. | **Câblés proprement** (demande de devis directement intégrée à l'ERP en plus de WhatsApp) ou retirés s'ils n'apportent rien. |

### 1.2 Ce qui est regroupé et clarifié

- **Commerce :** 6+ entrées actuelles → **3 espaces orientés flux** : *CRM & Devis*, *Commandes & Facturation*, *Caisse & Encaissements*.
- **Finance & Comptabilité :** 1 module fourre-tout + 3 pages satellites → **3 espaces clairs** : *Trésorerie & Flux*, *Dépenses & Engagements*, *Comptabilité & Fiscalité*.
- **Opérations :** *Équipements*, *Maintenance*, *Coûts horaires* et *Workflows de fabrication* dispersés entre menus et Configuration → **1 espace *Production & Atelier*** (intégrant l'onglet *Parc Machines & Maintenance*) + **1 section *Ingénierie Catalogue & Tarifs*** dans Configuration.

---

## Chapitre 2 — Nouvel Organigramme des Espaces, Nomenclature & Gouvernance

### 2.1 Architecture globale de la navigation interne

```text
├── 1. COCKPIT (Tableau de bord adapté au rôle actif)
│   ├── Vue Direction / Consolidation (Admin, Super Admin, DAF)
│   ├── Analyse Commerciale & Marges
│   └── Analyse Achats & Stocks
│
├── 2. COMMERCE & CLIENTS
│   ├── CRM & Devis (Prospects, Comptes, Contacts, Opportunités, Contrats, Proformas, IA Marketing)
│   ├── Commandes & Facturation (Commandes, Factures, Avoirs, Livraisons, Créances, SAV)
│   └── Caisse & Encaissements (Point de vente comptoir, Encaissement créances, Reçus du jour)
│
├── 3. PRODUCTION & OPÉRATIONS
│   ├── Production & Atelier (File validation, Kanban avec pauses/retours, Prélèvements, SAV)
│   ├── Achats & Fournisseurs (Besoins d'achat, Commandes fournisseurs, Réceptions, Bons d'entrée/retour)
│   ├── Stocks & Mouvements (Niveaux valorisés, Alertes seuils, Transferts inter-filiales, Inventaires)
│   └── Parc Machines & Maintenance (Équipements, Alertes entretien, Journal interventions)
│
├── 4. ARGENT & COMPTABILITÉ
│   ├── Trésorerie & Flux (Banques, Coffres, Caisses, Virements, Remises de caisse, Préfinancement, Validation Maker-Checker)
│   ├── Dépenses & Engagements (Expressions de besoin, Dépenses ponctuelles & récurrentes, Dettes fournisseurs & Avoirs, Dettes LT, Opérations externes)
│   └── Comptabilité & Fiscalité (Écritures OHADA, Journaux, Grand Livre, Balance 6 col., États SYSCOHADA, Immobilisations, Dossier Fiscal Cameroun DGI/CNPS, Accès temporaires JIT)
│
├── 5. RESSOURCES HUMAINES, PROJETS & SECRÉTARIAT
│   ├── Projets & Matrices RACI (Projets transverses, Matrices R/A/C/I, Délégations)
│   ├── Ressources Humaines (Employés, Pré-embauche, Pointage & Régularisations, Congés & Absences, Avances/Prêts, Paie & Charges, Signature bulletins)
│   └── Secrétariat (Documents d'entreprise, Réunions & PV, Tâches administratives)
│
└── 6. GOUVERNANCE & PARAMÈTRES
    ├── Notifications & Alertes
    ├── Configuration (Filiales & Calendriers, Utilisateurs & Rôles, Catalogue & Constructeur specs, Workflows & Coûts horaires, Marges & Acomptes, Modèles RACI, Taxes & Plan comptable, Banques & Comptes)
    ├── Audit & Santé Système (Journal sécurité authentification, Santé des intégrations — Super Admin)
    └── Sécurité Personnelle (2FA, Codes de secours, Sessions actives)
```

### 2.2 Modèle Siège, Filiales & Matrice de Gouvernance

- **Unification multi-filiales & Souplesse encadrée :** Chaque filiale a son propre périmètre opérationnel, son taux d'IS, son centre des impôts, ses jours ouvrés, ses jours fériés et sa zone géographique de pointage.
  - **Mutation tracée :** Un employé ou utilisateur peut être muté vers une autre filiale tout en conservant intact son historique dans la filiale d'origine.
  - **Accès multi-filiales sur autorisation :** Le Super Admin peut accorder à un utilisateur/cadre précis l'accès à plusieurs filiales sélectionnées (avec sélecteur de filiale active dans l'en-tête).
- **Protection des données & Audit global :**
  - **Zéro suppression destructive en cascade sur des tiers liés :** Tout fournisseur, client, article ou employé ayant un historique opérationnel/financier est **archivé ou désactivé** par défaut plutôt que purgé.
  - **Piste d'audit globale & Écran d'Audit Sécurité :** Consignation centralisée de qui a fait quoi et quand (connexions, 2FA, validations, extournes, dérogations) consultable dans un espace dédié pour le Super Admin.
- **Séparation des tâches + Maker-Checker étendu :**
  - **Super Administrateur :** Supervision consolidée multi-filiales, paramétrage maître, approbation des expressions de besoin, audit sécurité & intégrations, accès permanent comptabilité. Reste **en lecture seule sur la saisie opérationnelle quotidienne** (commerce, achats, stock, maintenance, secrétariat) ; toute dérogation exceptionnelle d'urgence passe par une action tracée.
  - **Directeur Financier (DAF) :** Dispose en v3 du pouvoir d'exécution et de **double validation (Maker-Checker)** sur les opérations financières de sa filiale (paiement de dettes fournisseurs par coffre ou banque, validation de remises avec écart, validation des décaissements avec un second valideur distinct de l'initiateur). L'accès à la Comptabilité reste soumis à l'autorisation temporaire (JIT) du Siège (ou accès permanent si configuré au Siège par l'Admin Siège).
  - **Admin Filiale :** Pilote toute sa filiale au quotidien ; l'**Admin du Siège** conserve la gouvernance des accès comptables JIT.
  - **Caissier :** Opère exclusivement sa ou ses caisses assignées, encaisse les ventes/créances et déclare ses remises de caisse.
  - **Commercial, Responsable Achats, Directeur de Production, Responsable RH, Responsable Pré-embauche, Secrétaire :** Chacun dispose d'un cockpit et d'espaces centrés sur son métier, avec bascule de rôle serveur instantanée pour les profils multi-rôles.

---

## Chapitre 3 — Machines à États & Workflows Complets (Cas Normaux + Exceptions Réelles)

> **Principe v3 :** Le chemin normal s'exécute en 1 à 2 clics. Chaque cas d'exception réel est prévu par un statut explicite, un **motif obligatoire** et des **effets automatiques propres**.

### 3.1 Cycle Commercial : Prospect → Opportunité → Proforma (Multi-portes)

- **Multi-portes :** Une Proforma peut être créée depuis un **Prospect**, depuis une **Opportunité** existante, ou directement pour un **Client (Contact)** existant. Les conversions fonctionnent dans les deux sens (`Opportunité ↔ Proforma ↔ Commande`).
- **Révisions de Proforma :** Chaque modification négociée après envoi crée une nouvelle version (`PRO-2026-0042-v1`, `-v2`, `-v3`) tout en archivant les versions précédentes en lecture seule.

**Statuts d'une Proforma :**
`Brouillon` → `Envoyée` → `Vue (client)` → `En révision (nouvelle version)` / `Acceptée (client ou interne)` → `Convertie en commande`  
*Exceptions :* `Refusée (motif client)` | `Expirée (automatique à date de validité)` | `Annulée`

### 3.2 Cycle Commande, Acompte, Production & SAV

```text
[1] Brouillon / En attente de validation atelier
       ├──► Renvoyée au commercial ("À corriger" — motif obligatoire : marge, fichier BAT, specs)
       ├──► Annulée avant production (motif obligatoire)
       └──► Validée pour production (vérifie règle d'acompte OU dérogation B2B tracée)
              │
              ▼
[2] En production (Atelier Kanban)
       ├── Prépresse ◄──► Impression ◄──► Finition ──► Prêt pour livraison
       │      │              │             │
       │      └──────► En Pause / Bloquée ◄┘ (motif : Attente BAT client / Panne machine / Rupture matière)
       │
       │  *Rétrogradation autorisée d'une étape (ex. Finition → Impression pour réimpression) avec motif obligatoire*
       │
       ▼
[3] En attente de livraison
       ├──► Livraison partielle (reste à livrer conservé)
       └──► Livrée totalement
              │
              ├──► En SAV / Réclamation (retour client, défaut, réimpression gratuite ou reprise)
              └──► Clôturée / Terminée (uniquement si 100 % livrée ET 100 % payée/soldée)
```

**Règles d'acompte, de marge, de BAT & de workflows par filiale :**
- **Acompte & Dérogation B2B :** Pourcentage d'acompte requis paramétrable avant démarrage atelier ; dérogation possible par un **Directeur Financier ou Admin** pour lancer une commande B2B à crédit (avec motif tracé).
- **Contrôle de Marge Commerciale :** Si la marge saisie est inférieure au minimum autorisé (ou négative), la validation est **bloquée jusqu'à approbation tracée** d'un Admin, Super Admin ou DAF ; au-dessus du maximum, simple alerte informative.
- **Catalogue hybride & Contrôle BAT :** Conservation du calcul par coût machine + marge pour le sur-mesure, complété par des **grilles tarifaires indicatives par paliers** (ex. 100 / 500 / 1 000 ex.) et un **contrôle strict du BAT** (*BAT À valider* → *BAT Validé par client*) bloquant le passage en impression tant que le client n'a pas validé.
- **Workflows multi-filiales souples :** Les gammes de fabrication globales sont partageables entre filiales mais **surchargeables par filiale** selon le parc machines réel de chaque agence (avec coûts horaires configurés par machine réelle).

### 3.3 Cycle Facturation & Avoirs (Standard DGI Cameroun)

1. **Tant qu'une commande n'est pas facturée définitivement :** Seuls circulent des Proformas, Bons de Commande et Reçus d'Acompte.
2. **Émission de la Facture Définitive :** Attribue un numéro séquentiel continu sans trou (`FAC-FIL-YYYY-XXXXXX`), calcule la **TVA (19,25 %)** ou mentionne l'exonération légale, gère les **retenues à la source** (AIR / TVA retenue à la source par l'État ou grandes entreprises) et **verrouille définitivement la facture** (modification et suppression impossibles).
3. **Imprévu après facturation (annulation, retour marchandise, remise commerciale accordée) :** Émet obligatoirement une **Facture d'Avoir** (`AVO-FIL-YYYY-XXXXXX`) liée à la facture d'origine, qui ajuste la créance client (ou crée un crédit/remboursement) et génère l'écriture comptable inverse sans jamais altérer la facture d'origine.

### 3.4 Cycle Encaissements & Incidents de Paiement

```text
Encaissement saisi (Espèces / Mobile Money / Carte / Virement / Chèque)
  ├── Espèces en caisse assignée ──────────────────────► Encaissé / Validé immédiatement
  └── Chèque / Virement / TPE / Opérateur différé ──────► En attente de confirmation
        ├── Confirmation banque/opérateur (net + frais éventuels) ──► Encaissé
        └── Rejet / Chèque impayé / Échec opérateur ────────────────► Rejeté / Impayé
              └──► Rouvre automatiquement la créance sur la facture/commande,
                   crée une écriture de contre-passation, alerte Commercial + DAF + Caissier
```

### 3.5 Cycle Remises de Caisse & Gestion Réelle des Écarts

1. **Déclaration (`Soumise`) :** Le Caissier sélectionne sa caisse, déclare le montant physique remis au Coffre-fort et rattache les reçus/encaissements espèces concernés (`RC-FIL-YYYY-XXXX`).
2. **Contrôle physique au Coffre (DAF) :** Le Directeur Financier compte les espèces reçues et saisit le `Montant réellement compté`.
   - **Si Compté = Déclaré :** Statut `Reçue conforme`. La caisse est débitée et le coffre crédité du montant exact.
   - **Si Compté ≠ Déclaré (Manquant ou Excédent) :** Saisie d'un **motif obligatoire** → Statut `Reçue avec écart`.
     - Le **Coffre-fort** est crédité du **montant réel compté** (jamais d'argent fictif au coffre).
     - La **Caisse** du caissier est soldée du **montant déclaré**.
     - **L'écart** est automatiquement enregistré comptablement (compte d'attente / manquant de caisse à régulariser ou imputé au caissier / excédent de caisse) et notifié au Super Administrateur.
   - **Si Remise refusée (ex. billets douteux, bordereau erroné) :** Statut `Rejetée` avec motif, les fonds restent sous la responsabilité de la caisse.

### 3.6 Cycle Expressions de Besoin, Achats & Stocks

- **Expression de besoin :** `Soumise` → `Approuvée` (Super Admin) ou `Rejetée` (motif) ou `À préciser`. Une fois `Approuvée`, deux sorties possibles :
  1. **Règlement direct en Caisse Dépense** (petites dépenses / frais terrain, par le DAF).
  2. **Conversion en Bon de Commande Fournisseur** (achat de matière ou prestation, par le Responsable Achats).
- **Bon de commande fournisseur :** `Brouillon` → `En attente d'approbation` *(si au-dessus d'un seuil défini)* → `Commandé` → `Partiellement reçu` → `Reçu` **ou** `Clôturé avec reliquat annulé` *(si le fournisseur ne livrera pas le solde)* **ou** `Annulé`.
  - À la réception : saisie des **quantités conformes reçues** + **quantités refusées / endommagées** (générant automatiquement un **Bon de Retour Fournisseur** / demande d'avoir si besoin).
- **Dettes fournisseurs & Avoirs fournisseurs :** Réglables depuis un **Coffre-fort** OU depuis une **Banque** (soumis au circuit Maker-Checker). Les avoirs fournisseurs viennent en déduction de la dette.
- **Transferts de stock inter-filiales :** `Demandé` → `Expédié (En transit)` *(déduit du stock expéditeur)* → `Réceptionné` *(ajoute au stock destinataire ; en cas d'écart de transport, constatation de perte en transit)*.
- **Valorisation des stocks :** Calcul continu au **Coût Moyen Pondéré (CMP)** (ou dernier coût d'achat en secours) à chaque réception validée, alimentant en direct les bilans, marges et analyses.

### 3.7 Cycle Complet de la Paie, Pointage & Variables RH

- **Pointage :** QR Code de filiale + vérification optionnelle par **code PIN employé** et/ou **périmètre géographique (rayon configurable)**.
- **Régularisation & Missions :** Un employé ou son manager peut soumettre une **demande de régularisation** (*Oubli de badge*, *Mission extérieure*, *Intervention client*) avant ou après la génération automatique d'absence de 18h00 ; validation par le RH annule l'absence injustifiée.
- **Congés & Permissions :** `Demandé (Employé/RH)` → `Validé Manager/RH` → `Déduit du solde` (ou `Refusé` avec motif).
- **Avances sur salaire & Prêts :** Demande → Approbation DAF/RH → Décaissement (Coffre/Banque/Caisse dépense) → **Échéancier de retenue automatique** sur les bulletins de paie mensuels jusqu'à remboursement complet.
- **Traitement mensuel de la Paie en 4 temps distincts (séparant calcul, validation, argent et émargement) :**
  1. **Préparation & Variables (`Calculée / Brouillon` — RH) :** Pré-remplissage automatique assisté des absences injustifiées (avec option de retenue), échéances d'avances/prêts en cours et primes approuvées ; le RH peut ajuster manuellement les heures supplémentaires et régularisations avant soumission.
  2. **Validation budgétaire (`Validée / À payer` — DAF / Direction) :** Contrôle de la masse salariale et autorisation de mise en paiement.
  3. **Paiement réel par lots (`En cours de virement` / `Payée` — Banque ou Coffre via Maker-Checker) :** Décaissement effectif regroupé par mode de règlement (`Ordre de virement bancaire groupé`, `Chèques`, `Espèces`), générant les écritures comptables de règlement de paie.
  4. **Émargement & Distribution (`Signée / Archivée` — Employé) :** Signature électronique du bulletin ou accusé de réception indépendamment du mouvement bancaire, + accumulation automatique des charges sociales/fiscales du mois.

### 3.8 Cycle des Charges, Dépenses Récurrentes & Décaissements

- **Cycle en 3 temps pour toute charge ou dépense :**
  1. **Constatation (`Brouillon / À valider`) :** Saisie de la charge avec **pièce justificative obligatoire** (facture, reçu, devis prestataire).
  2. **Approbation :** Validation hiérarchique par le **DAF** ou le **Super Admin** selon le seuil financier (ou refus motivé).
  3. **Décaissement tracé (`Payée`) :** Règlement depuis le canal autorisé avec archivage de la preuve de paiement (quittance, avis de virement, décharge signée).
- **Encadrement strict de la Caisse Dépense (principe d'avance / Imprest) :**
  - Chaque opération en Caisse Dépense est limitée par un **plafond unitaire** (au-delà, passage obligatoire par Coffre-fort ou Banque).
  - Le réapprovisionnement depuis le Coffre-fort passe par une **demande de reconstitution tracée** accompagnée de la justification des dépenses déjà effectuées.
- **Règles de seuils et double validation par canal :**
  - **Caisse Dépense :** Petits montants courants (DAF).
  - **Coffre-fort :** Montants moyens ou dettes ; **double validation (Maker-Checker) obligatoire** au-delà d'un seuil paramétré.
  - **Banque :** Gros montants, fournisseurs, salaires, impôts et cotisations ; **double validation Maker-Checker systématique** quel que soit le montant.
- **Charges récurrentes intelligentes (Fixes vs Variables) :**
  - *Charges fixes* (loyer, assurance, abonnement internet) : génération automatique du constat à l'échéance avec montant pré-rempli.
  - *Charges variables* (électricité ENEO, eau CAMWATER, téléphone) : génération automatique à l'échéance d'une charge au statut **`À confirmer / Joindre facture`** afin que l'équipe saisisse le montant réel de la facture reçue avant validation et mise en paiement, avec alerte en cas de retard.

### 3.9 Cycle Administratif des Impôts & Cotisations Sociales (Cameroun : DGI & CNPS)

- **Périmètre suivi et provisionné :** Exclusivement les cotisations et taxes sociales/fiscales du périmètre métier actuel — **CNPS** (PVID, Allocations Familiales, Risques Pro A/B/C), **IRPP + CAC**, **CFC**, **FNE** et **TVA nette (Collectée − Déductible)** *(sans ajout d'impôts directs d'entreprise comme la Patente, la TDL ou les acomptes d'IS)*.
- **Workflow administratif complet en 5 états :**
  1. **`Calculé / Provisionné` :** Accumulation automatique en fin de mois (à partir de la paie et des ventes/achats).
  2. **`Télédéclaré / Déposé` :** Saisie du **numéro de déclaration DGI / DIPE CNPS** et archivage de l'**Avis d'Imposition / AMR** ou bordereau d'appel de cotisation.
  3. **`Approuvé pour paiement` :** Contrôle et ordonnancement par le DAF / Super Admin avant l'échéance légale (7 du mois pour CNPS, 15 du mois pour DGI).
  4. **`Payé` :** Décaissement tracé (Banque via Maker-Checker ou Caisse/Coffre selon plafond) avec archivage obligatoire de la **Quittance DGI** ou du **Bordereau de versement CNPS**.
  5. **Gestion des incidents (`En retard / Majorations`) :** Alerte automatique à l'approche et au dépassement des échéances ; possibilité d'enregistrer séparément les **pénalités / majorations de retard** sur l'échéance concernée pour garder une comptabilité et une traçabilité exactes.

### 3.10 Parc Machines, Pannes Atelier & Maintenance Financière

- **Signalement de panne en production :** Passer une machine en `En panne / Hors service` **met automatiquement en pause** les commandes en cours sur cette machine (motif *Panne machine*) et permet de **réaffecter l'étape** vers une machine de secours opérationnelle de la filiale.
- **Ticket de maintenance relié aux Dépenses :** Chaque intervention corrective ou préventive crée un ticket de maintenance relié au module **Dépenses / Expressions de besoin** afin de tracer le coût réel des pièces et prestataires, tout en gardant séparé le coût horaire d'exploitation.

### 3.11 Secrétariat, Notifications Proactives & Vitrine / Espace Client Connectés

- **Secrétariat complet :** Convocation réelle par e-mail avec suivi d'émargement/présence des participants → rédaction d'un PV structuré dont les **décisions se convertissent directement en Tâches assignées avec échéance** → clôture et verrouillage du PV (avec pièce jointe officielle). Coffre documentaire doté de **niveaux de confidentialité** (*Filiale*, *Direction*, *RH*) et d'un **versioning** des fichiers.
- **Notifications actives & proactives :** Temps réel dans l'application + vrais e-mails transactionnels + WhatsApp optionnel sur les jalons clients clés (*Proforma envoyée*, *BAT à valider*, *Commande prête à livrer*). Alertes proactives automatiques pour : **stock sous seuil**, **proforma expirant sous 3 jours**, **retard de livraison atelier**, **échéance DGI/CNPS J-5**, et **maintenance dépassée**.
- **Vitrine ↔ Espace Client (`/account`) :**
  - *Vitrine :* Le panier de devis permet soit d'envoyer une demande structurée (avec upload maquette) directement dans le **CRM (Lead + Demande de devis)**, soit de contacter l'équipe via WhatsApp.
  - *Espace Client :* Suivi en direct de l'avancement atelier, **acceptation/refus en ligne des Proformas et des BAT**, consultation du solde dû et historique des paiements, et téléchargement des PDF officiels (*Proforma, Facture, Reçu, Bon de livraison*).

### 3.12 Comptabilité OHADA Avancée, Préfinancement & Opérations Externes

- **Suite OHADA avancée :**
  - **Lettrage des comptes de tiers (`411` Clients / `401` Fournisseurs) :** Rapprochement automatique et manuel entre factures, avoirs et règlements pour connaître le solde non lettré exact.
  - **Rapprochement bancaire mensuel :** Pointage des écritures du journal `JB` face au relevé bancaire réel, avec constatation directe des frais bancaires / agios.
  - **Clôture annuelle & À-nouveaux :** Affectation du résultat et génération automatique des écritures **À-nouveaux** sur l'exercice `N+1`.
- **Préfinancement (Fonds de roulement de commande) :** Alimenté par virement réel depuis Coffre/Banque, il finance les postes dédiés d'une commande ou d'un lot (*Matières, Main-d'œuvre, Énergie, Transport*) puis est comptabilisé et soldé/reconstitué lors de l'encaissement client.
- **Opérations Externes (Apports PDG, Prêts, Investissements) :** Chaque opération validée via **Maker-Checker** précise si elle mouvemente un compte réel (`Banque`/`Coffre`) ou reste hors-caisse, et génère automatiquement son écriture OHADA (compte courant associé `455`, emprunts `16`, immobilisations/capital).

### 3.13 Moteur RACI Transverse (Projets, Commandes Complexes & Gouvernance)

Le RACI est un **moteur actif** qui pilote les actions, validations, avis et notifications à deux échelles :
1. **Niveau Gouvernance :** Modèles RACI réutilisables par type de projet ou processus (ex. *Campagne Grand Format*, *Commande B2B à crédit*, *Clôture Paie & Impôts*), avec matrice globale d'entreprise consultable.
2. **Niveau Opérationnel :** Applicable à tout **Projet interne**, **Plan d'action issu d'une réunion (Secrétariat)** ou **Commande complexe multi-services**.

- **Règles strictes des 4 rôles sur chaque étape/livrable :**
  - **`R` (Réalisateur / Responsible) :** Au moins 1 `R` obligatoire. Exécute l'étape et la voit dans son cockpit *« À faire (`R`) »* ; soumet le livrable pour validation.
  - **`A` (Approbateur / Accountable) :** **Strictement 1 seul `A` par étape** (jamais 0, jamais 2). Seul habilité à valider ou renvoyer pour reprise (`À reprendre` avec motif obligatoire). Sur les étapes financières soumises au contrôle interne, `R` et `A` ne peuvent pas être la même personne.
  - **`C` (Consulté / Consulted) :** Sollicité **avant** la validation finale (`A`) pour émettre un avis structuré (*Favorable / Avec réserve / Défavorable* + note), paramétrable en avis bloquant ou consultatif.
  - **`I` (Informé / Informed) :** Reçoit automatiquement les notifications de création, blocage et validation finale dans son fil *« Suivi (`I`) »* sans polluer sa liste d'actions.
- **Imprévus gérés nativement :**
  - **Congé / Absence d'un `A` ou `R` (lien RH) :** Détection automatique des projets impactés et proposition de **délégation temporaire tracée** vers un suppléant pour ne jamais bloquer l'exécution.
  - **Départ / Mutation :** Réaffectation assistée en masse des lignes `R/A/C/I` vers le remplaçant.
  - **Escalade de retard :** Alerte automatique à la hiérarchie si une étape dépasse son échéance chez un `R`, un `C` ou un `A`.

---

## Chapitre 4 — Architecture des Flux d'Argent & Traçabilité Totale

Chaque franc qui entre, circule ou sort possède une **fiche d'identité financière complète** visible à tout moment :

### 4.1 Les 5 questions auxquelles répond chaque transaction

| Dimension | Informations obligatoires affichées |
|---|---|
| **1. Origine** | D'où vient l'argent ? (Client + N° Commande/Facture, Caisse enregistreuse X, Coffre filiale Y, Apport PDG, Prêt bancaire...) |
| **2. Raison métier** | Pourquoi ce mouvement ? (Nature typée : *Acompte 50 %*, *Solde facture*, *Remboursement avoir*, *Remise de caisse*, *Règlement facture fournisseur*, *Salaire*, *CNPS*, *IRPP*, *TVA*, *Loyer*, *Frais bancaires*...) |
| **3. Validation & Changements** | Qui a créé (`Initiateur`), qui a approuvé (`Valideur` — différent pour Maker-Checker), dates/heures, montant brut, frais éventuels, écart constaté, **Solde avant → Solde après**, et lien éventuel vers une opération d'extourne. |
| **4. Destination** | Où va l'argent ? (Compte exact destinataire + Tiers bénéficiaire avec son NIU / identité). |
| **5. Preuve & Comptabilité** | Pièce justificative jointe (scan reçu, décharge signée, avis de virement, facture fournisseur) + lien direct cliquable vers l'écriture comptable SYSCOHADA générée (`JV/JA/JB/JC/JOD-YYYY-XXXXXX`). |

### 4.2 Séparation stricte des 4 temps de l'argent

1. **Fait générateur / Engagement :** La dette ou créance naît (*Facture émise*, *Facture fournisseur reçue*, *Fiche de paie générée*, *Dépense constatée*).
2. **Ordonnancement / Approbation :** L'opération est autorisée (*Expression de besoin approuvée*, *Décaissement soumis au Maker-Checker*).
3. **Mouvement de trésorerie :** L'argent bouge physiquement ou bancairement (*En attente* → *Validé* / *Rejeté* / *Contre-passé*). **Règle d'or :** aucune transaction validée n'est jamais effacée ; toute erreur après validation fait l'objet d'une **contre-passation motivée**.
4. **Rapprochement & Pièce :** Le justificatif est attaché et la comptabilité est automatiquement alignée.

---

## Chapitre 5 — Référentiel des Documents Officiels (Standard Cameroun & OHADA)

### 5.1 Règles générales de conformité (DGI / Loi de Finances / OHADA)

- **Identité légale obligatoire sur tout document externe :** Raison sociale, forme juridique, Capital social, Adresse du siège et de la filiale émettrice, **NIU** (Numéro d'Identifiant Unique), **RCCM**, Régime d'imposition & Centre des Impôts de rattachement, Coordonnées bancaires, Devise **FCFA (XAF)**.
- **Numérotation chronologique continue sans rupture** par type de document, filiale et exercice fiscal.
- **Adaptation au destinataire et à la raison :** Chaque document porte un titre exact, un **filigrane d'état** (*PROFORMA*, *ORIGINAL*, *DUPLICATA*, *PAYÉE*, *AVOIR*, *ANNULÉE*), le montant en chiffres et **en toutes lettres**, et les blocs de signatures/cachets correspondants.

### 5.2 Catalogue complet des documents par domaine

| Domaine | Document | Destinataire | Mentions & Spécificités Cameroun / OHADA |
|---|---|---|---|
| **Commerce (Clients)** | **Facture Proforma** | Prospect / Client | Devis détaillé, durée de validité, conditions d'acompte (ex. 50 %), mention *« Ne vaut pas facture définitive »*. |
| **Commerce (Clients)** | **Bon de Commande Client** | Client & Atelier | Récapitulatif articles, spécifications techniques validées, référence BAT, échéancier acompte/solde. |
| **Commerce (Clients)** | **Reçu de Caisse / Acompte** | Client (comptoir) | N° de reçu, mode d'encaissement, montant versé, **reste à payer sur la commande**, signature caissier. |
| **Commerce (Clients)** | **Facture Définitive** | Client (B2B/B2C/Public) | NIU client (si B2B), détail HT, **TVA 19,25 %** (ou mention légale d'exonération), ligne dédiée aux **retenues à la source (AIR / TVA retenue)** si client habilité, net à payer, figée à vie. |
| **Commerce (Clients)** | **Facture d'Avoir** | Client | Référence explicite de la facture d'origine annulée ou corrigée, détail des montants crédités (HT/TVA/TTC), impact créance/remboursement. |
| **Commerce (Clients)** | **Bon de Livraison** | Client (réceptionnaire) | Quantités commandées vs livrées à date vs reliquat, nombre de colis, date réelle, **cadre de décharge client (nom, CNI/qualité, signature, date)**. |
| **Achats & Stocks** | **Demande d'Expression de Besoin** | Interne (Direction/DAF) | Objet, justification, budget estimé, statut d'approbation et trace du règlement. |
| **Achats & Stocks** | **Bon de Commande Fournisseur** | Fournisseur | NIU fournisseur, articles en unité d'achat, prix convenus, délai et lieu de livraison, conditions de règlement. |
| **Achats & Stocks** | **Bon d'Entrée / Réception** | Interne (Magasin/Compta) | Quantités commandées vs reçues conformes vs refusées, conversion en unité de base, signatures magasinier & livreur. |
| **Achats & Stocks** | **Bon de Retour / Transfert** | Fournisseur / Filiale dest. | Motif de retour (non-conformité/casse) ou bordereau de transfert inter-filiales avec décharge à l'arrivée. |
| **Trésorerie** | **Bordereau de Remise de Caisse** | Interne (Caissier → DAF) | Détail billetage/reçus rattachés, montant déclaré, montant compté, **ligne d'écart constaté & motif**, double signature Caissier + DAF. |
| **Trésorerie** | **Pièce de Décaissement / Bon de Caisse** | Interne + Bénéficiaire | Origine (compte), raison, montant, justificatif rattaché, **signature du bénéficiaire pour décharge** + signature ordonnateur. |
| **Trésorerie** | **Relevé de Compte & Balance Âgée** | Direction / Audit | Mouvements chronologiques (solde avant/après) et créances/dettes ventilées par ancienneté (`0-30j`, `31-60j`, `61-90j`, `+90j`). |
| **RH & Paie** | **Bulletin de Paie & Ordre de Virement Groupé** | Employé / Banque | Bulletin conforme Code du Travail Cameroun (N° CNPS employeur & salarié, NIU, catégorie/échelon, salaire de base, heures sup, primes/indemnités ventilées, CNPS 4,2 % plafonnée 750 000 FCFA, IRPP, CAC 10 %, CFC 1 %, retenues avances/prêts, net à payer, charges patronales, cumuls annuels) + **Ordre de virement bancaire groupé** des salaires validés. |
| **Fiscal & Social** | **Dossier Administratif DGI / CNPS** | DGI / CNPS / Audit | Synthèses mensuelles prêtes pour télédéclaration (**DIPE / CNPS**, **IRPP/CAC**, **CFC/FNE**, **TVA nette Collectée − Déductible**), avec **N° de déclaration, Avis d'imposition/AMR, Quittance DGI / Bordereau CNPS archivé** et ligne éventuelle de majoration de retard. |
| **Comptabilité & Secrétariat** | **États Légaux OHADA & PV** | Administration / Commissaire aux comptes | Livre-Journal continu, Grand Livre, **Balance Générale à 6 colonnes**, Bilan, Compte de Résultat & Tableau des Flux SYSCOHADA, Tableau d'amortissements, Procès-Verbaux de réunions signés. |

---

## Chapitre 6 — Design System ERP « Precision Workspace » & Ergonomie des Formulaires

### 6.1 Direction visuelle « Precision Workspace »

- **Clarté et lisibilité opérationnelle :** Fond clair neutre à fort contraste (`slate-50` / blanc pur pour les cartes et tableaux), typographie sobre et **chiffres en largeur fixe (tabulaires)** alignés à droite pour tous les montants en FCFA et quantités.
- **Couleur à valeur sémantique stricte :** Finies les couleurs purement décoratives. Chaque teinte porte un sens immédiat :
  - *Vert* = Validé / Payé / Conforme / Opérationnel
  - *Ambre / Orange* = En attente / Partiel / À surveiller / Seuil proche
  - *Rouge* = Retard / Impayé / Bloqué / Rejeté / Écart / Rupture
  - *Bleu* = En cours / En production / En transit
  - *Gris neutre* = Brouillon / Archivé / Inactif
- **Identité CaapMedia maîtrisée :** L'accent signature (vert lime / anthracite) est réservé avec retenue à la marque, à l'élément actif de navigation et à l'action primaire, jamais au détriment du contraste.

### 6.2 Modèles d'interaction unifiés

1. **Navigation & Recherche Globale (`Ctrl+K`) :** Barre de recherche universelle permettant de retrouver en 2 secondes une commande, une facture, un client, un employé, une écriture ou un produit depuis n'importe quel écran.
2. **Liste + Tiroir Latéral d'Inspection (Drawer) :** Cliquer sur une ligne dans un tableau ouvre un tiroir latéral à droite affichant le détail complet, l'historique chronologique, les pièces jointes et les actions contextuelles — **sans faire perdre le contexte de la liste filtrée**.
3. **Panneaux d'actions claires :** Chaque fiche distingue visuellement l'**Action Principale** (le chemin normal, ex. *Valider pour production*) des **Actions d'Exception** regroupées dans un menu secondaire clair (*Mettre en pause*, *Renvoyer pour correction*, *Émettre un avoir*).

### 6.3 Philosophie des Formulaires (Saisie Progressive)

- **Création rapide en 15 secondes :** Seuls les champs indispensables à la création immédiate sont affichés d'emblée (ex. pour un Prospect : Nom, Entreprise, Téléphone/E-mail, Source, Commercial).
- **Sections avancées repliables :** Les 30+ champs de qualification détaillée d'un Prospect, ou les options avancées d'une fiche Employé/Article, vivent dans des accordéons ou onglets secondaires (« Qualification approfondie », « Paramètres fiscaux »).
- **Pré-remplissage & Sauvegarde automatique :** Calcul automatique des totaux, TVA, marges et échéances en temps réel ; sauvegarde automatique des brouillons sur les formulaires longs (Proforma, Commande, Écriture comptable) pour éviter toute perte de saisie.

---

## Chapitre 7 — Cockpits Décisionnels, KPIs & Graphiques par Rôle

Chaque rôle démarre sur un **Cockpit orienté action** composé de 3 zones : *(1) 4 à 5 KPIs fiables avec comparaison période précédente, (2) File « À traiter maintenant » cliquable — filtrable selon le rôle RACI actif (`À exécuter R`, `À approuver A`, `Avis demandés C`, `Suivis I`), (3) 2 à 3 graphiques décisionnels utiles.*

> **Indicateurs RACI transverses (Direction & Chefs de projet) :** Charge de responsabilités par collaborateur (détection de surcharge en `A` ou `R`), délai moyen d'approbation par `A`, taux de respect des échéances par `R`, et étapes bloquées en attente d'avis `C`.

| Rôle | KPIs clés (fiables & chiffrés) | File « À traiter maintenant » | Graphiques décisionnels |
|---|---|---|---|
| **Super Admin / Admin** | • Chiffre d'affaires facturé & encaissé<br>• Trésorerie nette disponible (Banques + Coffres + Caisses)<br>• Marge brute opérationnelle réelle (%)<br>• Valeur réelle du stock (CMP)<br>• Créances échues (> échéance) | • Expressions de besoin en attente<br>• Opérations bancaires à double-valider<br>• Remises de caisse avec écart<br>• Demandes d'accès compta JIT<br>• Commandes en retard de livraison | • Cash-flow réel (Encaissements vs Décaissements sur 12 mois)<br>• Évolution CA vs Marge réelle<br>• Balance âgée des créances clients & dettes fournisseurs |
| **Directeur Financier** | • Solde Caisse Dépense & Coffre filiale<br>• Créances clients à recouvrer<br>• Dettes fournisseurs échues<br>• TVA nette estimée du mois<br>• Charges sociales/fiscales à payer | • Remises de caisse à réceptionner au coffre<br>• Expressions de besoin approuvées à payer<br>• Chèques/virements en attente ou impayés<br>• Échéances CNPS/IRPP proches | • Flux de trésorerie par nature (Origine vs Destination)<br>• Répartition des charges par catégorie<br>• Balance âgée clients vs fournisseurs |
| **Commercial** | • Pipeline actif pondéré<br>• Taux de conversion Proforma → Commande<br>• CA personnel du mois vs objectif<br>• Montant de ses commandes impayées | • Proformas expirant sous 5 jours<br>• Commandes renvoyées par l'atelier « À corriger »<br>• Tâches CRM du jour / en retard<br>• Commandes prêtes à livrer (prévenir client) | • Entonnoir commercial (Prospects → Opportunités → Proformas → Commandes)<br>• Top clients & services vendus |
| **Caissier** | • Solde théorique de sa caisse<br>• Total encaissé du jour (Espèces vs Autres)<br>• Nombre de reçus émis<br>• Montant en attente de remise au coffre | • Commandes prêtes à livrer avec solde dû<br>• Encaissements du jour à inclure dans la remise de fin de journée | • Encaissements par mode de paiement<br>• Activité horaire de la caisse |
| **Directeur de Production** | • Commandes en file de validation<br>• Commandes en cours en atelier<br>• Commandes en retard / en pause<br>• Taux de respect des délais | • Nouvelles commandes à valider/renvoyer<br>• Commandes bloquées (attente BAT / panne / rupture)<br>• Équipements en retard de maintenance | • Charge par étape d'atelier (Prépresse / Impression / Finition)<br>• Utilisation & coûts machines vs heures estimées |
| **Responsable Achats** | • Valeur totale du stock (CMP)<br>• Articles sous seuil critique<br>• Commandes fournisseurs en cours<br>• Montant des achats du mois | • Besoins approuvés à transformer en BC<br>• Livraisons fournisseurs attendues/en retard<br>• Retours/non-conformités en attente d'avoir | • Évolution des achats par mois *(données réelles)*<br>• Répartition des dépenses par fournisseur & catégorie matière |
| **Responsable RH** | • Effectif actif vs en congé / pré-embauche<br>• Taux de présence / retard du jour<br>• Masse salariale estimée du mois<br>• Avances/prêts en cours | • Demandes de congés à valider<br>• Régularisations de pointage / absences à traiter<br>• Fiches de paie en attente de signature | • Assiduité & retards sur 30 jours<br>• Répartition masse salariale (Net / Retenues / Charges patronales) |

---

## Chapitre 8 — Feuille de Route : Découpage en Lots de Refonte (Serveur & Client)

Pour sécuriser les acquis critiques (comptabilité OHADA, paie camerounaise, sécurité multi-filiales) tout en reconstruisant entièrement l'expérience et les workflows, la refonte s'exécute en **7 lots ordonnés**.

### Lot 1 — Socle, Gouvernance, Audit & Design System
- Mise en place du nouveau **Design System « Precision Workspace »** (composants unifiés, tableaux, tiroirs latéraux, recherche globale `Ctrl+K`, saisie progressive).
- Refonte de la navigation et du découpage des espaces par rôle ; normalisation terminologique Cameroun (`NIU`, `FCFA/XAF`, centres des impôts).
- Extension Maker-Checker au DAF ; gestion des **mutations entre filiales** et **accès multi-filiales autorisés** ; remplacement des suppressions destructives par archivage/désactivation ; **écran d'Audit Sécurité & Piste d'audit globale** ; purge des anciens modèles morts.

### Lot 2 — Socle Financier, Charges, Décaissements, Préfinancement & Opérations Externes
- Traçabilité complète des transactions (Origine, Raison, Changements, Destination, Pièce justificative obligatoire, Solde avant/après).
- Circuit en 3 temps pour les charges (`Constatation avec pièce → Approbation → Décaissement`), encadrement **Imprest + plafond unitaire** de la Caisse Dépense, seuils Maker-Checker sur Coffre/Banque et abonnements intelligents **Fixes vs Variables** (ENEO/eau).
- Nouveau cycle des **encaissements différés** (frais bancaires/opérateurs, gestion complète des **chèques/virements impayés**).
- Remises de caisse avec **constatation réelle d'écart** et imputation comptable automatique.
- Ouverture du règlement des dettes fournisseurs par **Banque ou Coffre** + gestion des **avoirs fournisseurs**.
- Branchement réel du **Préfinancement** (fonds de roulement de commande) et des **Opérations Externes** (Apports PDG, Prêts) sur les comptes de trésorerie et la comptabilité.
- Suppression du Bilan/P&L approximatif parallèle de Finance et remplacement par des vues de Cash-Flow et Rentabilité réelle.

### Lot 3 — Tunnel Commercial, Facturation DGI, Notifications & Espace Client Réel
- Unification **CRM & Devis** (Proformas versionnées V1/V2 créables depuis Prospect, Opportunité ou Client ; conversion bidirectionnelle ; grilles tarifaires indicatives par paliers).
- **Commandes & Facturation** avec règle d'acompte + dérogation tracée, blocage/dérogation de **marge sous seuil**, contrôle **BAT**, **Factures Définitives figées** (TVA 19,25 %, exonérations, retenues à la source) et **Factures d'Avoir**.
- **Caisse & Encaissements** fluidifiée (encaissement comptoir et créances en 1 flux).
- **Centre de Notifications multi-canaux actif** (temps réel + vrais e-mails + WhatsApp optionnel sur jalons + alertes proactives stock/échéances).
- Refonte complète de la **Vitrine & Espace Client** (demande de devis intégrée dans l'ERP, suivi production en direct, acceptation proforma & BAT en ligne, téléchargement des PDF officiels, solde dû, vrai changement de mot de passe).

### Lot 4 — Production, Atelier, SAV, Parc Machines, Secrétariat & Moteur RACI
- Nouveaux statuts d'atelier complets : renvoi « À corriger » au commercial, rétrogradation motivée entre étapes, mises en pause/blocage typées (BAT, panne, rupture), workflows surchargeables par filiale, et **circuit SAV / réimpression** post-livraison.
- Intégration unifiée **Parc Machines & Maintenance** (panne mettant l'atelier en pause + réaffectation secours + coût réel relié aux Dépenses).
- **Secrétariat complet :** convocations + émargement → PV avec décisions convertibles en tâches → coffre documentaire confidentiel et versionné.
- **Moteur RACI complet :** modèles configurables, matrice interactive avec règle du `A` unique et contrôle Maker-Checker (`R ≠ A`), intégration native sur Projets, Réunions et Commandes complexes, filtrage Cockpit `R/A/C/I`, délégation sur congés RH, escalade de retard et export PDF/CSV.

### Lot 5 — Achats, Stocks Valorisés & Expressions de Besoin Décloisonnées
- Connexion directe **Expression de besoin approuvée → Paiement Caisse Dépense OU Conversion Bon de commande fournisseur**.
- Valorisation continue des stocks au **CMP / dernier prix d'achat** (alimentant Bilan et marges réelles) + alerte proactive sous seuil.
- Réceptions avec gestion des **non-conformités / retours fournisseurs**, action **Clôturer le reliquat**, et **Transferts inter-filiales avec statut *En transit***.

### Lot 6 — Comptabilité SYSCOHADA Avancée & Dossier Administratif Fiscal/Social (DGI / CNPS)
- Suite OHADA avancée : **Lettrage des tiers (`411`/`401`)**, **Rapprochement bancaire mensuel** (relevé vs `JB` + agios), **Clôture annuelle avec À-nouveaux `N+1`**.
- Suivi complet de la **TVA déductible** sur achats et dépenses → calcul net **TVA à reverser / Crédit de TVA**.
- Workflow administratif complet des taxes du périmètre (**CNPS, IRPP+CAC, CFC, FNE, TVA nette**) : `Calculé → Télédéclaré (DIPE/DGI + Avis) → Approuvé → Payé (Quittance/Bordereau archivé)`, alertes d'échéances (7 et 15 du mois) et suivi des pénalités de retard éventuelles.
- Balance Générale à 6 colonnes, Tableau des Flux de Trésorerie SYSCOHADA et normalisation de **tous les gabarits PDF officiels** du Référentiel Cameroun (Chapitre 5).

### Lot 7 — RH, Pointage Sécurisé, Paie en 4 Étapes & Cockpits Décisionnels Finaux
- Activation complète du **pointage sécurisé** (QR + option géo/rayon configurable et/ou PIN employé), **régularisations d'oublis/missions**, **circuit de demande de congés**, et **avances sur salaire / prêts employés** déduits automatiquement sur les bulletins.
- Refonte du cycle de **Paie en 4 étapes** (*Variables pré-remplies modifiables → Validation budgétaire DAF → Paiement réel par lots [Virement bancaire groupé / Chèque / Espèces] → Émargement bulletin*).
- Déploiement et branchement final des **Cockpits KPIs et Graphiques décisionnels** par rôle avec données consolidées réelles.
