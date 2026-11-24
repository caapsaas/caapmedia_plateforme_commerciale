-- Repair the known mismatch without changing payment data or production history.
UPDATE "orders"
SET "status" = 'PENDING_DELIVERY'
WHERE "status" = 'IN_PRODUCTION'
  AND "production_status" = 'READY_FOR_DELIVERY';
