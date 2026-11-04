"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTaxRateSeeder = runTaxRateSeeder;
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("./generate-id.util");
const id_prefixes_const_1 = require("./id-prefixes.const");
async function runTaxRateSeeder(prisma) {
    const taxRatesData = [
        {
            taxRatesName: 'TVA',
            rate: new client_1.Prisma.Decimal(0.1925),
            isDefault: true,
            description: 'Taxe sur la Valeur Ajoutée standard.',
        },
        {
            taxRatesName: 'Exonéré',
            rate: new client_1.Prisma.Decimal(0),
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
        }
        else {
            await prisma.taxRate.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TAXRATE),
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
//# sourceMappingURL=tax_rate.seeder.js.map