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

// Un seul utilisateur porte le role SUPER_ADMIN (nalobert, rattache au
// siège) - c'est le seul a avoir la vue consolidee toutes filiales. Chaque
// filiale (y compris le siège) a son propre ADMIN, qui ne voit que SA
// filiale: ca permet d'observer concretement la difference entre les deux
// niveaux d'acces (voir Doc/architecture-multi-filiale-auth-rbac.md).
export async function runUserSeeder(prisma: PrismaClient) {
  const users: SeedUser[] = [
    // --- Siège (HQ) ---
    {
      userName: 'Nalobert',
      email: 'nalobert@gmail.com',
      password: 'a1234578o',
      userRole: 'SUPER_ADMIN',
      subsidiaryEmail: 'contact.siege@caap.cm',
    },
    {
      userName: 'Aline Admin Siège',
      email: 'admin.siege@caap.cm',
      password: 'password',
      userRole: 'ADMIN',
      subsidiaryEmail: 'contact.siege@caap.cm',
    },
    {
      // Un FINANCIAL_DIRECTOR par filiale (y compris siège) — nécessaire pour
      // tester le décaissement Caisse dépense et la réception des remises de
      // caisse (voir treasury.seeder.ts), rôles réservés à ce poste.
      userName: 'Emmanuel Directeur Financier Siège',
      email: 'emmanuel.finance@caap.cm',
      password: 'password',
      userRole: 'FINANCIAL_DIRECTOR',
      subsidiaryEmail: 'contact.siege@caap.cm',
    },
    {
      userName: 'Christelle Caissière Siège',
      email: 'christelle.caissiere@caap.cm',
      password: 'password',
      userRole: 'CAISSIER',
      subsidiaryEmail: 'contact.siege@caap.cm',
    },
    // --- Douala ---
    {
      userName: 'Paul Admin Douala',
      email: 'admin.douala@caap.cm',
      password: 'password',
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
      userName: 'Fatou Caissière Douala',
      email: 'fatou.caissiere@caap.cm',
      password: 'password',
      userRole: 'CAISSIER',
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
    // --- Kribi ---
    {
      userName: 'Brice Admin Kribi',
      email: 'admin.kribi@caap.cm',
      password: 'password',
      userRole: 'ADMIN',
      subsidiaryEmail: 'contact.kribi@caap.cm',
    },
    {
      userName: 'Junior Commercial Kribi',
      email: 'commercial.kribi@caap.cm',
      password: 'password',
      userRole: 'COMMERCIAL',
      subsidiaryEmail: 'contact.kribi@caap.cm',
    },
    {
      // Anciennement rattachee a CAAP Yaoundé (filiale supprimee) - reprend
      // le meme role a Kribi pour ne pas perdre ce compte de demo.
      userName: 'Marie Caissiere',
      email: 'marie.caissiere@caap.cm',
      password: 'password',
      userRole: 'CAISSIER',
      subsidiaryEmail: 'contact.kribi@caap.cm',
    },
    {
      userName: 'Brice Directeur Financier Kribi',
      email: 'brice.finance@caap.cm',
      password: 'password',
      userRole: 'FINANCIAL_DIRECTOR',
      subsidiaryEmail: 'contact.kribi@caap.cm',
    },
    // --- Edéa ---
    {
      userName: 'Carine Admin Edéa',
      email: 'admin.edea@caap.cm',
      password: 'password',
      userRole: 'ADMIN',
      subsidiaryEmail: 'contact.edea@caap.cm',
    },
    {
      userName: 'Sandrine Commercial Edéa',
      email: 'commercial.edea@caap.cm',
      password: 'password',
      userRole: 'COMMERCIAL',
      subsidiaryEmail: 'contact.edea@caap.cm',
    },
    {
      userName: 'Odette Caissière Edéa',
      email: 'caissier.edea@caap.cm',
      password: 'password',
      userRole: 'CAISSIER',
      subsidiaryEmail: 'contact.edea@caap.cm',
    },
    {
      userName: 'Carole Directeur Financier Edéa',
      email: 'carole.finance@caap.cm',
      password: 'password',
      userRole: 'FINANCIAL_DIRECTOR',
      subsidiaryEmail: 'contact.edea@caap.cm',
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
