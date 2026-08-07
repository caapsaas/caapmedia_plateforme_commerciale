import { PrismaClient, AccountType, BankType } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

const prisma = new PrismaClient();

// Comptes de trésorerie de démo, alignés sur l'architecture centralisée
// (voir TreasuryService.createAccount) :
// - BANQUE et SAFE (coffre-fort) n'existent qu'au siège, rattachés à une
//   banque physique réelle pour les comptes BANQUE.
// - CASH_REGISTER (caisse de vente/POS) et EXPENSE_BOX (caisse dépense)
//   existent par filiale ; CASH_REGISTER est assignée au CAISSIER de la
//   filiale quand il existe (voir user.seeder.ts), pour pouvoir tester le
//   flux de remise de caisse de bout en bout.
// - Le type CAISSE (caisse générale) a été fusionné dans CASH_REGISTER :
//   aucun flux métier ne les distinguait, seul CASH_REGISTER porte un
//   comportement réel (remise de caisse).
export async function seedTreasuryAccounts() {
  console.log('Début du seeding des comptes de trésorerie...');

  const subsidiaries = await prisma.subsidiary.findMany();

  if (subsidiaries.length === 0) {
    console.warn('Aucune filiale trouvée. Impossible de créer des comptes de trésorerie.');
    return;
  }

  const headquarter = subsidiaries.find((s) => s.isHeadquarter) ?? subsidiaries[0];

  // --- Nettoyage : les comptes BANQUE créés hors siège avant la
  // centralisation contredisent l'architecture actuelle (aucune transaction
  // ne les référence encore, suppression sans risque). ---
  const staleBankAccounts = await prisma.treasuryAccount.findMany({
    where: { accountType: AccountType.BANQUE, subsidiaryId: { not: headquarter.id } },
  });
  if (staleBankAccounts.length > 0) {
    await prisma.treasuryAccount.deleteMany({
      where: { id: { in: staleBankAccounts.map((a) => a.id) } },
    });
    console.log(`${staleBankAccounts.length} compte(s) BANQUE hors siège (pré-centralisation) supprimé(s).`);
  }

  // --- Banques physiques (institutions) ---
  const banks = [
    { name: 'Bank of Africa (BOA)', address: 'Avenue de la Réunification, Douala', phone: '+237 233 42 00 00', type: BankType.COMMERCIAL_BANK },
    { name: 'Orange Money Cameroun', address: 'Rue de l\'Hôtel de Ville, Douala', phone: '+237 233 50 00 00', type: BankType.COMMERCIAL_BANK },
  ];

  const bankByName = new Map<string, string>();
  for (const bank of banks) {
    const created = await prisma.bank.upsert({
      where: { name: bank.name },
      update: {},
      create: { ...bank },
    });
    bankByName.set(bank.name, created.id);
  }

  // --- Comptes BANQUE + SAFE (siège uniquement) ---
  const headquarterAccounts = [
    { accountName: 'Compte Bancaire BOA', balance: 160000, accountType: AccountType.BANQUE, bankId: bankByName.get('Bank of Africa (BOA)') },
    { accountName: 'Compte Mobile Money', balance: 150000, accountType: AccountType.BANQUE, bankId: bankByName.get('Orange Money Cameroun') },
    { accountName: 'Coffre-fort Central', balance: 500000, accountType: AccountType.SAFE, bankId: undefined },
  ];

  for (const acc of headquarterAccounts) {
    const existing = await prisma.treasuryAccount.findFirst({
      where: { accountName: acc.accountName, subsidiaryId: headquarter.id },
    });
    if (existing) {
      // Relie rétroactivement un compte BANQUE existant à sa banque si ce
      // n'était pas encore fait (comptes seedés avant l'entité Bank).
      if (acc.bankId && !existing.bankId) {
        await prisma.treasuryAccount.update({ where: { id: existing.id }, data: { bankId: acc.bankId } });
        console.log(`Compte "${acc.accountName}" rattaché à sa banque.`);
      } else {
        console.log(`Le compte "${acc.accountName}" existe déjà au siège.`);
      }
      continue;
    }
    await prisma.treasuryAccount.create({
      data: {
        id: generateId(ID_PREFIXES.TREASURY),
        accountName: acc.accountName,
        balance: acc.balance,
        initialBalance: acc.balance,
        currency: 'XOF',
        accountType: acc.accountType,
        subsidiaryId: headquarter.id,
        bankId: acc.bankId,
      },
    });
    console.log(`Compte "${acc.accountName}" créé au siège (${headquarter.subsidiaryName}).`);
  }

  // --- Comptes par filiale : CASH_REGISTER, EXPENSE_BOX ---
  // Noms préfixés par la filiale : sinon "Caisse de Vente" existe à
  // l'identique dans les 4 filiales et devient impossible à distinguer dans
  // une vue consolidée (Trésorerie, sélecteurs de compte...).
  for (const subsidiary of subsidiaries) {
    const cashier = await prisma.user.findFirst({
      where: { subsidiaryId: subsidiary.id, userRole: 'CAISSIER' },
    });

    const perSubsidiaryAccounts: {
      accountName: string;
      legacyName: string;
      balance: number;
      accountType: AccountType;
      cashierId?: string;
    }[] = [
      { accountName: `${subsidiary.subsidiaryName} - Caisse de Vente`, legacyName: 'Caisse de Vente', balance: 30000, accountType: AccountType.CASH_REGISTER, cashierId: cashier?.id },
      { accountName: `${subsidiary.subsidiaryName} - Caisse Dépense`, legacyName: 'Caisse Dépense', balance: 20000, accountType: AccountType.EXPENSE_BOX },
    ];

    for (const acc of perSubsidiaryAccounts) {
      const existingAccount = await prisma.treasuryAccount.findFirst({
        where: { accountName: acc.accountName, subsidiaryId: subsidiary.id },
      });

      if (existingAccount) {
        console.log(`Le compte "${acc.accountName}" existe déjà pour la filiale ${subsidiary.subsidiaryName}.`);
        continue;
      }

      // Compte créé avant l'introduction du préfixage par filiale (nom
      // générique) : renommé en place plutôt que dupliqué.
      const legacyAccount = await prisma.treasuryAccount.findFirst({
        where: { accountName: acc.legacyName, subsidiaryId: subsidiary.id, accountType: acc.accountType },
      });
      if (legacyAccount) {
        await prisma.treasuryAccount.update({
          where: { id: legacyAccount.id },
          data: { accountName: acc.accountName, cashierId: legacyAccount.cashierId ?? acc.cashierId },
        });
        console.log(`Compte "${acc.legacyName}" renommé en "${acc.accountName}" (${subsidiary.subsidiaryName}).`);
        continue;
      }

      await prisma.treasuryAccount.create({
        data: {
          id: generateId(ID_PREFIXES.TREASURY),
          accountName: acc.accountName,
          balance: acc.balance,
          initialBalance: acc.balance,
          currency: 'XOF',
          accountType: acc.accountType,
          subsidiaryId: subsidiary.id,
          cashierId: acc.cashierId,
        },
      });
      console.log(`Compte "${acc.accountName}" créé pour la filiale ${subsidiary.subsidiaryName}.`);
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
