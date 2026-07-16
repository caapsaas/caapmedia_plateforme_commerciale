# Guide de Refactorisation des IDs - CaapMedia SaaS

## 📋 Vue d'ensemble
Ce document explique comment refactoriser progressivement l'application pour utiliser le système de génération d'IDs personnalisés au lieu des UUIDs.

**Format**: `PREFIX-TIMESTAMP_BASE36+RANDOM_BASE36`  
**Exemple**: `EMP-SNCM1AB` (Employee), `PRD-SNCM1XY2` (Product)

---

## ✅ Étapes Complétées

### Phase 1: Infrastructure
- ✅ `generateId()` utilitaire créé: `backend/src/common/utils/generate-id.util.ts`
- ✅ Catalogue de préfixes: `backend/src/common/constants/id-prefixes.const.ts`
- ✅ Tests unitaires: `backend/src/common/utils/generate-id.util.spec.ts`

### Phase 2: Schéma Prisma
- ✅ Tous les champs `id` convertis de `@default(uuid()) @db.Uuid` → `String @map("id")`
- ⚠️ Migration de base de données requise (voir section "Migration DB")

---

## 📋 Phase 3: Refactorisation des Services (À FAIRE)

### Pattern Uniforme
Chaque service doit suivre ce pattern:

```typescript
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        id: generateId(ID_PREFIXES.EMPLOYEE), // ✅ Ajouter ici
        lastName: createDto.lastName,
        firstName: createDto.firstName,
        // ... autres champs
      },
    });
  }
}
```

### Services à Refactoriser (Priority)

#### 🔴 PRIORITÉ HAUTE (Entités principales)
1. **Employee** (`backend/src/hr/employee/employee.service.ts`)
   - Prefix: `EMP`
   - Chercher: `prisma.employee.create()`
   - Ajouter: `id: generateId(ID_PREFIXES.EMPLOYEE),`

2. **Product** (`backend/src/ecommerce/products/products.service.ts`)
   - Prefix: `PRD`
   - Chercher: `prisma.product.create()`
   - Ajouter: `id: generateId(ID_PREFIXES.PRODUCT),`

3. **Order** (`backend/src/ecommerce/orders/orders.service.ts`)
   - Prefix: `ORD`
   - Chercher: `prisma.order.create()`
   - Ajouter: `id: generateId(ID_PREFIXES.ORDER),`

4. **User** (`backend/src/common/auth/auth/auth.service.ts`)
   - Prefix: `USR`
   - Chercher: `prisma.user.create()`
   - Ajouter: `id: generateId(ID_PREFIXES.USER),`

5. **Supplier** (`backend/src/purchase/suppliers/suppliers.service.ts`)
   - Prefix: `SUP`
   - Chercher: `prisma.supplier.create()`
   - Ajouter: `id: generateId(ID_PREFIXES.SUPPLIER),`

#### 🟡 PRIORITÉ MOYENNE
- Contact → `CNT`
- Lead → `LED`
- Opportunity → `OPP`
- Account → `ACC`
- Contract → `CTR`
- PurchaseOrder → `POR`
- Equipment → `EQP`
- FixedAsset → `FAS`
- TreasuryAccount → `TRS`
- CreditAccount → `CRA`
- (Voir catalogue complet dans `id-prefixes.const.ts`)

#### 🟢 PRIORITÉ BASSE (Entités dérivées)
- AbsenceRecord → `ABS`
- AttendanceRecord → `ATN`
- PayrollRecord → `PAY`
- Meeting → `MTG`
- (Autres entités sans trafic élevé)

---

## 🔧 Template de Refactorisation par Service

### Avant (UUID)
```typescript
async create(createDto: CreateProductDto) {
  return this.prisma.product.create({
    data: {
      // ID généré automatiquement par @default(uuid())
      productName: createDto.productName,
      price: createDto.price,
      // ...
    },
  });
}
```

### Après (Custom ID)
```typescript
async create(createDto: CreateProductDto) {
  return this.prisma.product.create({
    data: {
      id: generateId(ID_PREFIXES.PRODUCT), // ✅ Ajouter
      productName: createDto.productName,
      price: createDto.price,
      // ...
    },
  });
}
```

---

## 🗄️ Migration de Base de Données

### Avant de déployer:
```sql
-- Faire un backup
pg_dump caapmedia_db > backup_before_id_refactor.sql

-- Optionnel: Créer une contrainte UNIQUE pour éviter collisions
ALTER TABLE employees ADD CONSTRAINT employees_id_unique UNIQUE (id);
ALTER TABLE products ADD CONSTRAINT products_id_unique UNIQUE (id);
ALTER TABLE orders ADD CONSTRAINT orders_id_unique UNIQUE (id);
-- ... pour toutes les entités principales
```

### Stratégie de Migration:
1. **Étape 1**: Déployer les changements de code (avec les deux systèmes en parallèle)
2. **Étape 2**: Écrire un script pour migrer les données existantes (UUID → ID custom)
3. **Étape 3**: Tester en staging
4. **Étape 4**: Déployer en production avec rollback plan

---

## 📊 Checklist de Refactorisation par Service

### ✅ Complétude
- [ ] `EmployeeService` - Ajouter `generateId(ID_PREFIXES.EMPLOYEE)`
- [ ] `ProductService` - Ajouter `generateId(ID_PREFIXES.PRODUCT)`
- [ ] `OrderService` - Ajouter `generateId(ID_PREFIXES.ORDER)`
- [ ] `UserService` - Ajouter `generateId(ID_PREFIXES.USER)`
- [ ] `SupplierService` - Ajouter `generateId(ID_PREFIXES.SUPPLIER)`
- [ ] `ContactService` - Ajouter `generateId(ID_PREFIXES.CONTACT)`
- [ ] `LeadService` - Ajouter `generateId(ID_PREFIXES.LEAD)`
- [ ] `OpportunityService` - Ajouter `generateId(ID_PREFIXES.OPPORTUNITY)`
- [ ] `AccountService` - Ajouter `generateId(ID_PREFIXES.ACCOUNT)`
- [ ] `ContractService` - Ajouter `generateId(ID_PREFIXES.CONTRACT)`
- [ ] `PurchaseOrderService` - Ajouter `generateId(ID_PREFIXES.PURCHASEORDER)`
- [ ] `EquipmentService` - Ajouter `generateId(ID_PREFIXES.EQUIPMENT)`
- [ ] Autres services (voir priorité basse)

---

## 🧪 Vérification Après Refactorisation

### Unit Tests
```bash
npm run test -- backend/src/common/utils/generate-id.util.spec.ts
```

### Tests d'intégration (exemple)
```typescript
describe('EmployeeService with Custom IDs', () => {
  it('should generate custom IDs for new employees', async () => {
    const employee = await employeeService.create({
      lastName: 'Doe',
      firstName: 'John',
      // ... autres champs
    });

    expect(employee.id).toMatch(/^EMP-[A-Z0-9]{9,}$/);
  });
});
```

### Vérification en Base de Données
```sql
-- Vérifier format des IDs générés
SELECT id, last_name FROM employees ORDER BY hire_date DESC LIMIT 10;
-- Résultat attendu: EMP-SNCM1AB, EMP-SNCM1XY2, etc.

-- Vérifier pas de collisions
SELECT id, COUNT(*) FROM employees GROUP BY id HAVING COUNT(*) > 1;
-- Résultat attendu: (vide)
```

---

## 📈 Performance & Avantages

| Aspect | Avant (UUID) | Après (Custom ID) |
|--------|------------|-------------------|
| **Taille** | 36 chars | ~10 chars |
| **Lisibilité** | ❌ `a7f3e4c9-...` | ✅ `EMP-SNCM1AB` |
| **Dépendances** | UUID native | Aucune |
| **Génération** | BD requise | App-side (O(1)) |
| **Ordre** | ❌ Non déterministe | ⚠️ Timestamp-based |
| **Identifiabilité** | ❌ Type inconnu | ✅ Visible dans l'ID |

---

## ⚠️ Points d'Attention

### Collisions
- **Théorie**: 46656 valeurs/ms (36^3) → collision ultra-rare
- **Mitigation**: Ajouter `UNIQUE` constraint en DB si critique
- **Monitoring**: Logger les collisions détectées

### Ordre des IDs
- Les IDs ne sont pas strictement ordonnés (timestamp en base36)
- Si besoin de tri: Ajouter `createdAt` avec index
- Prisma déjà le fait: `createdAt DateTime @default(now())`

### URLs Lisibles
- IDs maintenant lisibles → vérifier RBAC (déjà implémenté via `subsidiaryId`)
- Les users ne peuvent accéder que leurs données de subsidiary

---

## 🚀 Commandes Utiles

### Compiler & Tester
```bash
npm run build
npm run test
```

### Générer migration Prisma
```bash
npx prisma migrate dev --name refactor_ids_to_custom
```

### Vérifier les services non-refactorisés
```bash
grep -r "@default(uuid())" backend/src --include="*.ts"
grep -r "prisma\." backend/src --include="*.service.ts" | grep "\.create("
```

---

## 📚 Références

- **Fonction**: `backend/src/common/utils/generate-id.util.ts`
- **Préfixes**: `backend/src/common/constants/id-prefixes.const.ts`
- **Tests**: `backend/src/common/utils/generate-id.util.spec.ts`
- **Schéma**: `backend/prisma/schema.prisma` (déjà refactorisé)

---

## 🔄 Étapes Suivantes

1. ✅ Infrastructure complétée
2. ✅ Schéma Prisma refactorisé
3. **[EN COURS]** Refactoriser services (par priorité)
4. **[À FAIRE]** Migration de données existantes
5. **[À FAIRE]** Tests d'intégration complets
6. **[À FAIRE]** Déploiement en staging
7. **[À FAIRE]** Déploiement en production

---

**Dernier mise à jour**: 2026-07-16
**Auteur**: Refactoring Assistée - Claude Code
