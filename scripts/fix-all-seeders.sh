#!/bin/bash

# Copy utility files to seeders directory
cp backend/src/common/utils/generate-id.util.ts backend/prisma/seeders/generate-id.util.ts 2>/dev/null
cp backend/src/common/constants/id-prefixes.const.ts backend/prisma/seeders/id-prefixes.const.ts 2>/dev/null

# Add imports to all seeders
seeders=(
  "contact.seeder.ts:CONTACT"
  "employee.seeder.ts:EMPLOYEE"
  "product.seeder.ts:PRODUCT"
  "supplier.seeder.ts:SUPPLIER"
  "equipement.seeder.ts:EQUIPMENT"
  "order.seeder.ts:ORDER"
  "treasury.seeder.ts:TREASURY"
  "tax_rate.seeder.ts:TAXRATE"
  "contact-cities.seeder.ts:CONTACT"
)

for seeder_info in "${seeders[@]}"; do
  IFS=':' read -r seeder prefix <<< "$seeder_info"
  filepath="backend/prisma/seeders/$seeder"

  if [ -f "$filepath" ]; then
    # Skip if already has generateId
    if grep -q "generateId" "$filepath"; then
      echo "✓ Already fixed: $seeder"
      continue
    fi

    # Add imports after first import
    sed -i "s/from '@prisma\/client';/from '@prisma\/client';\nimport { generateId } from '.\/generate-id.util';\nimport { ID_PREFIXES } from '.\/id-prefixes.const';/" "$filepath"

    echo "✓ Added imports to: $seeder"
  fi
done

echo ""
echo "✅ All seeders updated with imports!"
