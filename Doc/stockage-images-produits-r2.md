# Images produits — Cloudflare R2

## Configuration

Installer les dépendances dans `backend` avec `npm ci` lors du déploiement.
Reporter les variables de `backend/.env.r2.example` dans le fichier `.env` du backend et dans les secrets de l'hébergement. Ne jamais les définir dans Vite ni les committer.
Le jeton S3 doit autoriser lecture et écriture des objets du seul bucket choisi (Object Read & Write). Le domaine public doit être HTTPS et donner accès aux objets sans connexion, captcha ou lien expirant. Le nom du bucket n'est pas son URL. L'Account ID est l'identifiant Cloudflare du compte (32 caractères hexadécimaux).

R2 est le stockage par défaut et sa configuration est obligatoire au démarrage. Un échec d'upload bloque la sauvegarde de l'image : aucun repli silencieux vers le disque. Pour travailler exceptionnellement sans R2 en développement : `PRODUCT_IMAGE_STORAGE=local`. Ce mode est interdit avec `NODE_ENV=production`.

Le frontend accepte déjà les URL absolues : aucune clé Cloudflare ni modification frontend n'est nécessaire. Seules les images publiques du catalogue sont concernées ; les documents confidentiels restent dans leur stockage privé.

## Migration

Exécuter depuis `backend`, sur la machine qui possède les fichiers et avec `DATABASE_URL` pointant vers la base correspondante. Pour une production distante, effectuer ces commandes sur le serveur, ou fournir une copie complète des fichiers avec `PRODUCT_IMAGES_SOURCE_ROOT`. Ne pas substituer la base de développement à celle de production.

1. Sauvegarder la base et `public/products` avant l'opération. Suspendre les modifications du catalogue le temps de la bascule.
2. `npm run images:r2:migrate` : audit sans écriture, vérification de toutes les références locales et de la présence de leurs fichiers. Les URL externes existantes sont laissées telles quelles.
3. `npm run images:r2:migrate -- --apply` : sauvegarde du plan dans `.temp/r2-migrations/`, transfert des originaux, relecture depuis R2 et depuis le domaine public, contrôle SHA-256, puis remplacement atomique des URL en base. Toute source manquante, lecture incorrecte ou modification concurrente empêche la bascule.
4. Vérifier le catalogue et les images sur le domaine public, puis créer/modifier un produit et vérifier que son image utilise ce domaine. Relancer l'audit : les références locales migrées doivent avoir disparu.

La migration est relançable : les clés contiennent le SHA-256 du contenu et les références déjà migrées sont ignorées. Un transfert interrompu peut laisser des objets non référencés, mais ne supprime aucun original. Conserver le manifeste hors de l'hébergement éphémère ; il contient les anciennes et nouvelles URL et sert à une restauration contrôlée. Ne pas restaurer aveuglément une ancienne URL si un produit a été modifié depuis.

Les fichiers locaux non référencés par `ProductImage` ne sont pas publiés automatiquement : ils peuvent contenir des fichiers abandonnés. La migration porte sur toutes les images du catalogue référencées en base, pas sur tous les fichiers historiques du répertoire.

## Conservation et partage

Les nouvelles images reçoivent une clé unique et un cache immutable. Leur contenu est relu dans R2 avant leur enregistrement en base. Les objets ne sont pas automatiquement supprimés lorsqu'une image ou un produit est retiré, ni si l'enregistrement en base échoue : cela préserve les liens publics déjà partagés. Un nettoyage ultérieur doit être explicite et tenir compte de ces liens. Ne pas configurer de règle d'expiration R2 sur `products/`.

R2 évite la perte des fichiers lors du remplacement du code. Une sauvegarde indépendante de la base et des images reste nécessaire contre les suppressions accidentelles. Les URL peuvent être partagées dans WhatsApp ; cette intégration n'envoie pas automatiquement de pièces jointes via WhatsApp Business.

Référence officielle : https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/

## Aperçu du produit dans WhatsApp

Le bouton de devis (par produit ou pour tout le panier) ajoute le lien public de chaque produit au message, avec son nom, sa quantité et ses options. Le backend sert une page HTML à GET /api-caapmedia/products/:id/share contenant les métadonnées Open Graph, notamment la première image du produit. Cette page ne publie que le nom, la description et les images d'un produit actif et visible sur le site : aucun devis, prix interne ou renseignement client n'est exposé.

Pour le déploiement :
- Frontend : définir VITE_API_ORIGIN avec l'origine HTTPS publique du backend avant de construire le site.
- Backend : définir PUBLIC_BACKEND_URL avec cette même origine HTTPS publique, notamment derrière un reverse proxy.
- Laisser la route de partage et les images accessibles aux robots de WhatsApp, sans connexion ni challenge Cloudflare. Les adresses localhost ne peuvent pas produire un aperçu sur WhatsApp.
- Charger une vraie photo du produit par l'administration, puis ouvrir sa page de partage et vérifier l'image. Faire un essai sur un téléphone : ouvrir une demande de devis, attendre le chargement éventuel de l'aperçu, puis envoyer le message.

L'aperçu dépend de WhatsApp et des réglages de confidentialité du téléphone ; il peut ne pas apparaître. Pour un panier contenant plusieurs liens, ne pas attendre une carte par produit : WhatsApp choisit l'aperçu et les autres liens restent dans le texte. Les options et quantités sont dans le message, pas dans une page publique de commande. La carte n'est pas une pièce jointe et ne peut pas reproduire le bandeau Publicité Facebook, réservé aux publicités Meta. L'envoi de photos comme messages médias relève d'une intégration séparée avec WhatsApp Business Platform.

## Synchroniser les associations du poste local vers n0c

Cette opération est distincte du transfert des fichiers historiques. Si les produits locaux possèdent déjà les vraies URL R2 mais que la production possède encore des placeholders, exporter seulement les associations produit/images :

Depuis backend en local : npm run images:r2:export

Le fichier .temp/product-images-r2.json contient les identifiants source, noms, catégories et adresses publiques des images. Il ne contient ni clés R2 ni accès à la base. Un export existant n'est jamais écrasé ; pour un nouvel export utiliser -- --file .temp/autre-export.json.

Transférer ce JSON sous le nom product-images-r2.json à la racine de l'application n0c, ainsi que scripts/sync-product-images-r2.cjs dans son dossier scripts. Ne pas mettre le manifeste dans public/. Le script n'a besoin que de Node, dotenv et Prisma déjà présents en production : il ne dépend pas de ts-node, de src/ ni des clés S3.

Depuis le dossier de l'application n0c, avec son environnement Node activé et DATABASE_URL de production :

node scripts/sync-product-images-r2.cjs import --file product-images-r2.json

Cette commande est un audit sans écriture. Chaque produit doit correspondre par identifiant avec le même nom/catégorie, ou par une combinaison nom/catégorie unique. Les différences de casse et les espaces aux extrémités sont tolérés. Une différence réelle de libellé nécessite une vérification manuelle. Les produits absents de l'export sont conservés. Les images réelles déjà présentes en production ne sont pas écrasées : seules les images de remplacement Google connues ou les associations vides sont remplacées.

Si l'audit est correct et sans conflit, sauvegarder la base puis exécuter :

node scripts/sync-product-images-r2.cjs import --file product-images-r2.json --apply

Le script vérifie l'accessibilité des images R2, sauvegarde les anciennes associations dans .temp/r2-image-sync/, puis met à jour uniquement les relations d'images dans une transaction sérialisable. Il interrompt toute la bascule si un produit est modifié simultanément. Les fichiers R2 ne sont ni transférés ni supprimés, aucun produit n'est recréé. Conserver la sauvegarde des associations hors de l'hébergement éphémère. Réexécuter l'audit après application : les produits doivent être listés comme inchangés.
