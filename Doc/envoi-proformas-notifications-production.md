# Proformas : envoi et partage

Dans la liste des proformas ou leur aperçu, **Envoyer la proforma** ouvre une fenêtre présentant le client et ses coordonnées.

- **E-mail** : le serveur génère le PDF depuis les données enregistrées, puis le joint à l'e-mail adressé au client. Le destinataire affiché est une précondition : si son adresse a changé entre-temps, aucun e-mail n'est envoyé avant actualisation. Le statut devient « envoyé » après acceptation par le serveur SMTP, ce qui ne garantit pas la réception en boîte de réception. Le renvoi est également disponible.
- **WhatsApp** : préparer le message, vérifier le numéro et ouvrir WhatsApp. Le message contient un lien temporaire vers le PDF ; l'utilisateur confirme son envoi dans WhatsApp. Préparer le message n'envoie rien et ne modifie pas le statut. Pour une proforma encore en brouillon, « J'ai envoyé le message » permet ensuite de confirmer l'envoi dans l'application.
- Les proformas expirées ou rejetées ne peuvent pas être envoyées. Les droits de rôle et de filiale restent vérifiés côté serveur.
- Les liens PDF sont signés avec une clé distincte des sessions staff, valides sept jours au maximum et au plus jusqu'à la validité du devis. Une modification du contenu ou un rejet invalide le lien. Ils n'autorisent ni accès au compte client ni modification de la proforma. Le téléchargement interdit la mise en cache.

## Configuration serveur

Utiliser les variables SMTP existantes : `SMTP_HOST`, `SMTP_PORT` (587 par défaut), `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Le transport exige TLS/STARTTLS et n'accepte pas les pièces jointes fournies par URL ou chemin arbitraire.

Configurer en production `PUBLIC_API_URL`, par exemple `https://caapmedia.com/api-caapmedia`, pour générer un lien accessible au client. À défaut, l'origine de `FRONTEND_URL` est utilisée avec le préfixe API ; sur localhost, le port backend est utilisé. Un lien localhost reste limité au poste de développement. HTTPS est requis pour une adresse publique.

Installer les dépendances du backend avec le lockfile, puis construire et déployer les deux applications. Aucune migration Prisma supplémentaire n'est requise pour ces deux fonctionnalités. Les tests SMTP simulent le transport : aucun message réel n'est transmis aux clients pendant la validation.

Références : [WhatsApp - Click to chat](https://faq.whatsapp.com/5913398998672934), [transport SMTP Nodemailer](https://nodemailer.com/smtp), [PDFKit](https://pdfkit.org/docs/getting_started.html).

# Notifications commercial / production

Événements couverts : création d'une commande, y compris depuis une proforma acceptée ; validation ou annulation avant production ; progression en prépresse, impression et finition ; disponibilité pour livraison ; livraison et encaissement.

- Les destinataires sont limités à la filiale de la commande. Le commercial notifié est celui rattaché à cette commande ; une commande sans commercial ne déclenche pas d'envoi à tous les commerciaux.
- Le directeur de production et l'administration reçoivent les événements de leur filiale ; la caisse et les finances conservent les notifications nécessaires à leur suivi.
- Les notifications sont persistées puis poussées en SSE. Elles ne sont déclenchées qu'après validation des opérations métier. Les erreurs de notification sont journalisées sans provoquer une répétition de paiement ou de commande.
- Au clic dans la cloche ou la page Notifications, la commande s'ouvre dans Production ou Commercial selon le destinataire, même si elle ne figurait pas dans la page courante. La route de détail vérifie à nouveau la filiale et, pour un commercial, la propriété de la commande.
- Les listes et détails sont rafraîchis à réception des événements et à la reconnexion. Une récupération périodique des notifications prend le relais lorsque le flux est déconnecté.

Le push SSE reste celui du déploiement actuel, en mémoire par processus ; une infrastructure multi-instance nécessite une diffusion partagée pour un push immédiat entre processus. Les notifications persistées restent récupérables à la reconnexion.
