"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTreasuryAccounts = seedTreasuryAccounts;
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("./generate-id.util");
const id_prefixes_const_1 = require("./id-prefixes.const");
const prisma = new client_1.PrismaClient();
async function seedTreasuryAccounts() {
    console.log('Début du seeding des comptes de trésorerie...');
    const subsidiaries = await prisma.subsidiary.findMany();
    if (subsidiaries.length === 0) {
        console.warn('Aucune filiale trouvée. Impossible de créer des comptes de trésorerie.');
        return;
    }
    const headquarter = subsidiaries.find((s) => s.isHeadquarter) ?? subsidiaries[0];
    const staleBankAccounts = await prisma.treasuryAccount.findMany({
        where: { accountType: client_1.AccountType.BANQUE, subsidiaryId: { not: headquarter.id } },
    });
    if (staleBankAccounts.length > 0) {
        await prisma.treasuryAccount.deleteMany({
            where: { id: { in: staleBankAccounts.map((a) => a.id) } },
        });
        console.log(`${staleBankAccounts.length} compte(s) BANQUE hors siège (pré-centralisation) supprimé(s).`);
    }
    const banks = [
        { name: 'Bank of Africa (BOA)', address: 'Avenue de la Réunification, Douala', phone: '+237 233 42 00 00', type: client_1.BankType.COMMERCIAL_BANK },
        { name: 'Orange Money Cameroun', address: 'Rue de l\'Hôtel de Ville, Douala', phone: '+237 233 50 00 00', type: client_1.BankType.COMMERCIAL_BANK },
    ];
    const bankByName = new Map();
    for (const bank of banks) {
        const created = await prisma.bank.upsert({
            where: { name: bank.name },
            update: {},
            create: { ...bank },
        });
        bankByName.set(bank.name, created.id);
    }
    const headquarterAccounts = [
        { accountName: 'Compte Bancaire BOA', balance: 160000, accountType: client_1.AccountType.BANQUE, bankId: bankByName.get('Bank of Africa (BOA)') },
        { accountName: 'Compte Mobile Money', balance: 150000, accountType: client_1.AccountType.BANQUE, bankId: bankByName.get('Orange Money Cameroun') },
        { accountName: 'Coffre-fort Central', balance: 500000, accountType: client_1.AccountType.SAFE, bankId: undefined },
    ];
    for (const acc of headquarterAccounts) {
        const existing = await prisma.treasuryAccount.findFirst({
            where: { accountName: acc.accountName, subsidiaryId: headquarter.id },
        });
        if (existing) {
            if (acc.bankId && !existing.bankId) {
                await prisma.treasuryAccount.update({ where: { id: existing.id }, data: { bankId: acc.bankId } });
                console.log(`Compte "${acc.accountName}" rattaché à sa banque.`);
            }
            else {
                console.log(`Le compte "${acc.accountName}" existe déjà au siège.`);
            }
            continue;
        }
        await prisma.treasuryAccount.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TREASURY),
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
    for (const subsidiary of subsidiaries) {
        const cashier = await prisma.user.findFirst({
            where: { subsidiaryId: subsidiary.id, userRole: 'CAISSIER' },
        });
        const perSubsidiaryAccounts = [
            { accountName: `${subsidiary.subsidiaryName} - Caisse de Vente`, legacyName: 'Caisse de Vente', balance: 30000, accountType: client_1.AccountType.CASH_REGISTER, cashierId: cashier?.id },
            { accountName: `${subsidiary.subsidiaryName} - Caisse Dépense`, legacyName: 'Caisse Dépense', balance: 20000, accountType: client_1.AccountType.EXPENSE_BOX },
        ];
        for (const acc of perSubsidiaryAccounts) {
            const existingAccount = await prisma.treasuryAccount.findFirst({
                where: { accountName: acc.accountName, subsidiaryId: subsidiary.id },
            });
            if (existingAccount) {
                console.log(`Le compte "${acc.accountName}" existe déjà pour la filiale ${subsidiary.subsidiaryName}.`);
                continue;
            }
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
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TREASURY),
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
//# sourceMappingURL=treasury.seeder.js.map