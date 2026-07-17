import { PrismaClient, LeaveType } from '@prisma/client'
import { runSubsidiarySeeder } from './seeders/subsidiary.seeder';
import { runUserSeeder } from './seeders/user.seeder';
import { seedEmployees } from './seeders/employee.seeder';
import { runProductSeeder } from './seeders/product.seeder';
import { runContactSeeder } from './seeders/contact.seeder';
import { runEquipmentSeeder } from './seeders/equipement.seeder';
import { runTaxRateSeeder } from './seeders/tax_rate.seeder';
import { runOrdersSeeder } from './seeders/order.seeder';
import { seedTreasuryAccounts } from './seeders/treasury.seeder';
import { runSupplierSeeder } from './seeders/supplier.seeder';
import { runContactCitiesSeeder } from './seeders/contact-cities.seeder';
import { generateId } from './seeders/generate-id.util';
import { ID_PREFIXES } from './seeders/id-prefixes.const';

const prisma = new PrismaClient()

async function seedEmployeeLeaveBalances() {
    console.log('Seeding employee leave balances...');
    
    // Get all employees
    const employees = await prisma.employee.findMany();
    
    // Define default leave balances
    const defaultBalances = {
        [LeaveType.ANNUAL]: 20,
        [LeaveType.SICK]: 10,
        [LeaveType.PERSONAL]: 5,
        [LeaveType.MATERNITY]: 90,
        [LeaveType.PATERNITY]: 15,
        [LeaveType.OTHER]: 3,
    };
    
    for (const employee of employees) {
        for (const [leaveType, days] of Object.entries(defaultBalances)) {
            await prisma.employeeLeaveBalance.upsert({
                where: {
                    employeeId_leaveType: {
                        employeeId: employee.id,
                        leaveType: leaveType as LeaveType,
                    },
                },
                update: {},
                create: {
                    id: generateId(ID_PREFIXES.EMPLOYEELEAVEBALANCE),
                    employeeId: employee.id,
                    leaveType: leaveType as LeaveType,
                    days: days,
                },
            });
        }
    }
    
    console.log(`Created leave balances for ${employees.length} employees`);
}

async function main() {
    await runSubsidiarySeeder(prisma);
    await seedEmployees(); // Employees after subsidiary
    await runUserSeeder(prisma);
    await runProductSeeder(prisma);
    await runContactSeeder(prisma);
    await runContactCitiesSeeder(prisma); // Additional clients for Douala and Yaoundé
    await runEquipmentSeeder(prisma);
    await runTaxRateSeeder(prisma);
    await runOrdersSeeder(prisma);
    await runSupplierSeeder(prisma);
    await seedTreasuryAccounts();
    // Note: seedEmployeeLeaveBalances is already called inside seedEmployees()
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