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

    // taxRatesName n'est pas @unique dans le schema (pas de upsert possible
    // par ce champ) - on verifie l'existence manuellement, meme pattern que
    // treasury.seeder.ts, pour que ce seeder soit rejouable sans dupliquer
    // les taux a chaque `npm run seed`.
    for (const t of taxRatesData) {
        const existing = await prisma.taxRate.findFirst({
            where: { taxRatesName: t.taxRatesName },
        });
        if (existing) {
            console.log(`TaxRate ${t.taxRatesName} already exists, skipping`);
            continue;
        }
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
