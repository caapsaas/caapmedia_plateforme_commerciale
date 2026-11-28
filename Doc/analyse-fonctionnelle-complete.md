# Analyse Fonctionnelle Complète — Plateforme Commerciale & ERP CaapMedia

Ce document présente une vision **100 % fonctionnelle et métier** de la plateforme **CaapMedia** : son organisation multi-filiales, ses rôles et règles d'accès, l'ensemble de ses écrans et vues, les parcours utilisateurs de bout en bout, le détail de chaque module ainsi que les **macro-actions** (chaînes automatisées inter-modules).

---

## Sommaire

1. [Partie 1 — Vision générale & Organisation Multi-Filiales](#partie-1--vision-générale--organisation-multi-filiales)
2. [Partie 2 — Rôles, Identités, Sécurité & Gouvernance des Accès](#partie-2--rôles-identités-sécurité--gouvernance-des-accès)
3. [Partie 3 — Cartographie complète des Vues & Écrans](#partie-3--cartographie-complète-des-vues--écrans)
4. [Partie 4 — Parcours Utilisateurs de bout en bout](#partie-4--parcours-utilisateurs-de-bout-en-bout)
5. [Partie 5 — Catalogue détaillé des Fonctionnalités, Actions & Possibilités par Domaine](#partie-5--catalogue-détaillé-des-fonctionnalités-actions--possibilités-par-domaine)
6. [Partie 6 — Macro-Actions, Automatisations & Réactions en Chaîne](#partie-6--macro-actions-automatisations--réactions-en-chaîne)

---

## Partie 1 — Vision générale & Organisation Multi-Filiales

La plateforme **CaapMedia** est un progiciel de gestion intégré (ERP), CRM et vitrine commerciale conçu pour une entreprise d'impression, de signalétique, de communication visuelle et de services marketing structurée en **plusieurs filiales** rattachées à un **Siège social**.

### 1.1 Le modèle Siège vs Filiales

- **Une entité légale multi-succursales :** L'entreprise regroupe plusieurs filiales opérationnelles, dont **une seule est désignée comme le Siège**.
- **Identité propre à chaque filiale :** Chaque filiale possède ses propres informations légales et bancaires (nom, logo, adresse, téléphone, e-mail, IFU, RCCM, banque, numéro de compte, code SWIFT, capital social, taux d'impôt sur les sociétés), son propre calendrier RH (jours ouvrés et jours fériés), ses propres paramètres de pointage et son propre périmètre opérationnel (clients locaux, commandes, ventes, caisses, coffre-fort, stocks physiques, employés, paie, réunions, documents, exercices comptables).
- **Isolation stricte par défaut :** Un collaborateur rattaché à une filiale ne voit et ne manipule que les données de sa propre filiale. Il ne peut ni consulter ni modifier les opérations d'une autre filiale.

### 1.2 Ce qui est partagé (global) vs ce qui est local (par filiale)

| Élément | Portée | Règle métier |
|---|---|---|
| **Catalogue des Services** | Global (toute l'entreprise) | Les services vendus aux clients et leurs formulaires de spécifications sont communs à toutes les filiales. |
| **Catalogue des Matières Premières** | Global (définition) / Local (quantité) | La fiche d'un article de stock est partagée, mais les quantités disponibles et l'entrepôt sont gérés indépendamment par chaque filiale. |
| **Unités de mesure & Listes de référence** | Global | Les unités (Feuille, Rame, Rouleau...) et listes d'options (grammages, papiers, couleurs...) sont administrées centralement. |
| **Taux de TVA / Taxes de vente** | Global | Un catalogue commun de taxes avec un taux par défaut appliqué aux commandes et proformas. |
| **Workflows de fabrication & Marges commerciales** | Global | Les gammes de fabrication types et l'intervalle de marge autorisé s'appliquent à toute l'entreprise. |
| **Banques physiques (institutions)** | Global | Les établissements bancaires sont référencés globalement, puis reliés aux comptes bancaires de chaque filiale. |
| **Plan comptable & Journaux comptables** | Global | Un plan comptable SYSCOHADA unique et 5 journaux standards partagés ; les écritures et exercices restent séparés par filiale. |
| **Base Clients (Contacts)** | Locale avec unicité e-mail globale | L'adresse e-mail d'un client est unique sur toute la plateforme : lors d'une commande, il est possible de rechercher un client existant d'une autre filiale sans créer de doublon. |

### 1.3 La vue consolidée et les exceptions transversales

- **Super Administrateur :** Rattaché au Siège, il utilise les mêmes écrans que les administrateurs de filiale mais bénéficie par défaut d'une **vue consolidée multi-filiales** sur les analyses, le CRM, la finance (bilan, compte de résultat, trésorerie, reçus de caisse), les stocks, les équipements, les utilisateurs et les expressions de besoin, avec la possibilité de filtrer sur une filiale précise.
- **Directeur Financier :** Dispose d'une visibilité consolidée sur les tableaux de bord analytiques, le bilan, le compte de résultat, la transparence fiscale et les états comptables, tout en restant cantonné à sa filiale pour les opérations de caisse dépense ou de réception de remise de caisse.
- **Principe de gouvernance du Super Administrateur :** Le Super Administrateur supervise, paramètre, valide les expressions de besoin et gère les décaissements centraux (coffre et banques), mais il reste en **lecture seule** sur la saisie opérationnelle quotidienne (proformas, commandes, ventes, CRM, achats, mouvements de stock, maintenance, secrétariat) afin de préserver la séparation des tâches.

---

## Partie 2 — Rôles, Identités, Sécurité & Gouvernance des Accès

### 2.1 Les 10 rôles internes et l'identité Client

| Rôle | Mission principale | Écran d'accueil par défaut | Périmètre & Restrictions clés |
|---|---|---|---|
| **Super Administrateur** | Gouvernance globale, configuration maître, trésorerie centrale, validation des besoins, audit. | Tableau de bord Analyses | Lecture seule sur les opérations quotidiennes (commerce, achats, stock, maintenance, secrétariat). Accès permanent à la comptabilité. |
| **Administrateur (Filiale)** | Pilotage complet et administration opérationnelle d'une filiale. | Tableau de bord Analyses | Limité à sa filiale. Ne peut pas créer de filiales ni accéder aux décaissements siège ou aux diagnostics d'intégration. Seul l'**Admin du Siège** a un accès permanent à la comptabilité et peut approuver les accès comptables temporaires. |
| **Commercial** | Prospection, gestion du portefeuille client, devis proforma, prise de commandes, demandes de besoin. | Commandes / Ventes | Ne voit que ses propres dossiers CRM. N'a pas accès au tableau de bord financier global (trésorerie/banques/coffres), uniquement à l'analyse des ventes. |
| **Caissier** | Vente directe au comptoir, encaissement des commandes/créances, suivi des reçus et remise de caisse. | Caisse | Seul rôle autorisé à opérer l'écran Caisse et à encaisser des paiements clients. Dans Finance, ne voit que les remises de caisse (aucun décaissement direct). |
| **Responsable Achats** | Gestion des fournisseurs, commandes d'achat, réceptions et suivi des stocks. | Achats | Accès limité aux modules Achats, Stocks, Notifications et Sécurité personnelle. |
| **Directeur Financier** | Pilotage financier, gestion des dépenses/charges, réception des remises de caisse, règlement des besoins approuvés, états financiers et comptabilité. | Finance | N'a pas accès aux décaissements centraux (coffre/banques du Siège) ni à l'approbation des accès comptables. Doit demander un accès temporaire pour consulter/opérer la comptabilité. |
| **Secrétaire** | Gestion documentaire, organisation des réunions/PV, suivi des tâches administratives et appui CRM. | Secrétariat | Accès limité au Secrétariat, au CRM, aux Notifications et à la Sécurité personnelle. |
| **Responsable RH** | Dossiers employés, suivi des pointages et QR codes, absences/congés, primes, calcul et signature de la paie, calendrier de la filiale. | Gestion RH | Limité aux ressources humaines, à la paie et aux réglages RH/fiscaux de sa filiale. |
| **Responsable Pré-embauche** | Suivi des candidats/stagiaires en formation pré-embauche et saisie de leurs résultats commerciaux (prospects/clients acquis). | Formations pré-embauche | Strictement cantonné à cet écran (toute autre navigation le redirige automatiquement). Ne peut cumuler aucun autre rôle et n'a pas accès aux notifications. |
| **Directeur de Production** | Validation pré-production des commandes, pilotage de l'atelier (Kanban), prélèvement des matières, gestion des machines et de la maintenance. | Production | Accès limité à la Production, aux Commandes, à la Maintenance, aux Équipements, aux Notifications et à la Sécurité. |
| **Client (externe)** | Consultation du catalogue public, gestion de son profil et suivi de ses commandes dans l'espace client. | Vitrine / Mon Compte | Identité totalement séparée du personnel interne ; aucun accès à l'interface de gestion interne. |

### 2.2 Multi-rôles et changement de rôle actif

- Un collaborateur peut se voir attribuer un **rôle principal** et un ou plusieurs **rôles additionnels** (sauf le Responsable Pré-embauche qui ne peut pas être cumulé).
- Lorsqu'un utilisateur possède plusieurs rôles, une barre d'onglets s'affiche en haut de l'écran pour basculer entre ses rôles assignés.
- **Principe de moindre privilège actif :** Le changement de rôle est réel et vérifié en permanence. L'utilisateur ne dispose que des droits du **rôle actuellement actif** (il doit basculer volontairement sur son autre rôle pour accéder à ses écrans et actions). Le changement de rôle vide les données affichées du rôle précédent et redirige vers l'écran d'accueil du nouveau rôle.

### 2.3 Accès temporaire à la comptabilité (Juste-à-Temps)

- Par mesure de contrôle interne, la **Comptabilité** est protégée indépendamment des rôles standards : seuls le **Super Administrateur** et l'**Administrateur du Siège** y ont un accès permanent.
- Tout autre collaborateur (y compris un Directeur Financier ou un Administrateur de filiale) qui ouvre la Comptabilité arrive sur un écran de demande d'accès où il doit rédiger une justification (10 caractères minimum).
- L'Administrateur du Siège (ou le Super Administrateur) reçoit une alerte avec compteur en attente et peut **approuver** l'accès pour une durée limitée (en **heures** ou en **jours**, 8 heures par défaut) ou le **refuser** avec un motif.
- Pendant la durée accordée, l'utilisateur voit un compte à rebours en temps réel dans l'en-tête comptable ; à expiration, l'accès est automatiquement verrouillé.

### 2.4 Sécurité des comptes, sessions et traçabilité

- **Connexion & Protection contre les tentatives abusives :** Pas d'auto-inscription pour le personnel (comptes créés par l'administration). Les tentatives de connexion et de réinitialisation sont limitées en fréquence.
- **Mot de passe oublié :** Le collaborateur peut demander un lien de réinitialisation à usage unique (valable 1 heure) envoyé par e-mail ; la validation d'un nouveau mot de passe (10 caractères minimum) révoque automatiquement toutes ses sessions ouvertes.
- **Double authentification (2FA) :** Chaque collaborateur peut activer la 2FA depuis son profil (scan d'un QR code via application d'authentification + validation d'un premier code à 6 chiffres). L'activation fournit **10 codes de récupération à usage unique**. La désactivation exige le mot de passe actuel et un code de vérification.
- **Verrouillage par inactivité :** Après **15 minutes sans interaction**, une fenêtre d'alerte lance un compte à rebours de **60 secondes** permettant de prolonger la session ou de se déconnecter immédiatement ; passé ce délai, la déconnexion est automatique.
- **Journal d'audit de sécurité :** Tous les événements sensibles (connexions réussies/échouées, activation/désactivation 2FA, utilisation d'un code 2FA, demandes de réinitialisation, détection de réutilisation de session) sont consignés avec date, adresse IP et appareil pour consultation par le Super Administrateur (historique conservé même après suppression d'un compte).

---

## Partie 3 — Cartographie complète des Vues & Écrans

### 3.1 Vues publiques & Espace Client

| Vue | Public cible | Contenu & Rôle de l'écran |
|---|---|---|
| **Catalogue / Accueil** | Visiteurs & Clients | Vitrine des services actifs, bannière animée, barre de recherche, filtre par 4 grandes catégories et sous-catégories, panier de demande de devis (partage WhatsApp), inscription newsletter, accès connexion client et accès personnel. |
| **Réalisations** | Visiteurs | Présentation de l'entreprise, galerie de projets réalisés, présentation des 8 pôles de savoir-faire (conseil marketing, design, numérique, offset, sérigraphie, grand format, broderie, livraison) et références clients. |
| **À propos** | Visiteurs | Historique de CaapMedia / Caap-Groupe SARL, atouts et rayonnement régional. |
| **Entreprise** | Visiteurs | Présentation de l'atelier et des équipes en 10 photos, piliers de production et informations de visite (localisation Douala / carte). |
| **Contact** | Visiteurs | Formulaire de prise de contact envoyé au support, bouton d'appel/WhatsApp et itinéraire géographique. |
| **Mon Compte Client** | Clients connectés | Espace personnel à onglets : Profil (coordonnées et adresse de livraison), Mes Commandes (historique regroupé avec statut et montant), Sécurité, Moyens de paiement et Avis *(ces deux derniers onglets ainsi que la modification de mot de passe client en autonomie sont actuellement à l'état d'aperçu/simulation).* |
| **Pointage QR Public** | Employés | Écran rapide ouvert en scannant le QR code de présence : saisie du matricule employé et choix **Arrivée** ou **Départ**. |

### 3.2 Vues du Tableau de bord interne

#### Pilotage & Outils transverses
- **Analyses (Tableau de bord général) :** Indicateurs globaux (ventes payées, revenu net, nouveaux clients, valeur de stock), graphiques ventes/répartition du stock, et 4 sous-onglets de consultation de trésorerie (Banques, Coffre, Caisses, Caisse dépense) avec soldes, relevés de compte et journal des mouvements.
- **Analyse des ventes :** Chiffre d'affaires payé, nombre de commandes, ventes directes comptoir, panier moyen, Top 5 produits vendus, ventes par catégorie et Top 5 clients.
- **Analyse des achats :** Valeur totale des achats, nombre de bons de commande, panier moyen d'achat, dépenses par fournisseur et Top 5 matières achetées.
- **Notifications :** Cloche d'alerte en temps réel dans la barre supérieure + page complète paginée (filtres Toutes / Non lues, marquage lu, accès direct à la commande ou au besoin concerné).
- **Sécurité personnelle :** Activation/désactivation de la double authentification (2FA) et gestion des codes de secours.

#### Commerce, Clients & Vente au comptoir
- **CRM :** Tableau de bord commercial (entonnoir de vente à 5 étapes, tâches urgentes, interactions récentes) et onglets complets : Prospects (Leads), Comptes entreprises, Contacts clients, Opportunités (Kanban glisser-déposer), Contrats, Activités (interactions & tâches) et **IA Marketing**.
- **Proforma :** Liste avec compteurs par statut, création guidée en 4 étapes depuis un Prospect, aperçu/PDF A4, partage (E-mail, WhatsApp direct ou manuel), suivi des statuts et conversion en commande.
- **Commandes / Ventes :** Liste des commandes et ventes directes, création de commande complète (`Nouvelle commande`), suivi des étapes, validation/paiement/livraison/clôture/annulation, impression de Facture, Bon de Commande et Bon de Livraison.
- **Caisse (Point de Vente) :** Interface comptoir réservée au Caissier pour créer une vente directe instantanée (avec calcul coût/marge et fiche technique) ou sélectionner une commande en attente afin d'encaisser un paiement partiel ou total.
- **Reçus de caisse :** Tableau de bord journalier des encaissements du caissier (ou de tous les caissiers pour le Super Admin) avec graphique horaire par tranches de 3h et liste détaillée des reçus.
- **Mes Commandes :** Vue dédiée permettant de suivre l'avancement des commandes et d'accéder aux bons de livraison.
- **Expressions de besoin :** Soumission de demandes d'achat/dépense par les commerciaux, suivi des statuts, validation/rejet par le Super Admin et règlement par le Directeur Financier.

#### Production, Opérations & Maintenance
- **Production :** Deux vues complémentaires : file de validation pré-production (accepter ou rejeter une commande avec motif) et tableau Kanban en 4 colonnes (Prépresse → Impression → Finition → Prêt pour livraison) avec prélèvement de matières premières.
- **Achats :** Onglets Commandes d'achat (création, suivi, réception partielle/totale), Fournisseurs et Bons d'entrée imprimables.
- **Gestion des stocks :** Niveaux de stock par filiale avec alertes de rupture sous seuil, journal complet des mouvements (entrées/sorties/transferts/pertes) et écran d'inventaire physique avec calcul automatique d'écart.
- **Maintenance :** Vue maître-détail croisant la liste des équipements (avec badges de retard d'entretien) et le journal chronologique des interventions techniques.
- **Équipements :** Registre du parc machines, valeur d'acquisition, statuts opérationnels et échéances de maintenance.

#### Finance & Comptabilité
- **Finance & Gestion :** Hub financier multi-onglets adapté au rôle :
  - *Pour le Caissier :* uniquement **Remises de caisse** (déclaration vers le coffre).
  - *Pour Admin / Directeur Financier / Super Admin :* Gestion des crédits clients (créances), Caisse dépense (et paiement des expressions de besoin approuvées), Dettes fournisseurs & dettes long terme, Dépenses ponctuelles & récurrentes, Transactions externes, Préfinancement, Remises de caisse (réception au coffre), Transparence fiscale, Compte de résultat et Bilan.
- **Décaissement (Siège — Super Admin uniquement) :** Gestion centralisée des décaissements depuis le Coffre-fort et les Banques, virements inter-comptes, file d'attente de double validation (Maker-Checker) et gestion des contreparties.
- **Historique des créances :** Suivi détaillé et filtrable des commandes impayées ou partiellement réglées, avec encaissement par le Caissier.
- **Historique financier :** Grand journal des flux de trésorerie séparé en Recettes et Dépenses avec solde avant/après chaque opération et édition de relevés imprimables.
- **Comptabilité OHADA :** Tableau de bord comptable, Saisie et liste des écritures, Journal centralisateur, Grand Livre, Balance Générale, États financiers SYSCOHADA (Bilan & Compte de résultat), Immobilisations (amortissements & cessions), Plan comptable, Correspondances comptables et Exercices fiscaux.
- **Demandes d'accès comptabilité (Siège) :** Console d'approbation/refus des demandes d'accès temporaires avec durée personnalisable.

#### Ressources Humaines, Secrétariat & Configuration
- **Gestion RH :** Module multi-onglets : Employés (fiches, documents, simulateur paie), Formations pré-embauche, Cartes & QR codes de pointage (avec scanner webcam), Historique des présences & pointage manuel signé, Absences/Congés & Calendrier des jours fériés, Primes & 13e mois, Paie (calcul mensuel, signature et paiement des charges sociales/fiscales).
- **Signature des fiches de paie :** Écran dédié à la signature électronique (pad tactile) et au téléchargement des bulletins.
- **Secrétariat :** Onglets Documents d'entreprise, Réunions & Procès-verbaux, et Tâches administratives.
- **Configuration :** Hub d'administration regroupant : Filiales, Utilisateurs, Taxes, Catalogue (Services + Constructeur de formulaires, Matières premières, Unités, Listes de référence), Fournisseurs, Clients, Barèmes de paie, Équipements, Paramètres commerciaux (marges), Coûts horaires machines, Workflows de fabrication, Comptes de trésorerie et Banques physiques.
- **Audit des intégrations (Super Admin) :** Console de surveillance automatique de la disponibilité des 15 services externes et d'infrastructure de l'entreprise.

---

## Partie 4 — Parcours Utilisateurs de bout en bout

### Parcours 1 : Du Visiteur en ligne au Client fidélisé
1. Un visiteur découvre le catalogue sur la vitrine publique, filtre par catégorie, consulte la fiche d'un service, choisit sa quantité et joint éventuellement son fichier graphique (maquette/BAT).
2. Il ajoute l'article à son panier de devis et transmet son besoin en un clic via **WhatsApp** (avec lien enrichi du produit) ou via le formulaire de contact. *(Il n'y a pas de paiement direct en ligne sur la vitrine ; la négociation tarifaire et les spécifications techniques passent par l'équipe commerciale.)*
3. Le visiteur peut également créer son **Compte Client** directement depuis la vitrine pour suivre ensuite l'état de ses commandes.

### Parcours 2 : Du Prospect CRM à la Commande validée (Pipeline Commercial)
1. **Capture & Qualification :** Le Commercial crée ou importe (via Excel) un **Prospect (Lead)**, l'évalue grâce à la grille de scoring sur 100 (adéquation, signal récent, récurrence, accessibilité, faisabilité), note ses appels/rendez-vous et fait évoluer son statut (`Nouveau` → `Contacté` → `Qualifié`).
2. **Devis Proforma :** À partir du prospect, le Commercial lance l'assistant en 4 étapes pour générer une **Facture Proforma** chiffrée, l'envoie par **E-mail** (PDF joint) ou **WhatsApp**, puis suit son ouverture (`Vue`) et la réponse du client (`Acceptée`).
3. **Conversion & Qualification CRM :**
   - Le prospect qualifié peut être converti en **Compte Entreprise + Contact + Opportunité** dans le pipeline Kanban (Qualification → Proposition → Négociation → Gagnée).
   - La proforma acceptée est convertie en **Commande confirmée** en renseignant la date d'échéance de paiement, les spécifications techniques de chaque service et les fichiers de production obligatoires.
4. **Commande directe en interne :** Le Commercial peut aussi créer une commande directement depuis `Nouvelle commande` pour un client régulier, un client d'une autre filiale ou un **client occasionnel** (créé à la volée avec simple nom et téléphone). Pour chaque service, il configure le temps machine estimé et sa marge commerciale, puis remplit le formulaire technique dynamique.

### Parcours 3 : Vente au comptoir & Remise de caisse (Parcours Caissier)
1. Le **Caissier** ouvre l'écran **Caisse** et sélectionne un client existant (ou en crée un nouveau).
2. Il ajoute les services demandés au comptoir (temps machines + marge + spécifications), applique d'éventuelles remises ou frais de montage, et encaisse immédiatement sur la caisse enregistreuse qui lui est personnellement assignée (espèces, Mobile Money) ou enregistre un paiement bancaire (carte, virement, chèque — mis en attente de validation).
3. Il peut aussi rappeler une commande existante impayée (ou une créance client) pour enregistrer un **paiement partiel ou total** et imprimer la Facture.
4. En fin de journée ou de service, il ouvre **Finance → Remises de caisse**, sélectionne sa caisse, coche les reçus/commandes espèces du jour et déclare le montant remis vers le **Coffre-fort** de sa filiale.
5. Le **Directeur Financier** compte physiquement les espèces au coffre et confirme la réception (le système exige une correspondance exacte entre le montant compté et le montant déclaré).

### Parcours 4 : Validation, Fabrication & Livraison (Parcours Production)
1. Dès qu'une commande est créée (manuelle, comptoir ou proforma), elle arrive dans la **file de validation pré-production** au statut `En attente de validation`, étape `Prépresse`.
2. Le **Directeur de Production** (ou Admin filiale) vérifie les fichiers graphiques, les spécifications techniques, les étapes machines et la marge commerciale :
   - S'il **valide**, la commande passe `En production` et apparaît sur le tableau Kanban.
   - S'il **rejette** (avec motif obligatoire), la commande est annulée et tous les paiements/écritures liés sont automatiquement annulés/contre-passés.
3. L'atelier fait avancer la carte étape par étape sans saut possible : **Prépresse → Impression → Finition → Prêt pour livraison**.
4. À tout moment en production, le responsable peut cliquer sur **« Prélever les matières »** pour enregistrer la consommation réelle de consommables en stock.
5. Au passage à `Prêt pour livraison`, la commande devient `En attente de livraison` et le Caissier/Commercial sont notifiés.
6. Lors de la remise au client, l'équipe enregistre la **livraison** (totale ou partielle par article et nombre de colis), ce qui génère automatiquement le **Bon de Livraison** imprimable. La clôture finale (`Terminée`) n'est autorisée que lorsque la commande est payée à 100 %.

### Parcours 5 : Approvisionnement, Réception & Gestion des Stocks
1. Le **Responsable Achats** crée un **Bon de commande fournisseur** en sélectionnant le fournisseur, les matières premières, l'unité d'achat (ex. : *Rames*) et les conditions de paiement.
2. À la livraison du fournisseur, il enregistre la **réception** (totale ou partielle) dans l'unité d'achat. Le système convertit automatiquement en unité de base (ex. : *1 Rame = 500 Feuilles*), incrémente le stock de la filiale et ouvre le **Bon d'Entrée** prêt à imprimer et signer.
3. Si la commande est réglée plus tard, le **Super Administrateur** solde la **Dette fournisseur** générée automatiquement depuis un Coffre-fort.
4. En magasin, l'équipe suit les seuils d'alerte, effectue les transferts inter-filiales ou ajustements de casse/perte, et réalise des **inventaires physiques** en saisissant la quantité réelle comptée.

### Parcours 6 : Expression de besoin (du terrain au règlement)
1. Un **Commercial** soumet une **Expression de besoin** (titre, description, budget estimatif, date souhaitée).
2. Tous les **Super Administrateurs** sont notifiés en temps réel ; l'un d'eux **approuve** ou **rejette** (motif obligatoire).
3. Une fois approuvée, le **Directeur Financier** de la filiale règle la dépense réelle **exclusivement depuis la Caisse Dépense** de cette filiale (si le solde est suffisant), en une seule fois, en rattachant la catégorie de dépense appropriée.

### Parcours 7 : Trésorerie centrale & Double contrôle (Maker-Checker)
1. Un besoin de décaissement ou de virement impliquant un **compte bancaire** est initié dans **Décaissement** (Super Admin) ou lors d'un encaissement bancaire (Caissier).
2. L'opération est créée en statut **En attente** sans toucher aux soldes.
3. Un **autre Super Administrateur** (contrôle strict : le créateur ne peut jamais s'auto-valider) examine l'opération dans le panneau des validations en attente et l'**approuve** ou l'**annule**.

### Parcours 8 : Boucle RH complète (Candidat → Employé → Pointage → Paie & Charges)
1. **Pré-embauche :** Le **Responsable Pré-embauche** suit un stagiaire/candidat, enregistre sa progression et ses prospects/clients acquis, puis le convertit en **Employé** en un clic.
2. **Dossier & Salaire :** Le **Responsable RH** complète le dossier (CNPS, NUI/NTIF, contrat, indemnités, mode salaire de base ou **salaire net souhaité** calculé à rebours).
3. **Pointage quotidien :** Chaque matin, l'employé scanne le **QR code** de la filiale et saisit son matricule pour pointer son **Arrivée** (marquée `En retard` après 08h30) puis son **Départ** le soir. À 18h00, le système marque automatiquement `Absent injustifié` les actifs n'ayant pas pointé (hors week-ends, jours fériés et congés validés).
4. **Paie mensuelle :** En fin de mois, le RH génère les fiches de paie du mois en lot (calcul CNPS plafonné, IRPP progressif, CAC, CFC, FNE, primes), l'employé ou le responsable **signe électroniquement** la fiche (ce qui la passe à `Payée` et génère l'écriture comptable), puis les charges sociales/fiscales sont cumulées et déclarées pour paiement.

---

## Partie 5 — Catalogue détaillé des Fonctionnalités, Actions & Possibilités par Domaine

### 5.1 E-Commerce, Vitrine & Marketing IA
- **Vitrine commerciale :** Navigation par 4 catégories et sous-catégories, recherche instantanée, galerie multi-images avec zoom, panier de devis persistant, envoi d'un article ou du panier complet via WhatsApp, formulaire de contact anti-spam, inscription newsletter (`-15 %`) sans doublon.
- **Assistant IA Marketing :**
  - *Générateur de campagnes (`AI Marketing`) :* À partir d'un produit/service, génère 5 idées de campagnes structurées (titre, cible, concept) adaptées au marché ouest-africain (français/anglais).
  - *Rédacteur de fiches services :* Dans la configuration d'un service, génère automatiquement une description marketing concise (< 100 mots) adaptée au contexte local.

### 5.2 CRM (Gestion de la Relation Client)
- **Prospects (Leads) :** Saisie manuelle ou import Excel en masse ; fiche enrichie à plus de 35 champs (géographie, secteur, offre CaapMedia, besoin fin d'année, confiance documentaire, canal WhatsApp vérifié, message préparé, **5 sous-scores détaillés totalisant /100**) ; conversion atomique des prospects `Qualifiés` (avec e-mail et téléphone) en Compte + Contact + Opportunité.
- **Comptes & Contacts :** Fiches entreprises et contacts réguliers ou occasionnels ; activation d'accès au portail client et réinitialisation de mot de passe par e-mail depuis la fiche contact ; vue consolidée à 360° (infos, interactions, opportunités, contrats, tâches).
- **Opportunités & Contrats :** Tableau Kanban à 5 étapes par glisser-déposer avec valeur cumulée par colonne ; gestion des contrats clients (brouillon, actif, expiré, annulé) avec dates et montants.
- **Interactions & Tâches :** Journal des appels, e-mails et réunions ; tâches de suivi priorisées (`Haute`, `Moyenne`, `Basse`) avec modèles d'intitulés rapides et complétion en un clic.

### 5.3 Proformas, Commandes, Ventes & Caisse
- **Proformas (`PRO-YYYY-XXXX`) :** Assistant 4 étapes (Client → Articles → Conditions → Récapitulatif) ; calcul TTC, validité 30 jours par défaut ; édition/suppression en brouillon ; partage multi-canal (E-mail avec PDF serveur, WhatsApp Business direct, ou WhatsApp manuel avec formatage `+237`) ; lien externe sécurisé qui passe automatiquement la proforma à `Vue` à l'ouverture ; expiration automatique à échéance ; conversion en commande avec saisie des specs techniques.
- **Constructeur de formulaires dynamiques (Services) :** Configuration par service de groupes de champs glisser-déposer et **18 types de champs** (texte, nombre, décimal, montant, listes simples/multiples, radio, cases, booléen, date, heure, couleur, fichier, URL, e-mail, téléphone, dimensions), listes de valeurs partagées, visibilité différenciée (client / production / modifiable après validation) et **règles conditionnelles** (`si valeur = X alors afficher / masquer / rendre obligatoire / lecture seule`).
- **Commandes & Ventes :** Remises monétaires et frais de montage par ligne ; activation/désactivation de la TVA ; 10 modes de paiement (`Espèces`, `Mobile Money`, `Orange Money`, `Wave`, `PayCaap`, `Carte`, `Virement bancaire`, `Chèque`, `Paiement à la livraison`, `Crédit client`) ; paiements échelonnés/partiels ; livraisons partielles ou totales ; annulation obligatoire avec motif ; impression/PDF de **Factures**, **Bons de commande** et **Bons de livraison**.
- **Caisse :** Affectation d'une caisse enregistreuse par caissier ; encaissements directs au comptoir et recouvrement des créances ; suivi horaire des reçus de caisse.

### 5.4 Production & Coûts de Fabrication
- **Gammes de fabrication (Workflows) :** Modèles globaux ordonnés de machines liés optionnellement à un service, servant de pré-remplissage modifiable lors de la prise de commande.
- **Calcul de coût de production :** Saisie des heures machine estimées pour le lot × coût horaire machine (uniquement machines `Opérationnelles`) + marge commerciale (encadrée visuellement par la fourchette min/max configurée avec alertes `Marge négative` ou `Marge faible < 10 %`) → calcul automatique du prix de vente HT du lot et unitaire.
- **Figeage historique (Snapshot) :** À la création de la commande, les étapes machines, coûts horaires, temps, marges, prix, définition de formulaire et valeurs techniques sont figés définitivement.
- **Suivi Kanban & Matières :** Validation pré-production, avancement séquentiel 4 étapes avec horodatage, et prélèvement manuel de matières premières tracé sur la commande.

### 5.5 Achats, Fournisseurs, Stocks & Équipements
- **Fournisseurs & Achats :** Création de bons de commande (`Brouillon`, `Commandé`, `Partiellement reçu`, `Reçu`, `Annulé`) avec conditions de paiement (`Immédiat`, `Crédit`, `Traite`) ; réception partielle/totale avec **conversion automatique des unités d'emballage vers l'unité de base** ; mise à jour du dernier prix d'achat ; génération automatique du **Bon d'Entrée** ; suppression fournisseur protégée (bloquée si des opérations bancaires existent).
- **Stocks :** Vue filiale ou consolidée ; alertes de rupture sous seuil minimum ; journal complet à 11 types de mouvements (`Réception achat`, `Retour client`, `Ajustement positif`, `Transfert entrant`, `Consommation production`, `Perte`, `Casse`, `Consommation interne`, `Ajustement négatif`, `Retour fournisseur`, `Transfert sortant`) ; inventaire physique avec prévisualisation d'écart.
- **Équipements & Maintenance :** Registre des machines (`Opérationnelle`, `En maintenance`, `Hors service`), date et valeur d'acquisition, alerte visuelle de maintenance en retard, carnet d'interventions (date, technicien, description, coût). Le coût horaire de production est géré séparément de la maintenance.

### 5.6 Finance & Trésorerie
- **5 types de comptes de trésorerie :** `Banque` (liée à une banque physique, numéro masqué pour les non-admins), `Coffre-fort`, `Caisse enregistreuse` (affectée aux caissiers, aucune dépense directe possible), `Caisse dépense` (strictement une par filiale, créée à 0 et alimentée uniquement depuis le Coffre-fort), `Compte de préfinancement` (un par filiale).
- **Décaissements & Virements :** Décaissements typés (fournisseurs, salaires, primes, IRPP, CNPS, CFC/FNE, TVA, loyer, utilités, marketing, fournitures, etc.) depuis Coffre/Banque (Super Admin) ou Caisse dépense (Directeur Financier), avec gestion des contreparties et virements inter-comptes en même devise.
- **Remises de caisse (`RC-YYYY-NNNN`) :** Déclaration par le Caissier des espèces et reçus à transférer au Coffre-fort, puis validation physique par le Directeur Financier (contrôle strict sans écart).
- **Dépenses & Charges récurrentes :** Dépenses ponctuelles réglables depuis un coffre XOF ; abonnements de dépenses récurrentes (hebdomadaires, mensuels, annuels, hors salaires) avec exécution automatique.
- **Transactions externes & Préfinancement :** Suivi des flux hors exploitation (investissements, prêts, dons, transferts PDG, etc. avec workflow Brouillon → Validé/Annulé) ; suivi des crédits/débits de préfinancement par poste (matières premières, main-d'œuvre, énergie, transport, autre).
- **Dettes, Immobilisations, Crédits & Fiscalité :** Règlement des dettes fournisseurs depuis Coffre ; suivi des dettes long terme ; gestion des immobilisations (acquisition, amortissement annuel linéaire *pro-rata temporis*, cession) ; recouvrement des créances clients ; module **Transparence fiscale** (IRPP+CAC, CNPS, CFC/FNE, TVA collectée avec aperçus de déclaration) ; Bilan et Compte de résultat de gestion.

### 5.7 Comptabilité OHADA / SYSCOHADA
- **Référentiel & Paramétrage :** Plan comptable SYSCOHADA révisé (classes 1 à 7), 5 journaux (`JV`, `JA`, `JB`, `JC`, `JOD`), table de correspondance d'environ 48 événements métier vers les comptes comptables, exercices fiscaux par filiale (clôture impossible tant que des brouillons subsistent ; réouverture possible).
- **Saisie, Validation & Intangibilité :** Saisie manuelle équilibrée en `Brouillon` (supprimable) ; attribution d'un **numéro de pièce séquentiel continu sans trou** par journal/filiale/exercice uniquement à la validation (`Comptabilisée`) ; interdiction absolue de modifier/supprimer une écriture validée, corrections uniquement par **extourne (contre-passation)** à sens inversé.
- **États comptables légaux :** Tableau de bord comptable, Journal Centralisateur, Grand Livre, Balance Générale à 4 colonnes, Bilan et Compte de Résultat SYSCOHADA (avec calcul de marge commerciale, EBE, résultat net et contrôle d'équilibre Actif/Passif), Tableau des Immobilisations.

### 5.8 Ressources Humaines, Paie & Pointage
- **Employés & Pré-embauche :** Fiches complètes (état civil, personnes à charge, CNPS, NUI/NTIF, RIB, manager, historique postes/formations/évaluations, pièces jointes) ; saisie du salaire en mode **Brut** ou **Net souhaité** avec simulation en direct ; suivi des stagiaires pré-embauche et conversion en employé.
- **Pointage & Absences :** QR code permanent de filiale (révocable/régénérable) ou badges journaliers + scanner webcam ; pointage d'arrivée/départ avec détection automatique de retard (> 08h30) ; pointage manuel avec pauses et **signature tactile obligatoire** ; gestion des absences justifiées/injustifiées, soldes de 7 types de congés et calendrier filiale (jours ouvrés + jours fériés). *(À noter : la saisie de code PIN et le contrôle de géolocalisation autour d'un rayon ne sont pas actifs dans le parcours de pointage actuel.)*
- **Paie Cameroun & Charges sociales :** Calcul mensuel automatique (CNPS 4,2 % / 4,2 % + 7 % plafonnée à 750 000 FCFA, risques pro A/B/C, CFC 1 % / 1,5 %, FNE 1 %, IRPP progressif annuel avec cumuls YTD et abattements, CAC 10 %) ; gestion des primes et **13e mois automatique** ; signature électronique des bulletins ; accumulation, échéancier (`À payer` → `Échu` → `En retard` à J+7) et paiement des charges sociales/fiscales et lots de salaires par mode de paiement.

### 5.9 Secrétariat, Configuration & Surveillance
- **Secrétariat :** Coffre-fort documentaire classé par catégorie (`Légal`, `Financier`, `RH`, `Contrat`, `Autre`) et statut (`Brouillon`, `Final`, `Archivé`) ; gestion des réunions (ordre du jour, participants employés avec envoi d'invitations, rédaction du PV, clôture une fois la date passée et pièce jointe officielle PDF/Word) ; gestion des tâches de secrétariat.
- **Configuration & Surveillance :** Administration centralisée des filiales, utilisateurs, taxes, catalogues, barèmes de paie, équipements, marges, coûts machines, workflows, comptes de trésorerie/banques, et **console d'audit des intégrations** testant toutes les 5 minutes les 15 dépendances critiques de la plateforme.

---

## Partie 6 — Macro-Actions, Automatisations & Réactions en Chaîne

Cette section résume les **macro-actions** les plus structurantes : lorsqu'un utilisateur effectue une action métier clé, la plateforme orchestre automatiquement un ensemble d'effets cohérents sur les autres modules.

### 6.1 Chaînes déclenchées par l'activité commerciale & production

| Macro-action déclenchée | Réactions automatiques en chaîne sur la plateforme |
|---|---|
| **Conversion d'un Prospect (`Qualifié`)** | 1. Crée ou met à jour le **Compte entreprise**.<br>2. Crée le **Contact client** avec mot de passe provisoire pour le portail et envoie l'e-mail de bienvenue.<br>3. Ouvre une **Opportunité** à l'étape `Qualification` (échéance à +30 jours).<br>4. Supprime le prospect d'origine. |
| **Ouverture d'un lien Proforma externe** | 1. Vérifie l'intégrité/validité du document.<br>2. Passe automatiquement la proforma de `Envoyée` à `Vue` avec horodatage. |
| **Conversion d'une Proforma (`Acceptée`) en Commande** | 1. Marque la proforma `Convertie`.<br>2. Retrouve ou crée le Contact client.<br>3. Crée la **Commande** (`En attente de validation`, `Prépresse`, `Impayée`, source `Devis`) liée à la proforma et à l'opportunité.<br>4. Enregistre l'historique initial de production et notifie Admin, Directeur de Production et Commercial. |
| **Création d'une Commande (ou Vente directe Caisse)** | 1. Fige les **étapes machines, coûts horaires, coûts de production, marges, prix et formulaires techniques** sur chaque ligne.<br>2. Place la commande en `Prépresse` dans l'historique de production.<br>3. *(Si Caisse directe)* Crée immédiatement les lignes de **Vente (`Payée`)**, crédite la caisse du caissier (ou crée une opération bancaire `En attente`) et met en file les écritures comptables (`JV` + `JC`/`JB`).<br>4. Notifie Admin, Directeur de Production et Commercial. |
| **Encaissement d'un paiement sur Commande** | 1. Met à jour `Montant payé` et statut de paiement (`Partiellement payée` / `Payée`).<br>2. Crédite la caisse du caissier (`Validée`) ou enregistre un mouvement bancaire (`En attente`).<br>3. Dès que la commande atteint **100 % payée**, génère automatiquement les fiches **Vente (`Payée`)** pour tous les articles et déclenche la comptabilisation des ventes (`JV`) et de trésorerie (`JC`/`JB`).<br>4. Notifie Admin, Commercial, Caissier, Directeur Financier et Directeur de Production. |
| **Avancement Kanban à `Prêt pour livraison`** | 1. Enregistre l'étape dans l'historique de production.<br>2. Fait basculer automatiquement la commande au statut `En attente de livraison`.<br>3. Notifie Admin, Production, Commercial **et Caissier**. |
| **Annulation / Rejet d'une Commande** | 1. Exige un motif obligatoire.<br>2. Supprime les fiches `Vente` associées et remet le montant payé à `0`.<br>3. **Contre-passe (extourne)** les écritures comptables déjà validées ou supprime les brouillons/intentions en attente.<br>4. Crée des écritures inverses de sortie sur les comptes de trésorerie/coffres crédités.<br>5. Met à jour ou rejette les remises de caisse en attente concernées.<br>6. Nettoie les notifications de paiement et notifie les équipes. |

### 6.2 Chaînes déclenchées par les Achats, Stocks & Besoins

| Macro-action déclenchée | Réactions automatiques en chaîne sur la plateforme |
|---|---|
| **Création d'un Bon de commande fournisseur** | 1. Crée le bon de commande au statut `Commandé` avec historique.<br>2. Génère automatiquement une **Dette fournisseur** (`À payer`) du montant total, avec échéance égale à la date de livraison prévue. |
| **Réception d'un Bon de commande fournisseur** | 1. Convertit automatiquement les quantités reçues depuis l'unité d'achat vers l'unité de base du stock.<br>2. Incrémente le stock de la filiale et crée un mouvement `Réception achat`.<br>3. Met à jour le dernier prix d'achat de l'article et le statut du bon (`Partiellement reçu` ou `Reçu`).<br>4. Ouvre automatiquement le **Bon d'Entrée** imprimable. |
| **Saisie d'un Inventaire physique** | 1. Calcule en direct l'écart entre le stock théorique et la quantité comptée.<br>2. Met à jour le stock au niveau réel et génère automatiquement un mouvement `Ajustement positif` ou `Ajustement négatif`. |
| **Suppression d'un Fournisseur** | 1. **Contrôle bloquant :** refuse toute suppression si une opération bancaire est liée.<br>2. Sinon, annule l'impact sur les soldes de trésorerie, supprime les transactions, extourne/supprime les écritures comptables, déduit des stocks les quantités reçues des bons de commande liés, détache le catalogue global et supprime fournisseur, bons et dettes. |
| **Règlement d'une Dette fournisseur (Super Admin)** | 1. Débite le Coffre-fort sélectionné.<br>2. Met à jour la dette (`Partiellement payée` / `Payée`) **et synchronise** le bon de commande associé + son historique.<br>3. Crée la transaction financière validée et met en file l'écriture comptable correspondante. |
| **Règlement d'une Expression de besoin approuvée** | 1. Vérifie que le règlement est unique et que la **Caisse Dépense** unique de la filiale dispose du solde suffisant.<br>2. Débite la Caisse Dépense.<br>3. Enregistre le paiement de besoin + la transaction de dépense.<br>4. Met en file l'écriture comptable de charge selon la catégorie choisie (sans créer de dépense en double) et notifie le commercial demandeur. |

### 6.3 Chaînes déclenchées par la Finance, Comptabilité & RH

| Macro-action déclenchée | Réactions automatiques en chaîne sur la plateforme |
|---|---|
| **Opération impliquant un compte Banque** | 1. Place la transaction ou le virement en statut `En attente` sans modifier les soldes.<br>2. Bloque l'auteur de l'opération de la valider lui-même.<br>3. Lors de la validation par un second Super Admin : vérifie le solde, met à jour les comptes source/destination avec traçabilité `solde avant/après` et déclenche la comptabilisation. |
| **Validation d'une Remise de caisse par le Directeur Financier** | 1. Vérifie l'égalité stricte entre montant compté et montant déclaré.<br>2. Débite la caisse enregistreuse du caissier et crédite le Coffre-fort de la filiale.<br>3. Crée la transaction financière validée et génère l'écriture comptable de virement de trésorerie. |
| **Acquisition, Amortissement ou Cession d'Immobilisation** | 1. *Acquisition :* enregistre le bien, débite la trésorerie (si comptant) et génère l'écriture d'immobilisation (classe 2).<br>2. *Amortissement annuel :* calcule la dotation linéaire (avec prorata la 1re année, plafonnée à la valeur nette) et génère l'écriture `JOD` (`681` / `281`).<br>3. *Cession :* solde les amortissements cumulés, sort le bien du bilan, constate la valeur nette comptable et, en cas de vente, enregistre la créance et le produit de cession. |
| **Signature électronique d'une Fiche de Paie** | 1. Passe le bulletin de `En attente` à `Payé` avec date de paiement et signature.<br>2. Met à jour les **cumuls annuels** de l'employé (brut, net, CNPS, CFC, IRPP, CAC).<br>3. Met en file l'écriture comptable de paie. |
| **Validation d'une Écriture comptable (`Brouillon` → `Comptabilisée`)** | 1. Vérifie que l'exercice fiscal est ouvert et que Débit = Crédit.<br>2. Attribue le **numéro séquentiel légal continu** du journal pour la filiale et l'année.<br>3. Verrouille définitivement l'écriture contre toute modification ou suppression (seule l'extourne reste possible). |

### 6.4 Automatisations planifiées en arrière-plan

1. **Moteur de comptabilisation automatique (toutes les 20 secondes) :** Traite la file d'attente des événements comptables issus des modules métier (ventes, achats, dépenses, paie, immobilisations, trésorerie), crée les écritures `Comptabilisées` sans doublon (avec jusqu'à 5 tentatives en cas d'incident) et crée automatiquement l'exercice fiscal en cours si nécessaire.
2. **Dépenses récurrentes (tous les jours à minuit) :** Génère les dépenses arrivées à échéance (`Hebdomadaire`, `Mensuelle`, `Annuelle`), lance leur comptabilisation, calcule la prochaine date et désactive automatiquement les abonnements arrivés à date de fin.
3. **Absences automatiques de fin de journée (tous les jours à 18h00) :** Pour chaque filiale, identifie les employés actifs n'ayant pas pointé (ou sans départ) un jour ouvré hors jours fériés et hors congés posés, et crée automatiquement une absence `Injustifiée`.
4. **Surveillance des intégrations (toutes les 5 minutes) :** Contrôle l'état des 15 services connectés (base de données, messagerie, stockage, WhatsApp, IA, liens) et conserve un historique glissant sur 30 jours.
5. **Expiration automatique des proformas :** Fait passer les devis `Envoyés` ou `Vus` dont la date de validité est dépassée au statut `Expirée`.
