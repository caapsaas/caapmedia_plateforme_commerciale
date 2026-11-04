-- Legacy NEW orders could previously be moved through the Kanban before approval.
-- Preserve recorded completed manufacturing rather than sending those jobs back.
UPDATE "orders" AS o
SET "status" = 'PENDING_DELIVERY'
WHERE o."status" = 'NEW'
  AND o."production_status" = 'READY_FOR_DELIVERY'
  AND EXISTS (
    SELECT 1 FROM "order_production_history" AS h
    WHERE h."order_id" = o."id" AND h."status" = 'READY_FOR_DELIVERY'
  );
