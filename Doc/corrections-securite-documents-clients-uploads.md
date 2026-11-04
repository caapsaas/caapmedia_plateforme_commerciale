# Corrections de sécurité : documents, clients et uploads

## Documents privés (faille 2)

- Les nouveaux documents RH sont stockés dans `backend/private/documents/employee-documents/<filiale>/`.
- Les nouveaux documents du secrétariat sont stockés dans `backend/private/documents/secretariat/`.
- Le téléchargement passe par `/api-caapmedia/private-documents/...` : session staff valide, rôle approprié, vérification de la filiale, réponse en pièce jointe et `Cache-Control: private, no-store`.
- RH : `ADMIN`, `HR_MANAGER`. Secrétariat : `ADMIN`, `SECRETARY`. Le `SUPER_ADMIN` conserve l'accès global. Les rôles actifs sont pris en compte.
- La suppression d'un fichier RH passe par le même contrôle d'accès.
- Au démarrage, les fichiers des anciens dossiers publics sont déplacés vers le stockage privé, sans modification des URL historiques en base. Le frontend convertit ces anciennes URL vers les routes authentifiées. Une collision de fichiers arrête le démarrage sans écrasement.
- Un ancien fichier RH sans rattachement en base est refusé. Les nouveaux uploads en attente de rattachement sont accessibles uniquement aux rôles RH autorisés de leur filiale.

### Déploiement

1. Sauvegarder la base et les dossiers de documents, puis arrêter les anciennes instances de l'API.
2. Déployer le backend et le frontend ensemble, en lançant les commandes depuis `backend/` et `Frontend/` respectivement.
3. Rendre `backend/private/` persistant et inscriptible par l'API. Ce dossier ne doit être exposé par aucun serveur web ni CDN. Le sauvegarder avec la base et les uploads.
4. Démarrer une première instance pour déplacer les anciens documents. Vérifier les permissions et les journaux ; une collision exige de comparer les fichiers avant toute intervention.
5. Si le reverse proxy sert `/public` directement, interdire également `/public/employee-documents/` et `/public/uploads/secretariat/`. Purger les anciennes copies présentes dans ses caches/CDN. Le backend bloque lui-même ces routes historiques.
6. Vérifier : lien public ancien refusé, téléchargement connecté autorisé, autre filiale refusée, documents historiques et nouveaux lisibles par leurs utilisateurs autorisés.

Ne pas republier les anciens documents lors d'une restauration ou d'un retour à une ancienne version. Aucun changement de schéma Prisma n'est nécessaire pour ces corrections.

## Empreintes des mots de passe (faille 3)

- Les listes et fiches CRM excluent `passwordHash` dans les requêtes Prisma.
- Les réponses de connexion, création, modification, suppression et gestion du portail client n'exposent plus ces empreintes.
- Un intercepteur global retire également `passwordHash` des relations imbriquées, notamment `vente.customer` et `tâche.contact`, en préservant dates, montants décimaux et données binaires.
- Les mots de passe temporaires retournés par les actions explicites de création/réinitialisation du portail restent dans le fonctionnement existant ; leur remplacement par des liens d'activation constitue un chantier distinct.

## Uploads de commandes (faille 4)

- Dix fichiers maximum, 10 Mio maximum par fichier.
- Formats admis : PDF, PNG, JPEG et WebP ; extension, MIME annoncé et signature du contenu doivent correspondre. Cette vérification de format n'est pas une analyse antivirus.
- Stockage temporaire hors du dossier public, noms générés par le serveur et rangement par filiale.
- Nettoyage des fichiers si le format, le quota, la validation ou la création de commande échouent.
- Quatre requêtes d'upload simultanées au maximum par processus, et refus avant réception si l'espace libre est inférieur à 500 Mio.
- Quota par défaut : 1 Gio par filiale, 5 Gio au total. Les fichiers de commandes historiques comptent dans le quota global.
- Variables facultatives, en Mio : `ORDER_UPLOAD_SUBSIDIARY_QUOTA_MB=1024`, `ORDER_UPLOAD_GLOBAL_QUOTA_MB=5120`. Les valeurs doivent être strictement positives.

Les contrôles de concurrence et la sérialisation des quotas concernent un processus API. Pour une installation avec plusieurs processus écrivant sur le même volume, centraliser les uploads ou ajouter un verrou partagé avant d'activer cette topologie. Prévoir un volume dédié avec quota système et une limite de corps multipart au reverse proxy (par exemple 110 Mio pour cette route).

## Vérifications

Les tests de sécurité couvrent les sessions JWT, rôles et filiales, chemins malveillants, migration sans écrasement, redaction des empreintes, formats interdits, faux formats, taille/nombre de fichiers, quota, nettoyage après rejet et compatibilité des liens frontend. Les commandes de validation sont les builds des deux applications, les tests Jest ciblés et `node --test test/private-documents.test.cjs` dans `Frontend/`.
