import { PrismaClient } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

// Architecture de reference multi-filiale (voir Doc/architecture-multi-filiale-auth-rbac.md):
// - CAAP Siege (isHeadquarter: true) porte le SUPER_ADMIN. Un SUPER_ADMIN a
//   quand meme besoin d'une subsidiaryId (colonne non-nullable sur User) -
//   le siege lui sert de rattachement technique sans casser le modele
//   multi-filiale, exactement comme un ADMIN de filiale classique.
// - CAAP Douala, Kribi, Edea sont des filiales operationnelles "normales":
//   leur ADMIN ne voit que les donnees de SA filiale, jamais les autres -
//   y compris l'ADMIN du siege, qui ne voit que le siege. Seul le
//   SUPER_ADMIN a la vue consolidee (avec filtre par filiale), resolue cote
//   backend via subsidiary-scope.ts, pas par une page dediee.
export async function runSubsidiarySeeder(prisma: PrismaClient) {
    const subsidiaries = [
        {
            id: generateId(ID_PREFIXES.SUBSIDIARY),
            subsidiaryName: 'CAAP Douala',
            logoSvg: '<svg>...</svg>',
            address: 'CAAP Douala',
            phone: '+237 233 42 00 00',
            email: 'contact.douala@caap.cm',
            ifu: 'M123456789012',
            rccm: 'RC/DLA/2023/A/1234',
            bankName: 'Afriland First Bank',
            accountNumber: '10001 00002 12345678901 25',
            swiftCode: 'AFRCMCX',
            shareCapital: 10000000.00,
            isHeadquarter: false,
        },
        {
            id: generateId(ID_PREFIXES.SUBSIDIARY),
            subsidiaryName: 'CAAP Siège',
            logoSvg: '<svg>...</svg>',
            address: 'Boulevard de la Liberté, Douala',
            phone: '+237 233 40 00 00',
            email: 'contact.siege@caap.cm',
            ifu: 'M111222333444',
            rccm: 'RC/DLA/2023/A/0001',
            bankName: 'Afriland First Bank',
            accountNumber: '10001 00001 00000000001 11',
            swiftCode: 'AFRCMCX',
            shareCapital: 20000000.00,
            isHeadquarter: true,
        },
        {
            id: generateId(ID_PREFIXES.SUBSIDIARY),
            subsidiaryName: 'CAAP Kribi',
            logoSvg: '<svg>...</svg>',
            address: 'CAAP Kribi',
            phone: '+237 233 46 00 00',
            email: 'contact.kribi@caap.cm',
            ifu: 'M222333444555',
            rccm: 'RC/KRI/2023/A/2222',
            bankName: 'Société Générale Cameroun',
            accountNumber: '30001 00004 33344455566 44',
            swiftCode: 'SGCMCMCX',
            shareCapital: 3000000.00,
            isHeadquarter: false,
        },
        {
            id: generateId(ID_PREFIXES.SUBSIDIARY),
            subsidiaryName: 'CAAP Edéa',
            logoSvg: '<svg>...</svg>',
            address: 'CAAP Edéa',
            phone: '+237 233 45 00 00',
            email: 'contact.edea@caap.cm',
            ifu: 'M333444555666',
            rccm: 'RC/EDA/2023/A/3333',
            bankName: 'Société Générale Cameroun',
            accountNumber: '30001 00005 44455566677 55',
            swiftCode: 'SGCMCMCX',
            shareCapital: 3000000.00,
            isHeadquarter: false,
        },
    ];

    for (const { id, ...updateData } of subsidiaries) {
        await prisma.subsidiary.upsert({
            where: { email: updateData.email }, // email est unique
            update: updateData,
            create: { id, ...updateData },
        });
    }

    console.log('Subsidiaries seeded (Douala, Siège, Kribi, Edéa)');
}
