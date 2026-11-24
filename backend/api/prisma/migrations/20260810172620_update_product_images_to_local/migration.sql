-- Remplace les URLs Google Storage par des URLs locales /public/products/
-- Les images sont stockées dans backend/public/products/

UPDATE "public"."product_image"
SET "image_url" = '/public/products/' || "image_name"
WHERE "image_url" LIKE 'https://storage.googleapis.com/%';
