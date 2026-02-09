import { PrismaClient } from '@prisma/client'
import { runSubsidiarySeeder } from './seeders/subsidiary.seeder';
import { runUserSeeder } from './seeders/user.seeder';
import { runProductSeeder } from './seeders/product.seeder';
import { runContactSeeder } from './seeders/contact.seeder';
import { runEquipmentSeeder } from './seeders/equipement.seeder';
import { runTaxRateSeeder } from './seeders/tax_rate.seeder';
import { runOrdersSeeder } from './seeders/order.seeder';
import { seedTreasuryAccounts } from './seeders/treasury.seeder';


const prisma = new PrismaClient()

async function main() {
    await runSubsidiarySeeder(prisma);
    await runUserSeeder(prisma);
    await runProductSeeder(prisma);
    await runContactSeeder(prisma);
    await runEquipmentSeeder(prisma);
    await runTaxRateSeeder(prisma);
    await runOrdersSeeder(prisma);
    await seedTreasuryAccounts();
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})