import { PrismaClient } from '@prisma/client';
import { ContactStatus, UserRole } from '@prisma/client';



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
            subsidiaryEmail: 'contact.yaounde@caap.cm',
            address: 'Bastos, Yaoundé',
            isVerified: true,
            status: ContactStatus.ACTIVE,
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
