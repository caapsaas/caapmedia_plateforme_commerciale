import { PrismaClient, Gender, ContractType, EmployeeStatus, PaymentMethod, LeaveType, SalaryInputMode } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

const prisma = new PrismaClient();

export async function seedEmployees() {
  console.log('🌱 Seeding employees...');

  // Get first subsidiary (seeded by subsidiary seeder)
  const subsidiary = await prisma.subsidiary.findFirst();
  if (!subsidiary) {
    console.warn('No subsidiary found - employees require a subsidiary');
    return;
  }

  // Fixed seed employees with deterministic data
  // Using NET salary input mode to demonstrate the new gross-up feature
  const seedEmployeesData = [
    {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@caap.cm',
      department: 'Production',
      positions: 'Manager',
      gender: Gender.MALE,
      targetNetSalary: 130000, // Net salary target
    },
    {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@caap.cm',
      department: 'Finance',
      positions: 'Directeur',
      gender: Gender.FEMALE,
      targetNetSalary: 150000, // Net salary target
    },
    {
      firstName: 'Pierre',
      lastName: 'Bernard',
      email: 'pierre.bernard@caap.cm',
      department: 'Commercial',
      positions: 'Employé',
      gender: Gender.MALE,
      targetNetSalary: 110000, // Net salary target
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
        birthDate: new Date('1985-01-15'),
        address: '123 Rue Principale, Douala',
        phone: '+237 233 456 789',
        nationality: 'Camerounaise',
        socialSecurityNumber: Math.random().toString().substring(2, 15),
        positions: data.positions,
        department: data.department,
        hireDate: new Date('2020-01-15'),
        workLocation: 'Douala',
        baseSalary: 150000, // Default base salary (can be recalculated via API)
        bonus: 0,
        benefits: ['Assurance santé'],
        subsidiaryId: subsidiary.id,
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