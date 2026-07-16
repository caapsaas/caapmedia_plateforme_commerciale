import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

type SeedUser = {
  userName: string;
  email: string;
  password: string; // clair -> sera hashé
  userRole: string; // doit correspondre à ton enum UserRole
  subsidiaryEmail: string; // lien via email unique de Subsidiary
};

export async function runUserSeeder(prisma: PrismaClient) {
  const users: SeedUser[] = [
    {
      userName: 'Nalobert',
      email: 'nalobert@gmail.com',
      password: 'a1234578o',
      userRole: 'ADMIN',
      subsidiaryEmail: 'contact.douala@caap.cm',
    },
    {
      userName: 'Jean Commercial',
      email: 'jean.commercial@caap.cm',
      password: 'password',
      userRole: 'COMMERCIAL',
      subsidiaryEmail: 'contact.douala@caap.cm',
    },
    {
      userName: 'Marie Caissiere',
      email: 'marie.caissiere@caap.cm',
      password: 'password',
      userRole: 'CAISSIER',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
    },
    {
      userName: 'Serge Production',
      email: 'serge.production@caap.cm',
      password: 'password',
      userRole: 'PRODUCTION_DIRECTOR',
      subsidiaryEmail: 'contact.douala@caap.cm',
    },
    {
      userName: 'Stephanie  Secretaire',
      email: 'stephanie.secretaire@caap.cm',
      password: 'password',
      userRole: 'SECRETARY',
      subsidiaryEmail: 'contact.douala@caap.cm',
    },
    {
      userName: 'Richard Directeur Financier',
      email: 'richard.finance@caap.cm',
      password: 'password',
      userRole: 'FINANCIAL_DIRECTOR',
      subsidiaryEmail: 'contact.douala@caap.cm',
    },
    {
      userName: 'Louis Bernard rh',
      email: 'louis.rh@caap.cm',
      password: 'password',
      userRole: 'HR_MANAGER',
      subsidiaryEmail: 'contact.douala@caap.cm',
    },
    {
      userName: 'Richard Responsable Achats',
      email: 'richard.achats@caap.cm',
      password: 'password',
      userRole: 'PURCHASING_MANAGER',
      subsidiaryEmail: 'contact.douala@caap.cm',
    },
  ];

  for (const u of users) {
    const subsidiary = await prisma.subsidiary.findUnique({
      where: { email: u.subsidiaryEmail },
    });

    if (!subsidiary) {
      console.warn(
        `Subsidiary ${u.subsidiaryEmail} not found for user ${u.email}`,
      );
      continue;
    }

    const passwordHash = bcrypt.hashSync(u.password, 10);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        userName: u.userName,
        passwordHash,
        userRole: u.userRole as any,
        subsidiaryId: subsidiary.id,
      },
      create: {
        id: generateId(ID_PREFIXES.USER),
        userName: u.userName,
        email: u.email,
        passwordHash,
        userRole: u.userRole as any,
        subsidiaryId: subsidiary.id,
      },
    });
  }

  console.log('Users seeded');
}
