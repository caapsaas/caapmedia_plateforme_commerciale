import { PrismaClient } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

export async function runSupplierSeeder(prisma: PrismaClient) {

    const MOCK_SUPPLIERS = [
        {
            supplierName: 'CAMTEL',
            company: 'Cameroon Telecommunications',
            email: 'contact@camtel.cm',
            phone: '2333330000',
            address: 'Yaoundé, Cameroun',
            subsidiaryEmail: 'contact.yaounde@caap.cm',
        },
        {
            supplierName: 'ORANGE',
            company: 'Orange Cameroun',
            email: 'fournisseurs@orange.cm',
            phone: '2333330001',
            address: 'Douala, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            supplierName: 'MTN',
            company: 'MTN Cameroun',
            email: 'business@mtn.cm',
            phone: '2333330002',
            address: 'Douala, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            supplierName: 'Eneo',
            company: 'Eneo Cameroon',
            email: 'fournisseurs@eneo.cm',
            phone: '2333330003',
            address: 'Douala, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            supplierName: 'CAMWATER',
            company: 'Cameroon Water Utilities',
            email: 'services@camwater.cm',
            phone: '2333330004',
            address: 'Yaoundé, Cameroun',
            subsidiaryEmail: 'contact.yaounde@caap.cm',
        },
        {
            supplierName: 'SONARA',
            company: 'Société Nationale de Raffinage',
            email: 'fournisseurs@sonara.cm',
            phone: '2333330005',
            address: 'Limbe, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            supplierName: 'ALUCAM',
            company: 'Aluminium Cameroun',
            email: 'business@alucam.cm',
            phone: '2333330006',
            address: 'Edéa, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            supplierName: 'CIMENCAM',
            company: 'Cimenteries du Cameroun',
            email: 'fournisseurs@cimencam.cm',
            phone: '2333330007',
            address: 'Douala, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            supplierName: 'CDC',
            company: 'Cameroon Development Corporation',
            email: 'suppliers@cdc.cm',
            phone: '2333330008',
            address: 'Bamenda, Cameroun',
            subsidiaryEmail: 'contact.yaounde@caap.cm',
        },
        {
            supplierName: 'AIR LIQUIDE',
            company: 'Air Liquide Cameroun',
            email: 'contact@airliquide.cm',
            phone: '2333330009',
            address: 'Douala, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            supplierName: 'GUINNESS',
            company: 'Guinness Cameroun',
            email: 'fournisseurs@guinness.cm',
            phone: '2333330010',
            address: 'Yaoundé, Cameroun',
            subsidiaryEmail: 'contact.yaounde@caap.cm',
        },
        {
            supplierName: 'CASTEL',
            company: 'Groupe Castel Cameroun',
            email: 'business@castel.cm',
            phone: '2333330011',
            address: 'Douala, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            supplierName: 'TCHIBOBO',
            company: 'Tchibobo Cameroun',
            email: 'fournisseurs@tchibobo.cm',
            phone: '2333330012',
            address: 'Bafoussam, Cameroun',
            subsidiaryEmail: 'contact.yaounde@caap.cm',
        },
        {
            supplierName: 'SOCATRAL',
            company: 'Société Camerounaise de Transformation',
            email: 'contact@socatral.cm',
            phone: '2333330013',
            address: 'Douala, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            supplierName: 'CHOCOCAM',
            company: 'Chococam',
            email: 'fournisseurs@chococam.cm',
            phone: '2333330014',
            address: 'Douala, Cameroun',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
    ];

    for (const s of MOCK_SUPPLIERS) {
        // Récupérer la filiale à partir de l'email
        const subsidiary = await prisma.subsidiary.findUnique({
            where: { email: s.subsidiaryEmail },
        });

        if (!subsidiary) {
            console.warn(`Subsidiary ${s.subsidiaryEmail} not found for supplier ${s.email}`);
            continue;
        }

        await prisma.supplier.upsert({
            where: { 
                supplierName_subsidiaryId: {
                    supplierName: s.supplierName,
                    subsidiaryId: subsidiary.id
                }
            },
            update: {
                company: s.company,
                email: s.email,
                phone: s.phone,
                address: s.address,
                subsidiaryId: subsidiary.id,
            },
            create: {
        id: generateId(ID_PREFIXES.SUPPLIER),
                supplierName: s.supplierName,
                company: s.company,
                email: s.email,
                phone: s.phone,
                address: s.address,
                subsidiaryId: subsidiary.id,
            },
        });
    }

    console.log('Suppliers seeded');
}
