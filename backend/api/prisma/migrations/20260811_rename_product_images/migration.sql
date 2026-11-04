-- Met à jour les noms d'images pour correspondre aux vrais fichiers

UPDATE "public"."product_image" SET "image_name" = 'Roll-up-Classique-85x200cm.jpg' WHERE "image_name" LIKE '%Roll-up%';
UPDATE "public"."product_image" SET "image_name" = 'X-Banner-Classique-Indoor.jpg' WHERE "image_name" LIKE '%X-Banner%';
UPDATE "public"."product_image" SET "image_name" = 'Flying-Banner-Feather-Oriflamme.jpg' WHERE "image_name" LIKE '%Flying%';
UPDATE "public"."product_image" SET "image_name" = 'Backdrop-Stand-Parapluie.jpg' WHERE "image_name" LIKE '%Backdrop%';
UPDATE "public"."product_image" SET "image_name" = 'Flyers-Depliants.jpg' WHERE "image_name" LIKE '%Flyers%';
UPDATE "public"."product_image" SET "image_name" = 'T-Shirt-Imprime.jpg' WHERE "image_name" LIKE '%T-Shirt%';
UPDATE "public"."product_image" SET "image_name" = 'Cartes-de-visite.jpg' WHERE "image_name" LIKE '%Cartes%';
UPDATE "public"."product_image" SET "image_name" = 'Packaging-Produit.jpg' WHERE "image_name" LIKE '%Packaging%';
