"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSubsidiarySeeder = runSubsidiarySeeder;
const generate_id_util_1 = require("./generate-id.util");
const id_prefixes_const_1 = require("./id-prefixes.const");
async function runSubsidiarySeeder(prisma) {
    const subsidiaries = [
        {
            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.SUBSIDIARY),
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
            where: { email: updateData.email },
            update: updateData,
            create: { id, ...updateData },
        });
    }
    console.log('Subsidiaries seeded (Douala, Siège, Kribi, Edéa)');
}
//# sourceMappingURL=subsidiary.seeder.js.map