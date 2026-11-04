# Seeder des Employés - CAAP Media

Ce dossier contient le seeder pour peupler la table `employees` avec des données d'exemple.

## 📋 Contenu

- `employee.seeder.ts` : Script principal pour générer 25 employés avec des données réalistes
- `seed-employees.js` : Script alternatif pour exécution directe

## 🚀 Installation et Utilisation

### Prérequis

1. Assurez-vous que **@faker-js/faker** est installé :
   ```bash
   npm install @faker-js/faker
   ```

2. Assurez-vous que le client Prisma est généré :
   ```bash
   npx prisma generate
   ```

### Exécution

#### Option 1 : Via npm scripts (recommandé)

```bash
# Exécuter uniquement le seeder des employés
npm run seed:employees

# Exécuter tous les seeders
npm run seed
```

#### Option 2 : Directement avec ts-node

```bash
# Exécuter le seeder des employés
npx ts-node prisma/seeders/employee.seeder.ts

# Exécuter tous les seeders
npx ts-node prisma/seeds.ts
```

#### Option 3 : Via le script JavaScript

```bash
node scripts/seed-employees.js
```

## 📊 Données Générées

Le seeder crée :

### **25 Employés** avec :
- **Noms français réalistes** (Jean Martin, Marie Dubois, etc.)
- **8 départements** différents :
  - Direction Générale
  - Commercial
  - Production
  - Finance
  - Ressources Humaines
  - Marketing
  - Informatique
  - Logistique
- **Postes appropriés** pour chaque département
- **Informations complètes** :
  - Coordonnées (email, téléphone, adresse)
  - Informations contractuelles (CDI, CDD, Stage)
  - Salaire (2200€ - 8000€)
  - Avantages (mutuelle, tickets restaurant, etc.)
  - Statut (80% actifs, 10% en congé, 5% démissionnés, 5% licenciés)

### **Relations hiérarchiques** :
- Les employés ont des managers selon leur poste
- Les directeurs et chefs de poste deviennent managers

### **Soldes de congés** :
- **Congés annuels** : 15-25 jours
- **Congés maladie** : 5-15 jours
- **Congés personnels** : 2-10 jours
- **Congés maternité** : 60-120 jours
- **Congés paternité** : 10-20 jours
- **Autres congés** : 1-5 jours

### **Filiales** :
- Crée automatiquement une filiale par défaut "CAAP Douala" si aucune n'existe

## 🔧 Structure du Code

### Fonctions principales

```typescript
// Fonction principale d'initialisation
export async function seedEmployees()

// Point d'entrée pour exécution directe
async function main()
```

### Types utilisés

- `Employee` : Type Prisma pour les employés
- `Gender`, `ContractType`, `EmployeeStatus`, `PaymentMethod` : Enums Prisma
- `LeaveType` : Enum pour les types de congés

### Validation

Le seeder respecte les contraintes du DTO `CreateEmployeeDto` :
- **Validation des champs** (longueurs, types, formats)
- **Enums corrects** pour tous les champs énumérés
- **Relations** avec les filiales et managers

## 🛠️ Personnalisation

### Modifier le nombre d'employés

```typescript
const employeeCount = 25; // Changez cette valeur
```

### Ajouter de nouveaux départements

```typescript
const departments = [
  'Direction Générale',
  'Commercial',
  // Ajoutez vos départements ici
];
```

### Modifier les noms

Ajoutez des noms dans les tableaux `firstName` et `lastName` pour plus de variété.

## 🔍 Débogage

En cas d'erreur :

1. **Vérifiez la connexion à la base de données**
2. **Générez le client Prisma** : `npx prisma generate`
3. **Validez le schéma** : `npx prisma validate`
4. **Vérifiez les dépendances** : `npm install`

### Erreurs courantes

- **Module '@prisma/client' has no exported member** : Exécutez `npx prisma generate`
- **Relation field missing** : Vérifiez que le schéma est à jour avec `npx prisma db push`

## 📝 Notes

- Les emails sont générés au format : `prenom.nom@caapmedia.fr`
- Les numéros de téléphone sont français : `+33XXXXXXXXX`
- Les adresses sont générées aléatoirement mais réalistes
- Les salaires sont en euros et adaptés aux postes
- Tous les employés actifs ont des managers (sauf les dirigeants)

## 🔄 Intégration

Ce seeder est intégré au seeder principal dans `prisma/seeds.ts` et sera exécuté automatiquement lors de `npm run seed`.
