import { PrismaClient } from '@prisma/client';
import { ContactStatus } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

export async function runContactCitiesSeeder(prisma: PrismaClient) {
  const DOUALA_CLIENTS = [
    {
      contactName: 'DOUALA PRINTING SERVICES',
      company: 'Douala Printing Services',
      email: 'douala.printing@example.com',
      phone: '679123456',
      since: '2023-01-10',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'Bonanjo, Douala',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'AKWA COMMERCIAL ZONE',
      company: 'Akwa Enterprises',
      email: 'akwa.enterprises@example.com',
      phone: '677654321',
      since: '2023-02-15',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'Akwa, Douala',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },    
    {
      contactName: 'BONAPRISO DISTRIBUTION CENTER',
      company: 'Bonapriso Trade',
      email: 'bonapriso.trade@example.com',
      phone: '678987654',
      since: '2023-03-20',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'Bonapriso, Douala',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'MAKEPÉ MARKET TRADERS',
      company: 'Makepé Market Group',
      email: 'makepe.market@example.com',
      phone: '699456789',
      since: '2023-04-05',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'Makepé, Douala',
      isVerified: true,
      status: ContactStatus.PROSPECT,
    },
    {
      contactName: 'DEÏDO LOGISTICS COMPANY',
      company: 'Deïdo Logistics',
      email: 'deido.logistics@example.com',
      phone: '680123456',
      since: '2023-05-12',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'Deïdo, Douala',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'BASSA INDUSTRIAL PARK',
      company: 'Bassa Industries',
      email: 'bassa.industries@example.com',
      phone: '681234567',
      since: '2023-06-18',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'Bassa, Douala',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'BONABERI SMALL BUSINESS ASSOCIATION',
      company: 'Bonaberi SME',
      email: 'bonaberi.sme@example.com',
      phone: '691567890',
      since: '2023-07-22',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'Bonaberi, Douala',
      isVerified: false,
      status: ContactStatus.PROSPECT,
    },
    {
      contactName: 'NEW BELL SHOPPING DISTRICT',
      company: 'New Bell Retailers',
      email: 'newbell.retail@example.com',
      phone: '692678901',
      since: '2023-08-30',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'New Bell, Douala',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'CITE CIV BUSINESS UNIT',
      company: 'Cité CIV Trading',
      email: 'cite.civ@example.com',
      phone: '693789012',
      since: '2023-09-14',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'Cité CIV, Douala',
      isVerified: true,
      status: ContactStatus.PROSPECT,
    },
    {
      contactName: 'DOUALA PORT ZONE SERVICES',
      company: 'Port Zone Services',
      email: 'port.zone@example.com',
      phone: '694890123',
      since: '2023-10-25',
      subsidiaryEmail: 'contact.douala@caap.cm',
      address: 'Douala Port, Douala',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
  ];

  const YAOUNDE_CLIENTS = [
    {
      contactName: 'YAOUNDE ADMINISTRATIVE CENTER',
      company: 'Yaoundé Admin Services',
      email: 'yaounde.admin@example.com',
      phone: '655123456',
      since: '2023-01-08',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Bastos, Yaoundé',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'BASTOS BUSINESS HUB',
      company: 'Bastos Commerce',
      email: 'bastos.commerce@example.com',
      phone: '656234567',
      since: '2023-02-14',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Bastos, Yaoundé',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'CENTRE-VILLE GOVERNMENT SERVICES',
      company: 'Gouvernance Services',
      email: 'centre.ville@example.com',
      phone: '657345678',
      since: '2023-03-19',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Centre-ville, Yaoundé',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'MOKOLO MARKET ASSOCIATION',
      company: 'Mokolo Traders',
      email: 'mokolo.traders@example.com',
      phone: '658456789',
      since: '2023-04-03',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Mokolo, Yaoundé',
      isVerified: true,
      status: ContactStatus.PROSPECT,
    },
    {
      contactName: 'NLONGKAK DEVELOPMENT ZONE',
      company: 'Nlongkak Development',
      email: 'nlongkak.dev@example.com',
      phone: '659567890',
      since: '2023-05-11',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Nlongkak, Yaoundé',
      isVerified: false,
      status: ContactStatus.PROSPECT,
    },
    {
      contactName: 'MFOUNDI COMMERCIAL CENTER',
      company: 'Mfoundi Commerce',
      email: 'mfoundi.commerce@example.com',
      phone: '660678901',
      since: '2023-06-17',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Mfoundi, Yaoundé',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'KONDENGUI INDUSTRIAL ZONE',
      company: 'Kondengui Industries',
      email: 'kondengui.industry@example.com',
      phone: '661789012',
      since: '2023-07-21',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Kondengui, Yaoundé',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'ESSOS NEIGHBORHOOD ENTERPRISE',
      company: 'Essos Enterprises',
      email: 'essos.enterprise@example.com',
      phone: '662890123',
      since: '2023-08-29',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Essos, Yaoundé',
      isVerified: true,
      status: ContactStatus.PROSPECT,
    },
    {
      contactName: 'NKOMKANA TRANSPORTATION SERVICES',
      company: 'Nkomkana Transport',
      email: 'nkomkana.transport@example.com',
      phone: '663901234',
      since: '2023-09-13',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Nkomkana, Yaoundé',
      isVerified: true,
      status: ContactStatus.ACTIVE,
    },
    {
      contactName: 'ELIG-ESSONO SUBURBAN MARKET',
      company: 'Elig-Essono Market',
      email: 'elig.essono@example.com',
      phone: '664012345',
      since: '2023-10-24',
      subsidiaryEmail: 'contact.yaounde@caap.cm',
      address: 'Elig-Essono, Yaoundé',
      isVerified: false,
      status: ContactStatus.PROSPECT,
    },
  ];

  // Insérer les clients de Douala
  for (const contact of DOUALA_CLIENTS) {
    const subsidiary = await prisma.subsidiary.findUnique({
      where: { email: contact.subsidiaryEmail },
    });

    if (!subsidiary) {
      console.warn(`Subsidiary ${contact.subsidiaryEmail} not found for contact ${contact.email}`);
      continue;
    }

    await prisma.contact.upsert({
      where: { email: contact.email },
      update: {
        contactName: contact.contactName,
        company: contact.company,
        phone: contact.phone,
        since: new Date(contact.since),
        address: contact.address,
        isVerified: contact.isVerified,
        status: contact.status,
      },
      create: {
        id: generateId(ID_PREFIXES.CONTACT),
        contactName: contact.contactName,
        company: contact.company,
        email: contact.email,
        phone: contact.phone,
        since: new Date(contact.since),
        address: contact.address,
        isVerified: contact.isVerified,
        status: contact.status,
        subsidiaryId: subsidiary.id,
        passwordHash: '',
      },
    });
    console.log(`✓ Created/Updated Douala contact: ${contact.contactName}`);
  }

  // Insérer les clients de Yaoundé
  for (const contact of YAOUNDE_CLIENTS) {
    const subsidiary = await prisma.subsidiary.findUnique({
      where: { email: contact.subsidiaryEmail },
    });

    if (!subsidiary) {
      console.warn(`Subsidiary ${contact.subsidiaryEmail} not found for contact ${contact.email}`);
      continue;
    }

    await prisma.contact.upsert({
      where: { email: contact.email },
      update: {
        contactName: contact.contactName,
        company: contact.company,
        phone: contact.phone,
        since: new Date(contact.since),
        address: contact.address,
        isVerified: contact.isVerified,
        status: contact.status,
      },
      create: {
        id: generateId(ID_PREFIXES.CONTACT),
        contactName: contact.contactName,
        company: contact.company,
        email: contact.email,
        phone: contact.phone,
        since: new Date(contact.since),
        address: contact.address,
        isVerified: contact.isVerified,
        status: contact.status,
        subsidiaryId: subsidiary.id,
        passwordHash: '',
      },
    });
    console.log(`✓ Created/Updated Yaoundé contact: ${contact.contactName}`);
  }

  console.log('✅ Douala and Yaoundé clients seeded successfully!');
}
