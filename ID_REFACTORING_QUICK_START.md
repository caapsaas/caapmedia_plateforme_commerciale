# 🚀 Quick Start - Refactorisation des IDs

## Pour Continuer Rapidement

### 1️⃣ Imports à Ajouter (Partout)
```typescript
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
```

### 2️⃣ Pattern à Appliquer
Chercher chaque `async create(` et ajouter **UNE LIGNE**:
```typescript
async create(...) {
  return this.prisma.MODEL.create({
    data: {
      id: generateId(ID_PREFIXES.MODEL), // ← AJOUTER CETTE LIGNE
      ...otherData,
    },
  });
}
```

### 3️⃣ Services Prioritaires (Reste)
```
🔴 URGENT:
  - UserService (auth/auth/auth.service.ts)
  - SupplierService (purchase/suppliers/)

🟡 MOYEN:
  - ContactService
  - LeadService
  - OpportunityService
  - AccountService
  - ContractService
  - PurchaseOrderService
  
🟢 MOINS URGENT:
  - Equipment, Maintenance, AbsenceRecord, etc.
```

### 4️⃣ Command pour Trouver les Services
```bash
# Lister tous les .create( calls:
grep -r "\.create(" backend/src --include="*.service.ts" | grep "prisma\." | head -20
```

### 5️⃣ Tests
```bash
# Après chaque refactorisation:
npm run build
npm run test -- generate-id.util.spec.ts
```

### 6️⃣ Prefix Cheat Sheet
```typescript
EMP    Employee
PRD    Product
ORD    Order
USR    User
SUP    Supplier
CNT    Contact
LED    Lead
OPP    Opportunity
ACC    Account
CTR    Contract
POR    Purchase Order
TRS    Treasury Account
CRA    Credit Account
ABS    Absence Record
ATN    Attendance Record
PAY    Payroll Record
```

### 7️⃣ Vérification Post-Edit
```bash
# Vérifier format des IDs:
grep "generateId" backend/src/**/*.service.ts | wc -l  # Doit augmenter

# Vérifier plus de uuid():
grep "@default(uuid())" backend/src --include="*.ts"  # Doit être vide
```

---

## 💡 Tips Rapides

✅ **Copier-Coller**: La plupart des `.create()` sont identiques  
✅ **Find & Replace**: Chercher `prisma.MODEL.create` → ajouter id ligne  
✅ **Batch Edit**: VS Code peut éditer multi-fichiers  
✅ **Order Service**: 2 sites `.create()` à refactor (déjà fait)  

---

## ⏱️ Estimation Temps
- Par service: **2-3 minutes**
- 43 services total: **~2-3 heures** (copy-paste)
- Testing: **1 heure**
- Migration data: **2-4 heures** (script SQL)

---

## 🎯 Checkpoint après Refactorisation Complète
- [ ] 43/43 services ont `generateId()`
- [ ] Tous les `.create()` génèrent IDs custom
- [ ] Tests passent ✅
- [ ] Pas de régression
- [ ] Prêt pour migration data

---

## 📞 Questions?
- Voir **REFACTORING_ID_GUIDE.md** pour détails
- Voir **REFACTORING_SUMMARY.md** pour statut
