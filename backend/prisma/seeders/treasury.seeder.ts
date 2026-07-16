import { PrismaClient, AccountType } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

const prisma = new PrismaClient();

export async function seedTreasuryAccounts() {
  console.log('Début du seeding des comptes de trésorerie...');

  // 1. Récupérer toutes les filiales existantes
  // Les comptes de trésorerie doivent être liés à une filiale
  const subsidiaries = await prisma.subsidiary.findMany();

  if (subsidiaries.length === 0) {
    console.warn('Aucune filiale trouvée. Impossible de créer des comptes de trésorerie.');
    return;
  }

  // 2. Définir les comptes par défaut à créer pour chaque filiale
  const defaultAccounts = [
    {
      accountName: 'Caisse Principale',
      balance:50000,
      currency: 'XOF', // Franc CFA par défaut, à adapter selon vos besoins
      accountType: AccountType.CAISSE,
    },
    {
      accountName: 'Compte Bancaire BOA',
      balance: 160000,
      currency: 'XOF',
      accountType: AccountType.BANQUE,
    },
    {
      accountName: 'Compte Mobile Money',
      balance: 150000,
      currency: 'XOF',
      accountType: AccountType.BANQUE,
    },
  ];
   
  // 3. Boucler sur chaque filiale pour créer les comptes
  for (const subsidiary of subsidiaries) {
    for (const acc of defaultAccounts) {
      // Vérifier si le compte existe déjà pour éviter les doublons
      const existingAccount = await prisma.treasuryAccount.findFirst({
        where: {
          accountName: acc.accountName,
          subsidiaryId: subsidiary.id,
        },
      });

      if (!existingAccount) {
        await prisma.treasuryAccount.create({
          data: {
            id: generateId(ID_PREFIXES.TREASURY),
            accountName: acc.accountName,
            balance: acc.balance,
            currency: acc.currency,
            accountType: acc.accountType,
            subsidiaryId: subsidiary.id,
          },
        });
        console.log(`Compte "${acc.accountName}" créé pour la filiale ID: ${subsidiary.id}`);
      } else {
        console.log(`Le compte "${acc.accountName}" existe déjà pour la filiale ID: ${subsidiary.id}`);
      }
    }
  }

  console.log('Seeding des comptes de trésorerie terminé.');
}

// Permet d'exécuter ce fichier directement via ts-node
if (require.main === module) {
  seedTreasuryAccounts()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
