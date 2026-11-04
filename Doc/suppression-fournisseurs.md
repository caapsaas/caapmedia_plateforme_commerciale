# Modification et suppression des fournisseurs

Les routes `GET`, `PATCH` et `DELETE /purchasing/suppliers/:id` acceptent les identifiants historiques UUID et les identifiants métier `SUP-…`. Un identifiant mal formé reste rejeté. La modification accepte un sous-ensemble des champs du fournisseur.

La suppression est définitive et exécutée dans une seule transaction PostgreSQL sérialisable, après vérification des droits sur la filiale du fournisseur. Elle supprime :

- le fournisseur et ses commandes d'achat ;
- les lignes et historiques de ces commandes, ainsi que leurs dettes fournisseur, par les cascades existantes ;
- les transactions de trésorerie dont `relatedDocumentId` référence le fournisseur, une commande ou une dette concernée ;
- les intentions de journalisation dont `payload.sourceId` référence une opération concernée, ainsi que les écritures comptables liées et leurs contre-passations ;
- les mouvements de stock rattachés aux commandes concernées.

Avant suppression, les effets des transactions validées sur les soldes de trésorerie sont annulés, y compris lorsqu'un paiement a été fait depuis un compte du siège. Les transactions en attente ne modifient pas le solde. Les mouvements de stock supprimés sont soustraits des niveaux de stock dans leurs unités de base. Les autres mouvements et consommations subsistent ; le stock peut donc devenir négatif si les réceptions supprimées ont déjà été consommées.

Les articles du catalogue partagé sont conservés et leur association au fournisseur est retirée. Les opérations saisies sans lien par identifiant ne sont pas identifiables avec certitude et ne sont pas supprimées par recherche sur le nom du fournisseur.

Cette suppression comprend les écritures comptables liées, même déjà comptabilisées : il s'agit d'un effacement explicite de l'historique, pas d'une simple désactivation du fournisseur ou d'une extourne. La confirmation affichée dans Configuration précise la portée de cette action. Aucune migration n'est nécessaire.

Vérifications : `npx jest src/purchase/suppliers --runInBand` et `node test/supplier-deletion.integration.cjs` depuis `backend/`. Le second contrôle exige une base locale et annule intégralement sa transaction de test.
