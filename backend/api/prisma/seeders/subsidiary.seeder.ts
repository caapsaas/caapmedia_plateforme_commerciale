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
