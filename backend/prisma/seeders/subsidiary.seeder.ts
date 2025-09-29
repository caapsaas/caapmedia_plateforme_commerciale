import { PrismaClient } from '@prisma/client';

export async function runSubsidiarySeeder(prisma: PrismaClient) {
    const subsidiaries = [
        {
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
        },
        {
            subsidiaryName: 'CAAP Yaoundé',
            logoSvg: '<svg>...</svg>',
            address: 'CAAP Yaoundé',
            phone: '+237 222 22 00 00',
            email: 'contact.yaounde@caap.cm',
            ifu: 'M098765432109',
            rccm: 'RC/YAE/2023/A/5678',
            bankName: 'SGBCI',
            accountNumber: '20001 00003 09876543210 99',
            swiftCode: 'SCCMCMCX',
            shareCapital: 5000000.00,
        }
    ];

    for (const sub of subsidiaries) {
        await prisma.subsidiary.upsert({
            where: { email: sub.email }, // email est unique
            update: sub,
            create: sub,
        });
    }

    console.log('Subsidiaries seeded');
}