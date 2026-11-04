"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedEmployees = seedEmployees;
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("./generate-id.util");
const id_prefixes_const_1 = require("./id-prefixes.const");
const prisma = new client_1.PrismaClient();
async function seedEmployees() {
    console.log('🌱 Seeding employees...');
    const doualaSubsidiary = await prisma.subsidiary.findUnique({
        where: { email: 'contact.douala@caap.cm' },
    });
    if (!doualaSubsidiary) {
        console.warn('Douala subsidiary not found');
        return;
    }
    const seedEmployeesData = [
        {
            firstName: 'Alain',
            lastName: 'Tchana',
            email: 'alain.tchana@caap.cm',
            department: 'Direction',
            positions: 'Directeur Général',
            gender: client_1.Gender.MALE,
            targetNetSalary: 250000,
            bonus: 50000,
        },
        {
            firstName: 'Micheline',
            lastName: 'Nkouedeu',
            email: 'micheline.nkouedeu@caap.cm',
            department: 'Finance',
            positions: 'Directrice Financière',
            gender: client_1.Gender.FEMALE,
            targetNetSalary: 200000,
            bonus: 30000,
        },
        {
            firstName: 'André',
            lastName: 'Kamga',
            email: 'andre.kamga@caap.cm',
            department: 'Finance',
            positions: 'Comptable Senior',
            gender: client_1.Gender.MALE,
            targetNetSalary: 150000,
            bonus: 15000,
        },
        {
            firstName: 'Sandrine',
            lastName: 'Ekolle',
            email: 'sandrine.ekolle@caap.cm',
            department: 'Finance',
            positions: 'Assistant Comptable',
            gender: client_1.Gender.FEMALE,
            targetNetSalary: 95000,
            bonus: 0,
        },
        {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@caap.cm',
            department: 'Commercial',
            positions: 'Directeur Commercial',
            gender: client_1.Gender.MALE,
            targetNetSalary: 180000,
            bonus: 40000,
        },
        {
            firstName: 'Fatou',
            lastName: 'Diallo',
            email: 'fatou.diallo@caap.cm',
            department: 'Commercial',
            positions: 'Représentant Commerciale',
            gender: client_1.Gender.FEMALE,
            targetNetSalary: 110000,
            bonus: 20000,
        },
        {
            firstName: 'Xavier',
            lastName: 'Nkoumou',
            email: 'xavier.nkoumou@caap.cm',
            department: 'Commercial',
            positions: 'Représentant Commerciale',
            gender: client_1.Gender.MALE,
            targetNetSalary: 110000,
            bonus: 20000,
        },
        {
            firstName: 'Paul',
            lastName: 'Akam',
            email: 'paul.akam@caap.cm',
            department: 'Production',
            positions: 'Chef de Production',
            gender: client_1.Gender.MALE,
            targetNetSalary: 145000,
            bonus: 12000,
        },
        {
            firstName: 'Yvette',
            lastName: 'Banda',
            email: 'yvette.banda@caap.cm',
            department: 'Production',
            positions: 'Technicien Production',
            gender: client_1.Gender.FEMALE,
            targetNetSalary: 90000,
            bonus: 0,
        },
        {
            firstName: 'Claude',
            lastName: 'Mbodji',
            email: 'claude.mbodji@caap.cm',
            department: 'Production',
            positions: 'Technicien Production',
            gender: client_1.Gender.MALE,
            targetNetSalary: 90000,
            bonus: 0,
        },
        {
            firstName: 'Valérie',
            lastName: 'Ebara',
            email: 'valerie.ebara@caap.cm',
            department: 'Ressources Humaines',
            positions: 'Responsable RH',
            gender: client_1.Gender.FEMALE,
            targetNetSalary: 130000,
            bonus: 10000,
        },
        {
            firstName: 'Bernard',
            lastName: 'Njoh',
            email: 'bernard.njoh@caap.cm',
            department: 'Ressources Humaines',
            positions: 'Assistant RH',
            gender: client_1.Gender.MALE,
            targetNetSalary: 85000,
            bonus: 0,
        },
        {
            firstName: 'Roger',
            lastName: 'Yombi',
            email: 'roger.yombi@caap.cm',
            department: 'Informatique',
            positions: 'Responsable IT',
            gender: client_1.Gender.MALE,
            targetNetSalary: 140000,
            bonus: 15000,
        },
        {
            firstName: 'Nadine',
            lastName: 'Mani',
            email: 'nadine.mani@caap.cm',
            department: 'Informatique',
            positions: 'Technicien Support',
            gender: client_1.Gender.FEMALE,
            targetNetSalary: 95000,
            bonus: 0,
        },
        {
            firstName: 'Thierry',
            lastName: 'Dube',
            email: 'thierry.dube@caap.cm',
            department: 'Logistique',
            positions: 'Responsable Logistique',
            gender: client_1.Gender.MALE,
            targetNetSalary: 120000,
            bonus: 8000,
        },
    ];
    for (const data of seedEmployeesData) {
        await prisma.employee.upsert({
            where: { email: data.email },
            update: {
                department: data.department,
                positions: data.positions,
            },
            create: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEE),
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                birthDate: new Date('1990-01-15'),
                address: '123 Rue Principale, Douala',
                phone: '+237 233 456 789',
                nationality: 'Camerounaise',
                socialSecurityNumber: Math.random().toString().substring(2, 15),
                positions: data.positions,
                department: data.department,
                hireDate: new Date('2020-01-15'),
                workLocation: 'Douala',
                baseSalary: 150000,
                bonus: data.bonus || 0,
                benefits: ['Assurance santé', 'Mutuelle'],
                subsidiaryId: doualaSubsidiary.id,
                gender: data.gender,
                contractType: client_1.ContractType.CDI,
                status: client_1.EmployeeStatus.ACTIVE,
                paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
                salaryInputMode: client_1.SalaryInputMode.NET,
                targetNetSalary: data.targetNetSalary,
            },
        });
        console.log(`Employee ${data.email} seeded`);
    }
    const employees = await prisma.employee.findMany({
        where: { email: { in: seedEmployeesData.map(d => d.email) } },
    });
    const potentialManagers = employees.filter(emp => emp.positions.includes('Directeur') || emp.positions.includes('Manager'));
    for (const employee of employees) {
        if (potentialManagers.length > 0 && !potentialManagers.find(m => m.id === employee.id)) {
            const manager = potentialManagers[0];
            if (employee.managerId !== manager.id) {
                await prisma.employee.update({
                    where: { id: employee.id },
                    data: { managerId: manager.id },
                });
            }
        }
    }
    for (const employee of employees) {
        const leaveTypes = [client_1.LeaveType.ANNUAL, client_1.LeaveType.SICK];
        const leaveDays = { [client_1.LeaveType.ANNUAL]: 20, [client_1.LeaveType.SICK]: 10 };
        for (const leaveType of leaveTypes) {
            const existing = await prisma.employeeLeaveBalance.findFirst({
                where: { employeeId: employee.id, leaveType },
            });
            if (!existing) {
                await prisma.employeeLeaveBalance.create({
                    data: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EMPLOYEELEAVEBALANCE),
                        employeeId: employee.id,
                        leaveType,
                        days: leaveDays[leaveType],
                    },
                });
            }
        }
    }
    console.log(`✅ Created ${employees.length} employees`);
}
async function main() {
    try {
        await seedEmployees();
    }
    catch (error) {
        console.error('❌ Error seeding employees:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
exports.default = main;
//# sourceMappingURL=employee.seeder.js.map