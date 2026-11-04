"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const subsidiary_seeder_1 = require("./seeders/subsidiary.seeder");
const user_seeder_1 = require("./seeders/user.seeder");
const product_seeder_1 = require("./seeders/product.seeder");
const product_specs_seeder_1 = require("./seeders/product-specs.seeder");
const equipement_seeder_1 = require("./seeders/equipement.seeder");
const tax_rate_seeder_1 = require("./seeders/tax_rate.seeder");
const purchase_order_seeder_1 = require("./seeders/purchase-order.seeder");
const prisma = new client_1.PrismaClient();
async function seedEmployeeLeaveBalances() {
    console.log('Seeding employee leave balances...');
    const employees = await prisma.employee.findMany();
    const defaultBalances = {
        [client_1.LeaveType.ANNUAL]: 20,
        [client_1.LeaveType.SICK]: 10,
        [client_1.LeaveType.PERSONAL]: 5,
        [client_1.LeaveType.MATERNITY]: 90,
        [client_1.LeaveType.PATERNITY]: 15,
        [client_1.LeaveType.OTHER]: 3,
    };
    for (const employee of employees) {
        for (const [leaveType, days] of Object.entries(defaultBalances)) {
            await prisma.employeeLeaveBalance.upsert({
                where: {
                    employeeId_leaveType: {
                        employeeId: employee.id,
                        leaveType: leaveType,
                    },
                },
                update: {},
                create: {
                    id: `${employee.id}-${leaveType}`,
                    employeeId: employee.id,
                    leaveType: leaveType,
                    days: days,
                },
            });
        }
    }
    console.log(`Created leave balances for ${employees.length} employees`);
}
async function main() {
    await (0, subsidiary_seeder_1.runSubsidiarySeeder)(prisma);
    await (0, user_seeder_1.runUserSeeder)(prisma);
    await (0, product_seeder_1.runProductSeeder)(prisma);
    await (0, product_specs_seeder_1.runProductSpecsSeeder)(prisma);
    await (0, equipement_seeder_1.runEquipmentSeeder)(prisma);
    await (0, tax_rate_seeder_1.runTaxRateSeeder)(prisma);
    await (0, purchase_order_seeder_1.runPurchaseOrderSeeder)(prisma);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seeds.js.map