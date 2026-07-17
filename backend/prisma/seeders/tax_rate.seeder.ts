import { PrismaClient, Prisma } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

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
        const existing = await prisma.taxRate.findFirst({
            where: { taxRatesName: t.taxRatesName },
        });

        if (existing) {
            await prisma.taxRate.update({
                where: { id: existing.id },
                data: {
                    rate: t.rate,
                    isDefault: t.isDefault,
                    description: t.description,
                },
            });
            console.log(`TaxRate ${t.taxRatesName} updated`);
        } else {
            await prisma.taxRate.create({
                data: {
                    id: generateId(ID_PREFIXES.TAXRATE),
                    taxRatesName: t.taxRatesName,
                    rate: t.rate,
                    isDefault: t.isDefault,
                    description: t.description,
                },
            });
            console.log(`TaxRate ${t.taxRatesName} created`);
        }
    }
}
