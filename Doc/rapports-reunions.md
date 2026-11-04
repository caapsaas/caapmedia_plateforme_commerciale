# Rapports écrits des réunions

Dans **Secrétariat → Réunions → Détails** :

1. Une fois la réunion terminée, cliquer sur **Terminer la réunion**. Cette action est refusée avant la date et l'heure prévues.
2. Choisir le rapport externe puis cliquer sur **Importer le rapport**.
3. Le fichier peut ensuite être téléchargé ou remplacé. Le compte rendu saisi dans l'application est conservé.

Formats : PDF, DOC et DOCX, un fichier de 10 Mio maximum. Les contrôles côté serveur portent sur la taille, le type annoncé et le contenu. Les archives DOCX doivent contenir un document Word et ne pas déclarer de projet VBA.

Les rapports sont stockés dans `backend/private/documents/meeting-reports/`, jamais dans un dossier public. Import et téléchargement sont réservés aux secrétaires/administrateurs autorisés de la filiale ; les superadministrateurs conservent leur accès global. Les remplacements concurrents sont détectés et l'ancien fichier n'est supprimé qu'après enregistrement du nouveau.

La migration additive `20261029120000_add_meeting_report` ajoute les champs `completedAt`, `minutesFileUrl` et `minutesFileName`. Pour déployer : appliquer les migrations Prisma et régénérer le client avant de redémarrer le backend, puis déployer le frontend. Sous Windows, arrêter temporairement le serveur si son moteur Prisma verrouille la génération.

API :

- `POST /api-caapmedia/secretariat/meetings/:id/complete`
- `POST /api-caapmedia/secretariat/meetings/:id/report`, multipart, champ `file`
- Téléchargement authentifié via l'URL `minutesFileUrl` renvoyée.

Vérifications ciblées : `npx jest --runInBand src/secretariat src/common/private-documents` depuis `backend/`. Le test opt-in `node test/meeting-reports.integration.cjs` exige l'API sur localhost:3000 et la base locale ; il utilise une réunion temporaire sans participants, puis nettoie ses données et ses fichiers.
