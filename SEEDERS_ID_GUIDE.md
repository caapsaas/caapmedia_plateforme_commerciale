# Seeders ID Refactoring Guide

## Status

✅ **Seeders with IDs Fixed:**
- subsidiary.seeder.ts
- user.seeder.ts  
- contact.seeder.ts

⏳ **Seeders Still to Fix (9 remaining):**
1. employee.seeder.ts
2. product.seeder.ts
3. supplier.seeder.ts
4. equipement.seeder.ts
5. order.seeder.ts
6. treasury.seeder.ts
7. tax_rate.seeder.ts
8. contact-cities.seeder.ts

---

## How to Fix Remaining Seeders

### Pattern 1: Simple Data Arrays (product, supplier, equipement, order)

**File:** `backend/prisma/seeders/product.seeder.ts`

1. Add imports at top:
```typescript
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';
```

2. Add ID to each object in array:
```typescript
const productsData = [
    {
        id: generateId(ID_PREFIXES.PRODUCT), // ← ADD THIS
        name: 'Roll-up Classique...',
        // ... rest of fields
    },
    // Repeat for each object
];
```

3. Find `.create()` calls and add ID:
```typescript
const product = await prisma.product.create({
  data: {
    id: generateId(ID_PREFIXES.PRODUCT), // ← ADD THIS
    ...productData,
    subsidiaryId,
  },
});
```

### Pattern 2: Upsert with Create Block (supplier)

**File:** `backend/prisma/seeders/supplier.seeder.ts`

```typescript
await prisma.supplier.upsert({
  where: { email: supplier.email },
  update: { /* ... */ },
  create: {
    id: generateId(ID_PREFIXES.SUPPLIER), // ← ADD THIS
    // ... rest of fields
  },
});
```

### Pattern 3: Loop-based Creation (employee)

**File:** `backend/prisma/seeders/employee.seeder.ts`

```typescript
const newEmployee = await prisma.employee.create({
  data: {
    id: generateId(ID_PREFIXES.EMPLOYEE), // ← ADD THIS
    lastName: faker.person.lastName(),
    // ... rest of fields
  },
});
```

---

## ID Prefixes to Use

| Seeder | Prefix | Constant |
|--------|--------|----------|
| employee.seeder.ts | EMP | ID_PREFIXES.EMPLOYEE |
| product.seeder.ts | PRD | ID_PREFIXES.PRODUCT |
| supplier.seeder.ts | SUP | ID_PREFIXES.SUPPLIER |
| equipement.seeder.ts | EQP | ID_PREFIXES.EQUIPMENT |
| order.seeder.ts | ORD | ID_PREFIXES.ORDER |
| treasury.seeder.ts | TRS | ID_PREFIXES.TREASURY |
| tax_rate.seeder.ts | TAX | ID_PREFIXES.TAXRATE |

---

## Quick Checklist

For each seeder:
- [ ] Add imports: `generateId` and `ID_PREFIXES`
- [ ] Add `id: generateId(ID_PREFIXES.XXX)` in data objects
- [ ] Add `id: generateId(ID_PREFIXES.XXX)` in `.create()` blocks
- [ ] Add `id: generateId(ID_PREFIXES.XXX)` in `.upsert()` create blocks
- [ ] Test seeder runs without errors: `npx prisma db seed`

---

## AutoMigration Script (Optional)

Run this to auto-add imports to remaining seeders:

```bash
for file in employee contact product supplier equipement order treasury tax_rate; do
  sed -i "s/from '@prisma\/client';/from '@prisma\/client';\nimport { generateId } from '.\/generate-id.util';\nimport { ID_PREFIXES } from '.\/id-prefixes.const';/" backend/prisma/seeders/${file}.seeder.ts
done
```

Then manually add the `id: generateId(...)` lines to `.create()` and `.upsert()` blocks.

---

## Testing

After fixing all seeders:

```bash
# Clear and re-seed database
npx prisma db seed

# Verify IDs are generated correctly
npx prisma studio

# Check generated IDs in database
SELECT id, email FROM "contacts" LIMIT 5;
-- Should show: CNT-SNCM1AB, CNT-SNCM1XY2, etc.
```

---

## Files Available

Helper functions copied to seeder directory:
- `backend/prisma/seeders/generate-id.util.ts`
- `backend/prisma/seeders/id-prefixes.const.ts`

These files are duplicates of the main source files and should be kept in sync.

---

**Last Updated:** 2026-07-16
**Progress:** 3/11 seeders fixed (27%)
