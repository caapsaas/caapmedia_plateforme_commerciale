import { PrismaClient, Gender, ContractType, EmployeeStatus, PaymentMethod, LeaveType, SalaryInputMode } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

const prisma = new PrismaClient();

export async function seedEmployees() {
  console.log('🌱 Seeding employees...');

  // Get Douala subsidiary by email
  const doualaSubsidiary = await prisma.subsidiary.findUnique({
    where: { email: 'contact.douala@caap.cm' },
  });
  if (!doualaSubsidiary) {
    console.warn('Douala subsidiary not found');
    return;
  }

  // Fixed seed employees with deterministic data
  // 15 employees for Douala subsidiary with varied positions
  const seedEmployeesData = [
    // Management
    {
      firstName: 'Alain',
      lastName: 'Tchana',
      email: 'alain.tchana@caap.cm',
      department: 'Direction',
      positions: 'Directeur Général',
      gender: Gender.MALE,
      targetNetSalary: 250000,
      bonus: 50000,
    },
    {
      firstName: 'Micheline',
      lastName: 'Nkouedeu',
      email: 'micheline.nkouedeu@caap.cm',
      department: 'Finance',
      positions: 'Directrice Financière',
      gender: Gender.FEMALE,
      targetNetSalary: 200000,
      bonus: 30000,
    },
    // Finance Team
    {
      firstName: 'André',
      lastName: 'Kamga',
      email: 'andre.kamga@caap.cm',
      department: 'Finance',
      positions: 'Comptable Senior',
      gender: Gender.MALE,
      targetNetSalary: 150000,
      bonus: 15000,
    },
    {
      firstName: 'Sandrine',
      lastName: 'Ekolle',
      email: 'sandrine.ekolle@caap.cm',
      department: 'Finance',
      positions: 'Assistant Comptable',
      gender: Gender.FEMALE,
      targetNetSalary: 95000,
      bonus: 0,
    },
    // Sales/Commercial Team
    {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@caap.cm',
      department: 'Commercial',
      positions: 'Directeur Commercial',
      gender: Gender.MALE,
      targetNetSalary: 180000,
      bonus: 40000,
    },
    {
      firstName: 'Fatou',
      lastName: 'Diallo',
      email: 'fatou.diallo@caap.cm',
      department: 'Commercial',
      positions: 'Représentant Commerciale',
      gender: Gender.FEMALE,
      targetNetSalary: 110000,
      bonus: 20000,
    },
    {
      firstName: 'Xavier',
      lastName: 'Nkoumou',
      email: 'xavier.nkoumou@caap.cm',
      department: 'Commercial',
      positions: 'Représentant Commerciale',
      gender: Gender.MALE,
      targetNetSalary: 110000,
      bonus: 20000,
    },
    // Production/Operations
    {
      firstName: 'Paul',
      lastName: 'Akam',
      email: 'paul.akam@caap.cm',
      department: 'Production',
      positions: 'Chef de Production',
      gender: Gender.MALE,
      targetNetSalary: 145000,
      bonus: 12000,
    },
    {
      firstName: 'Yvette',
      lastName: 'Banda',
      email: 'yvette.banda@caap.cm',
      department: 'Production',
      positions: 'Technicien Production',
      gender: Gender.FEMALE,
      targetNetSalary: 90000,
      bonus: 0,
    },
    {
      firstName: 'Claude',
      lastName: 'Mbodji',
      email: 'claude.mbodji@caap.cm',
      department: 'Production',
      positions: 'Technicien Production',
      gender: Gender.MALE,
      targetNetSalary: 90000,
      bonus: 0,
    },
    // HR/Admin
    {
      firstName: 'Valérie',
      lastName: 'Ebara',
      email: 'valerie.ebara@caap.cm',
      department: 'Ressources Humaines',
      positions: 'Responsable RH',
      gender: Gender.FEMALE,
      targetNetSalary: 130000,
      bonus: 10000,
    },
    {
      firstName: 'Bernard',
      lastName: 'Njoh',
      email: 'bernard.njoh@caap.cm',
      department: 'Ressources Humaines',
      positions: 'Assistant RH',
      gender: Gender.MALE,
      targetNetSalary: 85000,
      bonus: 0,
    },
    // IT/Systems
    {
      firstName: 'Roger',
      lastName: 'Yombi',
      email: 'roger.yombi@caap.cm',
      department: 'Informatique',
      positions: 'Responsable IT',
      gender: Gender.MALE,
      targetNetSalary: 140000,
      bonus: 15000,
    },
    {
      firstName: 'Nadine',
      lastName: 'Mani',
      email: 'nadine.mani@caap.cm',
      department: 'Informatique',
      positions: 'Technicien Support',
      gender: Gender.FEMALE,
      targetNetSalary: 95000,
      bonus: 0,
    },
    // Logistics
    {
      firstName: 'Thierry',
      lastName: 'Dube',
      email: 'thierry.dube@caap.cm',
      department: 'Logistique',
      positions: 'Responsable Logistique',
      gender: Gender.MALE,
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
        id: generateId(ID_PREFIXES.EMPLOYEE),
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
        baseSalary: 150000, // Default base salary (can be recalculated via API)
        bonus: data.bonus || 0,
        benefits: ['Assurance santé', 'Mutuelle'],
        subsidiaryId: doualaSubsidiary.id,
        gender: data.gender,
        contractType: ContractType.CDI,
        status: EmployeeStatus.ACTIVE,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        // New salary input mode fields
        salaryInputMode: SalaryInputMode.NET,
        targetNetSalary: data.targetNetSalary,
      },
    });
    console.log(`Employee ${data.email} seeded`);
  }

  // Fetch seeded employees
  const employees = await prisma.employee.findMany({
    where: { email: { in: seedEmployeesData.map(d => d.email) } },
  });

  // Set manager relationships
  const potentialManagers = employees.filter(emp =>
    emp.positions.includes('Directeur') || emp.positions.includes('Manager')
  );

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

  // Seed leave balances (only for seeded employees)
  for (const employee of employees) {
    const leaveTypes = [LeaveType.ANNUAL, LeaveType.SICK];
    const leaveDays = { [LeaveType.ANNUAL]: 20, [LeaveType.SICK]: 10 };

    for (const leaveType of leaveTypes) {
      const existing = await prisma.employeeLeaveBalance.findFirst({
        where: { employeeId: employee.id, leaveType },
      });

      if (!existing) {
        await prisma.employeeLeaveBalance.create({
          data: {
            id: generateId(ID_PREFIXES.EMPLOYEELEAVEBALANCE),
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

// Run the seeder
async function main() {
  try {
    await seedEmployees();
  } catch (error) {
    console.error('❌ Error seeding employees:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in main seeder
export default main;