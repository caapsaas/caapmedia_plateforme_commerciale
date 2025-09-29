import { PrismaClient, Prisma } from '@prisma/client';

export async function runTaxRateSeeder(prisma: PrismaClient) {
    const taxRatesData = [
        {
            taxRatesName: 'TVA',
            rate: new Prisma.Decimal(0.1925),
            isDefault: true,
            description: 'Taxe sur la Valeur Ajoutée standard.',
        },
        {
            taxRatesName: 'Exonéré',
            rate: new Prisma.Decimal(0),
            isDefault: false,
            description: 'Exonéré de taxes.',
        },
    ];

    for (const t of taxRatesData) {
        await prisma.taxRate.create({
            data: {
                taxRatesName: t.taxRatesName,
                rate: t.rate,
                isDefault: t.isDefault,
                description: t.description,
            },
        });
        console.log(`TaxRate ${t.taxRatesName} created`);
    }
}
