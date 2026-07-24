import { PrismaClient } from '@prisma/client';
import { ContactStatus, UserRole } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

// Helper to add ID if not present
function ensureContactId(contact: any) {
  if (!contact.id) {
    contact.id = generateId(ID_PREFIXES.CONTACT);
  }
  return contact;
}

export async function runContactSeeder(prisma: PrismaClient) {

    const MOCK_CONTACTS = [
        {
            contactName: 'NANTCHA, Louis Bernard',
            company: 'Individuel',
            email: 'louis.nantcha@example.com',
            phone: '699887766',
            since: '2023-01-15',
            subsidiaryEmail: 'contact.douala@caap.cm',
            address: 'Bonapriso, Douala',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'jean.commercial@caap.cm',
        },
        {
            contactName: 'NATA, hard',
            company: 'Caapfar',
            email: 'hard.nata@example.com',
            phone: '677665544',
            since: '2023-03-22',
            subsidiaryEmail: 'contact.douala@caap.cm',
            address: 'Akwa, Douala',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'jean.commercial@caap.cm',
        },
        {
            contactName: 'SOKAMTE, Frank',
            company: 'Sokamte Sarl',
            email: 'frank.sokamte@example.com',
            phone: '655443322',
            since: '2024-02-10',
            subsidiaryEmail: 'contact.kribi@caap.cm',
            address: 'Centre-ville, Kribi',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'commercial.kribi@caap.cm',
        },
        {
            contactName: 'KAMDEM, Paul',
            company: 'Individuel',
            email: 'paul.kamdem@example.com',
            phone: '698765432',
            since: '2024-05-01',
            subsidiaryEmail: 'contact.douala@caap.cm',
            address: 'Bonaberi, Douala',
            isVerified: true,
            status: ContactStatus.PROSPECT,
            salesRepEmail: 'jean.commercial@caap.cm',
        },
             {
            contactName: 'DUPONT, Marie',
            company: 'Dupont Entreprises',
            email: 'marie.dupont@dupont-entreprises.com',
            phone: '699123456',
            since: '2023-01-15',
            subsidiaryEmail: 'contact.douala@caap.cm',
            address: 'Rue de la République, Douala',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'jean.commercial@caap.cm',
        },
        {
            contactName: 'MBARGA, Jean-Pierre',
            company: 'MBARGA Trading',
            email: 'jp.mbarga@mbarga-trading.com',
            phone: '677987654',
            since: '2023-02-20',
            subsidiaryEmail: 'contact.douala@caap.cm',
            address: 'Bonapriso, Douala',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'jean.commercial@caap.cm',
        },
        {
            contactName: 'TCHOUPO, Sophie',
            company: 'Sophie Beauty Salon',
            email: 'sophie.tchoupe@beauty-salon.cm',
            phone: '655456789',
            since: '2023-03-10',
            subsidiaryEmail: 'contact.edea@caap.cm',
            address: 'Centre-ville, Edéa',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'commercial.edea@caap.cm',
        },
        {
            contactName: 'FOKO, Roger',
            company: 'Foko Construction',
            email: 'roger.foko@foko-construction.com',
            phone: '698321654',
            since: '2023-04-05',
            subsidiaryEmail: 'contact.douala@caap.cm',
            address: 'Makepé, Douala',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'jean.commercial@caap.cm',
        },
        {
            contactName: 'NGUEGUIM, Catherine',
            company: 'Catherine Fashion',
            email: 'catherine.ngueguim@fashion.cm',
            phone: '676789012',
            since: '2023-05-12',
            subsidiaryEmail: 'contact.kribi@caap.cm',
            address: 'Plage de Kribi, Kribi',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'commercial.kribi@caap.cm',
        },
        {
            contactName: 'KAMGA, Michel',
            company: 'Kamga Technologies',
            email: 'michel.kamga@kamga-tech.com',
            phone: '691234567',
            since: '2023-06-18',
            subsidiaryEmail: 'contact.douala@caap.cm',
            address: 'Akwa, Douala',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'jean.commercial@caap.cm',
        },
        {
            contactName: 'ETOUNDI, Esther',
            company: 'Esther Restaurant',
            email: 'esther.etoundi@restaurant.cm',
            phone: '678901234',
            since: '2023-07-22',
            subsidiaryEmail: 'contact.edea@caap.cm',
            address: 'Zone Industrielle, Edéa',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'commercial.edea@caap.cm',
        },
        {
            contactName: 'OBOU, François',
            company: 'Obou Auto Services',
            email: 'francois.obou@auto-services.cm',
            phone: '693456789',
            since: '2023-08-30',
            subsidiaryEmail: 'contact.douala@caap.cm',
            address: 'Deïdo, Douala',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'jean.commercial@caap.cm',
        },
        {
            contactName: 'MEVA, Alice',
            company: 'Meva Consulting',
            email: 'alice.meva@consulting.cm',
            phone: '697890123',
            since: '2023-09-14',
            subsidiaryEmail: 'contact.kribi@caap.cm',
            address: 'Zone Portuaire, Kribi',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'commercial.kribi@caap.cm',
        },
        {
            contactName: 'TANKEU, Paul',
            company: 'Tankeu Logistics',
            email: 'paul.tankeu@logistics.cm',
            phone: '692345678',
            since: '2023-10-25',
            subsidiaryEmail: 'contact.douala@caap.cm',
            address: 'Bassa, Douala',
            isVerified: true,
            status: ContactStatus.ACTIVE,
            salesRepEmail: 'jean.commercial@caap.cm',
        },
    ];


    for (const c of MOCK_CONTACTS) {
        // Récupérer la filiale à partir de l'email
        const subsidiary = await prisma.subsidiary.findUnique({
            where: { email: c.subsidiaryEmail },
        });

        if (!subsidiary) {
            console.warn(`Subsidiary ${c.subsidiaryEmail} not found for contact ${c.email}`);
            continue;
        }

        // Récupérer le commercial si défini
        let salesRepId: string | undefined = undefined;
        if (c.salesRepEmail) {
            const salesRep = await prisma.user.findFirst({
                where: {
                    email: c.salesRepEmail,
                    userRole: UserRole.COMMERCIAL, // ne prend que les commerciaux
                },
            });
            if (!salesRep) {
                console.warn(`Sales rep ${c.salesRepEmail} not found or not COMMERCIAL`);
            } else {
                salesRepId = salesRep.id;
            }
        }

        await prisma.contact.upsert({
            where: { email: c.email },
            update: {
                contactName: c.contactName,
                company: c.company,
                phone: c.phone,
                since: new Date(c.since),
                address: c.address,
                isVerified: c.isVerified,
                status: c.status,
                salesRepId,
                subsidiaryId: subsidiary.id,
            },
            create: {
                id: generateId(ID_PREFIXES.CONTACT),
                contactName: c.contactName,
                company: c.company,
                email: c.email,
                phone: c.phone,
                since: new Date(c.since),
                address: c.address,
                isVerified: c.isVerified,
                status: c.status,
                salesRepId,
                subsidiaryId: subsidiary.id,
                passwordHash: '', // mettre un hash si nécessaire
            },
        });
    }

    console.log('Contacts seeded');
}
