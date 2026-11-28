# DESIGN.md — CaapMedia ERP v3 (« Precision Workspace »)

> Spécification officielle du Design System **CaapMedia v3**, structurée au format `DESIGN.md` (`shadcn.io/design`).
> **Socle architectural :** Clarté financière **Stripe** + Rapidité opérationnelle **Linear** + Saisie structurée **Notion**, calibré sur l'identité visuelle **CaapMedia** (`#c6e911` & `#1A1A1A`).

---

## 1. Philosophie & Dualité Visuelle

CaapMedia réunit deux expériences distinctes qui partagent la même marque mais répondent à des usages opposés :

1. **ERP Interne (« Precision Workspace ») — Mode Clair haute lisibilité :**
   - Utilisé 8 heures par jour pour lire des chiffres financiers (FCFA), des écritures OHADA, des fiches de paie camerounaises et piloter l'atelier.
   - **Principe :** Zéro bruit décoratif. Surfaces claires nettes, bordures fines (`1px`), typographie chiffrée alignée (`tabular-nums`), couleurs strictement sémantiques et tiroirs latéraux d'inspection.
2. **Vitrine Publique & Espace Client — Contraste Expressif :**
   - Vitrine commerciale orientée conversion (catalogue, réalisations, demande de devis).
   - Peut conserver des sections sombres signature (`#1A1A1A` / `#0F0F0F`) avec l'accent lime `#c6e911` et davantage de mouvement narratif.

---

## 2. Palette de Couleurs & Design Tokens (`shadcn/ui` + Tailwind v4)

### 2.1 Règle d'Or sur la couleur signature `#c6e911`

Le vert lime `#c6e911` est très lumineux : **il est interdit de l'utiliser en texte sur fond blanc, ou d'écrire du texte blanc sur un fond `#c6e911`.**

- **Fond `#c6e911` (Boutons CTA, item actif, badge focus) :** Toujours couplé à une encre très foncée **`#141A06`** ou **`#1A1A1A`** (contraste > 11:1).
- **Texte ou lien teinté marque sur fond clair :** Utiliser **`#4D6100`** (ou `#3F5000` au survol) pour garantir un contraste ≥ 4.5:1.
- **Jamais d'usage sémantique :** `#c6e911` exprime la **marque et l'action active**, jamais un statut « Succès / Payé » (réservé au vert émeraude).

### 2.2 Tokens sémantiques de base (ERP Light Mode)

```css
:root {
  /* Surfaces & Fonds */
  --background: #F8FAFC;          /* Toile de fond générale (Slate 50) */
  --foreground: #0F172A;          /* Texte principal haute lisibilité */
  --card: #FFFFFF;                /* Cartes, panneaux, tableaux */
  --card-foreground: #0F172A;
  --popover: #FFFFFF;
  --popover-foreground: #0F172A;
  --muted: #F1F5F9;               /* Zones secondaires, en-têtes de tableaux */
  --muted-foreground: #64748B;    /* Libellés secondaires, métadonnées */

  /* Bordures & Séparateurs (Hairlines façon Stripe/Linear) */
  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --input: #CBD5E1;

  /* Marque CaapMedia */
  --brand: #C6E911;               /* Lime signature CaapMedia */
  --brand-hover: #B4D60E;
  --brand-foreground: #141A06;    /* Encre foncée obligatoire sur lime */
  --brand-text: #4D6100;          /* Lime foncé accessible sur fond blanc */
  --brand-soft: #F4FCE3;          /* Teinte douce pour surlignage léger */

  /* Primaire Structurel (Encre CaapMedia — boutons validation neutres, titres) */
  --primary: #1A1A1A;
  --primary-hover: #2E2E2E;
  --primary-foreground: #FFFFFF;

  /* Secondaire & Focus */
  --secondary: #F1F5F9;
  --secondary-foreground: #1E293B;
  --accent: #F1F5F9;
  --accent-foreground: #0F172A;
  --ring: #1A1A1A;                /* Anneau focus clavier net */
  --ring-brand: #84CC16;

  /* Navigation latérale (Sidebar Signature Anthracite) */
  --sidebar-bg: #141619;
  --sidebar-surface: #1E2126;
  --sidebar-border: rgba(255, 255, 255, 0.08);
  --sidebar-foreground: #CBD5E1;
  --sidebar-muted: #94A3B8;

  /* Statuts Sémantiques Stricts */
  --success: #059669;             /* Payé, Validé, Opérationnel, Conforme */
  --success-soft: #ECFDF5;
  --success-border: #A7F3D0;

  --warning: #D97706;             /* En attente, Partiel, Seuil proche, Pause */
  --warning-soft: #FFFBEB;
  --warning-border: #FDE68A;

  --destructive: #DC2626;         /* Impayé, Rejeté, Écart, Rupture, Retard */
  --destructive-foreground: #FFFFFF;
  --destructive-soft: #FEF2F2;
  --destructive-border: #FECACA;

  --info: #2563EB;                /* En production, En transit, Brouillon actif */
  --info-soft: #EFF6FF;
  --info-border: #BFDBFE;

  /* Rayons */
  --radius-sm: 6px;               /* Inputs, boutons, badges compacts */
  --radius-md: 10px;              /* Cartes, panneaux, tableaux */
  --radius-lg: 12px;              /* Modales, tiroirs */
}
```

### 2.3 Palette Graphiques & Data Visualization (6 couleurs harmonisées)

Conçue pour les graphiques financiers et opérationnels (lisible et contrastée sur fond blanc) :
1. **Flux Principal / CA :** `#1A1A1A` (Anthracite) ou `#4D6100` (Olive CaapMedia)
2. **Encaissements / Positif :** `#059669` (Émeraude)
3. **Décaissements / Charges :** `#DC2626` (Corail/Rouge contrôlé) ou `#E11D48`
4. **Pipeline / En cours :** `#2563EB` (Bleu Stripe)
5. **En attente / Prévisionnel :** `#D97706` (Ambre)
6. **Catégorie secondaire :** `#7C3AED` (Violet sobre)

---

## 3. Typographie & Règles Chiffrées

### 3.1 Familles de polices

- **Interface ERP, corps & tableaux :** `Inter` (ou `Plus Jakarta Sans`), repli système `system-ui, sans-serif`. Lisibilité optimale à 12–14 px dans les grilles denses.
- **Titres marque & Vitrine publique :** `Montserrat` (conservée pour la continuité identitaire des titres de la vitrine et des en-têtes marketing).
- **Codes & Références (Monospace) :** `JetBrains Mono` (pour numéros de pièces `FAC-`, `PRO-`, `RC-`, comptes SYSCOHADA `411100`, NIU, matricules employés).

### 3.2 Échelle typographique

| Rôle | Taille / Graisse | Interlignage / Approche | Usage |
|---|---|---|---|
| **Page Title** | `22px` / `600` | `1.25` / `-0.02em` | Titre principal de l'écran |
| **KPI Hero Value** | `24px–28px` / `700` | `1.15` / `-0.02em` + `tabular-nums` | Montants clés des cartes KPI |
| **Section Title** | `15px–16px` / `600` | `1.35` / `-0.01em` | Titres de cartes, tiroirs, modales |
| **Body / Table Cell** | `13px–14px` / `400–500` | `1.45` | Données de tableaux, libellés formulaires |
| **Table Header / Label** | `11px–12px` / `600` | `1.3` / `+0.03em` (uppercase discret) | Colonnes, sous-titres de groupes |
| **Micro / Badge / Shortcut** | `11px` / `500–600` | `1.2` | Badges de statut, touches `Ctrl+K` |

### 3.3 Règle stricte sur les chiffres (Finance, Paie, Stocks)

- **Tout nombre, montant `FCFA`, quantité, pourcentage ou date en colonne DOIT utiliser `font-variant-numeric: tabular-nums`.**
- Les colonnes numériques dans les tableaux et états comptables sont **systématiquement alignées à droite**.
- Formatage homogène : séparateur de milliers par espace insécable (`1 250 000 FCFA`), jamais de mélange `XOF`/`FCFA`.

---

## 4. Mise en Page, Densité & Modèles d'Écran

### 4.1 Rythme d'espacement (Grille 4 px)

- Padding externe des pages : `24px` (desktop), `16px` (mobile).
- Espacement entre sections / cartes : `16px` à `20px`.
- Padding interne des cartes : `16px` à `20px` (compact `12px–16px` pour les cartes KPI).
- Hauteur standard des contrôles (boutons, inputs, selects) : `36px` (ERP desktop), `44px` minimum sur zones tactiles mobiles / pointage / caisse tactile.

### 4.2 Le modèle « Master-Detail » (Liste + Tiroir Latéral)

Pour éviter de casser le fil de travail par des rechargements de pages ou des modales empilées :
1. **Barre d'en-tête fixe :** Fil d'Ariane + Sélecteur Filiale / Rôle actif + **Palette de commande globale (`Ctrl+K`)** + Notifications.
2. **Zone de travail principale :** KPIs synthétiques (max 4–5) → Barre de filtres/vues enregistrées (onglets nets) → Tableau dense avec en-tête figé (`sticky`).
3. **Tiroir latéral droit (Inspection Drawer, `480px` à `640px`) :** Cliquer sur une ligne ouvre le détail complet sans perdre la liste ni les filtres (détail financier Origine/Raison/Destination, historique chronologique, pièces jointes, bouton d'action principal + menu des actions d'exception).
4. **Modales centrées :** Réservées uniquement aux confirmations critiques (annulation motivée, suppression, double validation Maker-Checker) et aux assistants ciblés.

### 4.3 Saisie Progressive dans les Formulaires

- **Noyau essentiel en premier :** Toujours créer l'objet en 4 à 6 champs maximum (ex. Prospect : Nom, Entreprise, Téléphone/E-mail, Source, Commercial).
- **Sections avancées repliables :** Accordéons fermés par défaut (« Qualification détaillée /35 champs », « Paramètres fiscaux avancés », « Options comptables »).
- **Aide en ligne contextuelle :** Calculs en direct (marge %, TVA 19,25 %, net à payer, conversion unité d'achat → unité de base) et sauvegarde automatique des brouillons sur les formulaires longs.

---

## 5. Recettes des Composants Clés (`shadcn/ui`)

### 5.1 Hiérarchie des Boutons

| Variante | Apparence | Usage strict |
|---|---|---|
| **Brand CTA** | Fond `#C6E911`, texte `#141A06` gras (`600`), hover `#B4D60E` | **1 seule action principale par écran** (*Nouvelle commande*, *Encaisser*, *Créer une proforma*). |
| **Primary Structural** | Fond `#1A1A1A`, texte `#FFFFFF` | Validation métier forte (*Valider l'écriture*, *Approuver le décaissement*). |
| **Secondary / Outline** | Fond `#FFFFFF`, bordure `#CBD5E1`, texte `#0F172A` | Actions courantes (*Exporter PDF*, *Filtrer*, *Imprimer*). |
| **Ghost / Menu** | Transparent, hover `#F1F5F9` | Actions secondaires dans les lignes de tableaux ou menus d'exceptions. |
| **Destructive** | Fond `#DC2626` (ou soft `#FEF2F2` texte `#DC2626` pour actions secondaires) | Annulation, rejet, contre-passation, suppression irréversible. |

### 5.2 Badges de Statut

- Forme pilule (`rounded-full`) ou tag compact (`rounded-md`), texte `11.5px` semi-gras, **point indicateur 6px optionnel**, fond teinté soft + bordure subtile (`--success-soft` + `--success-border`), jamais de fond saturé criard sur les tableaux denses.

### 5.2 bis Badges & Matrice RACI

Pour la grille interactive **Projets & Matrices RACI** et les filtres Cockpit `R / A / C / I` :
- **`R` (Réalisateur) :** Badge bleu (`--info-soft`, texte `#1D4ED8`, bordure `--info-border`) — action à exécuter.
- **`A` (Approbateur unique) :** Badge anthracite ou lime CaapMedia (`#1A1A1A` texte `#C6E911`, ou `#C6E911` texte `#141A06`) — autorité unique de validation immédiatement repérable dans la matrice.
- **`C` (Consulté) :** Badge ambre (`--warning-soft`, texte `#B45309`, bordure `--warning-border`) — expertise attendue.
- **`I` (Informé) :** Badge neutre (`--muted`, texte `--muted-foreground`, bordure `--border`) — suivi passif.

### 5.3 Cartes KPI

- Structure fixe : Libellé court en haut (`12px`, `--muted-foreground`) + Icône discrète → Valeur principale en `24px` `tabular-nums` → Ligne de contexte en bas (Badge variation `+/- %` vs période précédente ou sous-texte utile, ex. *« dont 3 en retard »*).
- **Cliquables :** Chaque KPI d'alerte ou de file d'attente filtre directement la vue associée au clic.

### 5.4 États vides, Chargement & Retours

- **Chargement :** Squelettes (`Skeleton`) respectant la géométrie exacte du tableau ou des cartes (zéro saut de mise en page).
- **États vides :** Icône sobre + explication claire + 1 bouton d'action utile (*« Aucune remise en attente »* ou *« Créer votre première proforma »*).
- **Notifications toast (`Sonner`) :** Positionnées en bas à droite, empilables, avec bouton d'action rapide quand pertinent (*« Proforma créée — Copier le lien »*).

---

## 6. Système d'Animations & Micro-Interactions

> **Règle d'ingénierie UI (Emil Kowalski) :** Un ERP est un outil de travail quotidien. L'animation doit renforcer la **vitesse perçue** et la **compréhension spatiale**, jamais ralentir un opérateur.

### 6.1 Matrice par Fréquence d'Usage

| Fréquence | Décision | Composants concernés |
|---|---|---|
| **100+ fois / jour** (Clavier & haute fréquence) | **0 ms — Aucune animation** | Ouverture/fermeture Palette `Ctrl+K`, navigation au clavier dans les listes, saisie rapide en Caisse/tableaux, tooltips adjacents déjà amorcés. |
| **Dizaines de fois / jour** | **Ultra-rapide (100–160 ms)** | Press sur bouton (`transform: scale(0.97)` sur `:active`), switch/checkbox, changement d'onglet. |
| **Occasionnel** | **Standard maîtrisé (150–250 ms)** | Menus déroulants, popovers, sélecteurs, modales, tiroirs latéraux, toasts. |
| **Rare / Vitrine publique** | **Budget expressif** | Bannière vitrine, cartes catalogue, confirmation d'un jalon rare (ex. clôture d'exercice, signature bulletin de paie). |

### 6.2 Règles Techniques & Courbes Obligatoires

```css
:root {
  /* Courbes d'accélération officielles (jamais de ease-in sur les entrées UI) */
  --ease-out-ui: cubic-bezier(0.23, 1, 0.32, 1);     /* Entrées/sorties réactives */
  --ease-in-out-ui: cubic-bezier(0.77, 0, 0.175, 1); /* Déplacements à l'écran */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* Tiroirs latéraux type iOS */
}
```

1. **Propriétés GPU uniquement :** Animer exclusivement `transform`, `opacity` (et `clip-path` si nécessaire). **Interdiction** d'animer `width`, `height`, `top`, `left`, `margin`, `padding` ou d'utiliser `transition: all`.
2. **Jamais de `scale(0)` :** Les popovers et modales démarrent à `scale(0.95)` + `opacity: 0` et arrivent à `scale(1)` + `opacity: 1`.
3. **Origine contextuelle :** Les popovers/menus s'ouvrent depuis leur déclencheur (`transform-origin: var(--transform-origin)`) ; les modales centrées gardent `transform-origin: center`.
4. **Sortie symétrique :** Un tiroir qui entre par la droite sort par la droite ; un toast qui entre par le bas sort par le bas (et utilise des transitions CSS interruptibles, jamais des keyframes rigides).
5. **Kanban Atelier (Glisser-déposer) :** Ressort souple et court (`duration: 0.35s, bounce: 0.15`) pour ressentir le poids de la carte sans rebond excessif.
6. **Gating obligatoire :**
   - Effets de survol protégés par `@media (hover: hover) and (pointer: fine)` (pas de hover collant sur tablette/mobile).
   - Respect systématique de `@media (prefers-reduced-motion: reduce)` : on conserve les transitions d'opacité douces (`150ms`) et on supprime les translations/scales.

---

## 7. Print & Gabarits Documentaires (Cameroun & OHADA)

- **Feuille A4 nette (`@media print`) :** Fond blanc pur, suppression de toute navigation (`.no-print`), bordures noires/gris foncé `1px`, police serif/sans sobre (`10pt–11pt`), chiffres `tabular-nums`.
- **En-tête institutionnel obligatoire :** Logo filiale, Raison sociale, Forme juridique, Capital social, Adresse, **NIU**, **RCCM**, Centre des Impôts, Coordonnées bancaires, Devise **FCFA (XAF)**.
- **Filigrane d'état centré (opacité 6–8 %) :** `PROFORMA`, `ORIGINAL`, `DUPLICATA`, `PAYÉE`, `AVOIR`, `ANNULÉE`.
- **Pied de page :** Montant total **en toutes lettres**, mentions légales d'exonération ou retenues (AIR/TSR), blocs de signatures/cachets adaptés au destinataire.

---

## 8. Anti-Patterns (« Ce qu'on ne livre jamais »)

1. **Jamais de texte `#c6e911` sur fond blanc**, ni de texte blanc sur `#c6e911`.
2. **Jamais de `transition: all`** ni de courbe `ease-in` sur un menu/tiroir/modale.
3. **Jamais d'animation sur `Ctrl+K`**, les raccourcis clavier ou la saisie rapide en caisse.
4. **Jamais de chiffres financiers non alignés** (toujours `tabular-nums` + alignement à droite).
5. **Jamais d'ombres lourdes ni de dégradés flashy** sur les cartes de travail ERP.
6. **Jamais de KPI affiché à `0` par défaut** ou trompeur (si une donnée manque ou est désactivée, la métrique n'est pas affichée).
7. **Jamais de modales empilées les unes sur les autres** : utiliser le Tiroir d'inspection + étape ou accordéon progressif.
8. **Jamais d'ancien vocabulaire hors Cameroun (`IFU`, `XOF`)** dans les écrans ou documents générés.
