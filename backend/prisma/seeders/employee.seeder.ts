import { PrismaClient, Gender, ContractType, EmployeeStatus, PaymentMethod, LeaveType, Employee } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function seedEmployees() {
  console.log('🌱 Seeding employees...');

  // Get or create subsidiary
  let subsidiary = await prisma.subsidiary.findFirst();
  
  if (!subsidiary) {
    subsidiary = await prisma.subsidiary.create({
      data: {
        id: generateId(ID_PREFIXES.EMPLOYEE),
        subsidiaryName: 'CAAP Media',
        logoSvg: '',
        address: '123 Rue Principale, Douala, Cameroun',
        phone: '+237 233 456 789',
        email: 'contact@caapmedia.cm',
        ifu: '123456789012',
        rccm: 'RCCM-DLA-2023-A12345',
        bankName: 'SCB Cameroun',
        accountNumber: 'CM0123456789012345678901234',
        swiftCode: 'SCMCAMCX',
        shareCapital: 1000000.00,
      },
    });
    console.log('✅ Created default subsidiary');
  }

  // Simple departments and positions
  const departments = ['Direction', 'Commercial', 'Production', 'Finance', 'RH'];
  const positions = ['Directeur', 'Manager', 'Employé', 'Assistant', 'Stagiaire'];

  // Clear existing employees and leave balances
  await prisma.employeeLeaveBalance.deleteMany({});
  await prisma.employee.deleteMany({});
  console.log('🗑️  Cleared existing employees');

  // Create employees
  const employees: Employee[] = [];
  const employeeCount = 15; // Reduced for simplicity

  for (let i = 0; i < employeeCount; i++) {
    const firstName = faker.person.firstName().substring(0, 15);
    const lastName = faker.person.lastName().substring(0, 15);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@caapmedia.cm`;
    
    const employee = await prisma.employee.create({
      data: {
        id: generateId(ID_PREFIXES.EMPLOYEE),
        lastName,
        firstName,
        birthDate: faker.date.birthdate({ min: 22, max: 60, mode: 'age' }),
        address: faker.location.streetAddress().substring(0, 200),
        phone: faker.phone.number().substring(0, 20),
        email: email.substring(0, 100),
        nationality: 'Camerounaise',
        socialSecurityNumber: faker.string.numeric(13),
        positions: faker.helpers.arrayElement(positions),
        department: faker.helpers.arrayElement(departments),
        hireDate: faker.date.past({ years: 5 }),
        workLocation: 'Douala',
        baseSalary: faker.number.float({ min: 50000, max: 500000, fractionDigits: 0 }),
        bonus: 0,
        benefits: ['Assurance santé'],
        subsidiaryId: subsidiary.id,
        gender: faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]),
        contractType: faker.helpers.arrayElement([ContractType.CDI, ContractType.CDD]),
        status: EmployeeStatus.ACTIVE,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      },
    });

    employees.push(employee);
  }

  // Set manager relationships (some employees report to others)
  const activeEmployees = employees.filter(emp => emp.status === EmployeeStatus.ACTIVE);
  const potentialManagers = activeEmployees.filter(emp => 
    emp.department === 'Direction' || 
    emp.positions.includes('Directeur') || 
    emp.positions.includes('Chef')
  );

  for (const employee of activeEmployees) {
    if (!potentialManagers.find(m => m.id === employee.id)) {
      const manager = faker.helpers.arrayElement(potentialManagers);
      await prisma.employee.update({
        where: { id: employee.id },
        data: { managerId: manager.id },
      });
    }
  }

  // Simple leave balances (only for active employees)
  for (const employee of activeEmployees) {
    try {
      await prisma.employeeLeaveBalance.createMany({
        data: [
          {
            id: generateId(ID_PREFIXES.EMPLOYEE),
            employeeId: employee.id,
            leaveType: LeaveType.ANNUAL,
            days: 20,
          },
          {
            employeeId: employee.id,
            leaveType: LeaveType.SICK,
            days: 10,
          }
        ],
        skipDuplicates: true,
      });
    } catch (error) {
      // Ignore duplicate errors
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