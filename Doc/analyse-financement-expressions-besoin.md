# Analyse du financement des expressions de besoin

Date : 27 octobre 2026. Analyse du code et consultation en lecture seule de la base PostgreSQL locale. Les données de production n'ont pas été vérifiées. Aucun compte, solde ou mouvement financier n'a été modifié.

## Décision retenue et implémentée après cette analyse

Le paiement des expressions de besoin est limité exclusivement à la caisse de dépense (EXPENSE_BOX) de leur filiale. Les options de règlement direct depuis une banque ou un coffre évoquées dans l'analyse historique ci-dessous ne sont pas retenues pour ce module.

- Les notifications fonctionnent dans les deux sens : soumission vers les super-admins ; validation, rejet (avec motif) et règlement vers le commercial demandeur. Chaque notification ouvre la demande et actualise le suivi en temps réel. La décision et sa notification sont persistées dans la même transaction, puis diffusées après commit.
- Le super-admin valide la demande, puis confirme séparément son règlement avec le montant réel, le bénéficiaire, la nature de la dépense, la date et une référence facultative.
- L'API résout la caisse par la filiale de la demande ; aucun compte source libre ou compte de destination n'est accepté. Une configuration absente ou ambiguë est refusée.
- Un solde insuffisant bloque le règlement. L'alimentation préalable de la caisse reste une opération de trésorerie distincte ; aucun prélèvement automatique n'est effectué sur une banque ou un coffre.
- Une demande ne peut avoir qu'un règlement. La décision APPROVED reste conservée et le règlement est représenté par une relation NeedRequestPayment, avec transaction financière et auteur.
- Le débit conditionné au solde suffisant, la transaction financière, le règlement, l'événement comptable et la notification du commercial sont enregistrés dans une transaction Serializable. Les conflits de sérialisation sont réessayés de façon bornée. La notification temps réel est diffusée après commit.
- La suppression générique d'un mouvement lié à une demande est refusée ; les clés étrangères protègent également ce lien.
- L'affichage est en liste, avec recherche, tri, pagination, statut de décision et statut de règlement. La création et le détail restent en modales.

Routes ajoutées : GET /purchasing/need-requests/:id/payment-account et POST /purchasing/need-requests/:id/pay, réservées au super-admin. Les montants et la devise du règlement sont visibles au commercial concerné, sans exposer les soldes des comptes.

La catégorie est transmise au moteur comptable. Aucun ExpenseRecord supplémentaire n'est créé pour éviter de doubler la charge. L'ancien rapport fondé exclusivement sur ExpenseRecord reste un point distinct à harmoniser avec la comptabilité.

Les sections suivantes conservent les constats et pistes de l'analyse initiale ; la décision ci-dessus prévaut pour le parcours implémenté.

## Conclusion

Le financement doit réutiliser les comptes TreasuryAccount, les mouvements FinancialTransaction et la journalisation transactionnelle existants. La validation métier d'une expression et son règlement sont deux opérations distinctes. Une demande approuvée n'est aujourd'hui ni financée ni payée.

Le super-admin choisira explicitement un compte source, un montant et un mode d'exécution après approbation : règlement direct ou mise à disposition via la caisse de dépense de la filiale. Le budget estimatif du commercial ne constitue pas une autorisation de décaisser.

## 1. Disposition des comptes

Dans la base locale consultée :

| Famille | Comptes présents | Utilisation actuelle |
| --- | --- | --- |
| BANQUE | Compte Bancaire BOA ; Compte Mobile Money | Comptes de trésorerie rattachés à CAAP Siège. Le compte Mobile Money est modélisé comme BANQUE. |
| SAFE | Coffre-fort Central | Réserve de liquidités, rattachée à CAAP Siège. |
| EXPENSE_BOX | Une caisse pour Douala, Edéa, Kribi et Siège | Dépenses locales ; le service impose une seule caisse de dépense par filiale lors de la création. |
| CASH_REGISTER | Une caisse de vente pour chacune de ces quatre filiales | Encaissements commerciaux et remises au coffre ; décaissement typé direct interdit. |
| CAISSE / COMPTE_PREFINANCEMENT | Aucun compte de ces types trouvé | Types encore présents dans le schéma ; à exclure de la sélection dédiée au financement des besoins. |

Les comptes interrogés sont libellés en XOF. Il faut utiliser la devise du compte sélectionné et contrôler sa compatibilité avec le financement ; le besoin ne possède pas encore de champ devise.

Le modèle Bank décrit l'institution bancaire. Son nom et ses coordonnées ne portent pas le solde : le solde appartient au TreasuryAccount. Les coordonnées bancaires de Subsidiary ne sont pas non plus des comptes à débiter.

Anomalie de configuration : CAAP Douala et CAAP Siège ont tous deux isHeadquarter=true. Plusieurs services cherchent le siège par findFirst sans critère supplémentaire. Il faut identifier le siège de référence puis rendre sa sélection non ambiguë ; ne pas requalifier les filiales automatiquement dans le cadre de cette analyse.

Sources : backend/prisma/schema.prisma, modèles TreasuryAccount, Bank, Subsidiary ; backend/src/finance/treasury/treasury.service.ts, createAccount et findAllAccounts.

## 2. Fonctionnement financier existant

### Décaissement typé

POST /finance/treasury/disbursement passe par TreasuryService.createDisbursement :

- SAFE et BANQUE : décaissement réservé au super-admin par le contrôle du type source.
- EXPENSE_BOX : directeur financier de la filiale ; le super-admin bénéficie du contournement global de checkRole.
- CASH_REGISTER : décaissement direct refusé ; utiliser les remises de caisse.
- Un mouvement VALIDE débite le compte source immédiatement et crédite la destination lorsqu'il s'agit d'un transfert.
- Un mouvement EN_ATTENTE ne réserve et ne débite aucun fonds à sa création.
- Le mouvement conserve les comptes, le montant, les soldes résultants, la référence et éventuellement un tiers.
- L'intention de journalisation est enregistrée dans la même transaction Prisma ; son traitement comptable est asynchrone via l'outbox.

Le backend distingue les virements des dépenses par la présence d'une destination et les types CASH_REFILL/BANK_WITHDRAWAL. L'interface du coffre propose déjà l'alimentation d'une caisse de dépense. L'interface bancaire ne propose actuellement que les salaires et les primes : elle doit être étendue ou complétée par une modale spécifique aux besoins.

Aucun connecteur bancaire ou Mobile Money n'est appelé par ce flux : enregistrer un décaissement dans l'application ne déclenche pas un virement externe réel.

### Comptabilité et dépenses

Le moteur actuel distingue :

- TREASURY_TRANSFER : mouvement entre comptes, sans constatation d'une charge.
- TREASURY_EXPENSE : dépense payée ; la catégorie détermine le compte de charge lorsqu'elle est transmise.
- EXPENSE_RECORD : enregistrement d'une charge avec contrepartie fournisseur, sans débit du solde TreasuryAccount.
- SUPPLIER_DEBT_PAYMENT : règlement d'une dette fournisseur liée à un bon de commande.

Créer un ExpenseRecord seul ne débloque pas d'argent. Créer à la fois une charge autonome et une dépense générique pour le même besoin peut constater deux fois la charge. Si le besoin aboutit à un achat avec dette fournisseur, il faut utiliser le règlement de cette dette et rattacher la demande à ce paiement.

Sources : backend/src/finance/treasury/treasury.service.ts ; backend/src/finance/expense/expense.service.ts ; backend/src/finance/debts/debts.service.ts ; backend/src/accounting/outbox/accounting-outbox.service.ts ; backend/src/accounting/journalization/journalization.service.ts.

## 3. Circuit proposé

### Étape 1 — Approbation métier

Le super-admin valide ou rejette la demande. Il fixe un montant autorisé, distinct du budget estimatif facultatif. Aucun solde n'est modifié à ce stade. Les demandes validées existantes devront recevoir ce montant avant tout financement.

### Étape 2 — Déblocage des fonds

Un bouton « Débloquer les fonds » apparaît pour les demandes approuvées. La modale présente la demande, sa filiale, le montant autorisé, les sommes déjà décaissées et le reste disponible. Elle demande le compte source SAFE/BANQUE, le montant, la date, le mode et la référence du règlement.

Deux modes sont à distinguer :

1. **Règlement direct par le super-admin** : sortie du coffre ou d'une banque vers le bénéficiaire identifié. Un mouvement de paiement lié à la demande est créé. C'est le parcours le plus court pour régler effectivement le besoin.
2. **Financement de la caisse locale** : transfert du coffre ou d'une banque vers l'EXPENSE_BOX de la filiale du besoin. La demande devient financée ; elle ne devient payée qu'après le règlement effectif effectué depuis cette caisse par son responsable habilité.

Une remise d'argent au commercial avant justificatifs constitue une avance à suivre et à régulariser. Elle ne doit pas être assimilée automatiquement au paiement définitif d'une dépense ; ce parcours nécessiterait un traitement dédié si retenu.

### Étape 3 — Suivi du règlement

Conserver la décision PENDING/APPROVED/REJECTED et ajouter un suivi financier séparé : à financer, partiellement financée, financée, partiellement réglée, réglée. Les indicateurs proviennent des mouvements valides liés à la demande, avec distinction des transferts, paiements et restitutions.

L'historique doit montrer montant autorisé, fonds débloqués, montant payé, montant restant, comptes, bénéficiaire, auteur, date, référence et justificatifs. Une notification informe le commercial du déblocage ; le responsable de la caisse locale est également informé lorsqu'il doit exécuter le paiement.

## 4. Adaptations techniques recommandées

- Ajouter au besoin un montant autorisé et une devise, ainsi que l'auteur et la date de cette autorisation lorsque nécessaire.
- Ajouter une relation explicite entre expression et mouvements, par exemple NeedRequestMovement : demande, transaction financière unique, nature du mouvement et auteur. relatedDocumentId seul est une chaîne libre sans intégrité référentielle.
- Prévoir plusieurs mouvements pour permettre un financement fractionné, plusieurs comptes sources ou une restitution, tout en plafonnant le cumul au montant autorisé. Un paiement direct est un seul mouvement ; ne pas créer un transfert fictif en plus.
- Ajouter une route métier dédiée au financement d'une demande approuvée, réservée au super-admin. Les caisses disponibles sont résolues côté serveur selon la filiale du besoin.
- Extraire un noyau de décaissement acceptant une transaction Prisma existante, sur le modèle de createExpenseTransactionWithTx. Lier le besoin, débiter/créditer, enregistrer le mouvement, l'outbox et la notification dans une seule transaction ; publier la notification après commit.
- Conserver séparément filiale du compte source et filiale bénéficiaire du besoin. Un paiement depuis le siège ne doit pas faire disparaître le coût du besoin des analyses de sa filiale.
- Inclure une clé d'idempotence pour les nouvelles tentatives de soumission. Protéger également les demandes et comptes contre deux paiements simultanés avec verrouillage ou isolation adaptée et décrément conditionné au solde suffisant.
- Afficher les soldes uniquement aux rôles autorisés ; le commercial consulte son besoin et les montants associés, sans accès aux soldes globaux de l'entreprise.

## 5. Écarts à traiter avant réutilisation

| Point constaté | Incidence sur le financement |
| --- | --- |
| Deux filiales marquées siège | Résolution ambiguë des comptes centraux dans les parcours qui utilisent findFirst. |
| Le contrôle du solde lit puis décrémente sans verrou explicite, sans isolation Serializable ni condition balance >= montant dans la mise à jour | Deux opérations concurrentes peuvent dépasser le solde ou le plafond du besoin malgré une transaction Prisma. |
| updateTransactionStatus ne crédite pas destinationAccountId et envoie un événement générique TREASURY_EXPENSE pour un transfert différé | Ne pas utiliser la validation différée telle quelle pour alimenter une caisse. Elle utilise aussi la filiale de l'utilisateur pour l'outbox au lieu de celle du mouvement. |
| createDisbursement n'impose pas la matrice des types source/destination, ni des comptes distincts, ni une devise identique | Valider ces règles dans l'API métier ; ne pas dépendre du filtrage de la modale. |
| La route générique expenses ne reprend pas les restrictions SAFE/BANQUE du décaissement typé ; la validation différée ne les reprend pas non plus | Appliquer une politique commune pour éviter de contourner les contrôles du nouveau parcours. |
| La suppression de transaction compense seulement le compte principal, sans traitement complet du transfert ni contrepassation comptable dans cette méthode | Protéger les mouvements liés aux besoins et privilégier une annulation tracée avec compensation complète. |
| Le décaissement typé ne transmet pas expenseCategory dans l'outbox | La dépense retombe aujourd'hui sur la catégorie générique OTHER ; transmettre la nature de la dépense ou utiliser le flux métier adapté. |
| Les comptes TreasuryAccount ont accountCode mais le moteur comptable utilise surtout les mappings globaux caisse/banque | Les comptes physiques restent distincts en trésorerie, mais leur ventilation comptable détaillée ne l'est pas encore. |
| Le rapport getPnlStatement agrège ExpenseRecord pour les charges | Un nouveau paiement lié seulement à FinancialTransaction peut manquer dans ce rapport ; harmoniser la source des rapports sans doubler la comptabilisation. |

Ces constats proviennent de la lecture du code ; les défauts de concurrence et de validation différée n'ont pas été reproduits en exécutant des paiements sur la base locale.

## 6. Vérifications attendues pour l'implémentation

- Aucun mouvement pour une demande en attente ou rejetée.
- Décaissement réservé au super-admin depuis les sources autorisées.
- Solde insuffisant, plafond dépassé ou devise incompatible : aucune modification partielle.
- Double clic, nouvelle tentative et paiements simultanés : aucune sortie en double ni dépassement.
- Transfert : débit source et crédit de la bonne caisse dans la même transaction ; aucune charge ni statut « réglée » à ce seul stade.
- Paiement : lien à la demande, bénéficiaire et référence conservés ; une seule constatation de charge ou règlement de dette selon le flux retenu.
- Bonne filiale dans le suivi du besoin, l'historique de trésorerie et les rapports.
- Annulation ou restitution : compensation complète, traçabilité et recalcul du restant.
- Échec d'outbox ou de notification à l'enregistrement : rollback ; diffusion SSE seulement après commit.

Livrable de cette étape : analyse et proposition d'intégration. Le code du financement et les données financières restent inchangés.
