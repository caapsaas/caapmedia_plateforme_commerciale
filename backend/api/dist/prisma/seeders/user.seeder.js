"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUserSeeder = runUserSeeder;
const bcrypt_1 = __importDefault(require("bcrypt"));
const generate_id_util_1 = require("./generate-id.util");
const id_prefixes_const_1 = require("./id-prefixes.const");
async function runUserSeeder(prisma) {
    const users = [
        {
            userName: 'Nalobert',
            email: 'nalobert@gmail.com',
            password: 'a1234578o',
            userRole: 'SUPER_ADMIN',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            userName: 'Richard Directeur Financier',
            email: 'richard.finance@caap.cm',
            password: 'password',
            userRole: 'FINANCIAL_DIRECTOR',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            userName: 'Fatou Caissière Douala',
            email: 'fatou.caissiere@caap.cm',
            password: 'password',
            userRole: 'CAISSIER',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            userName: 'Louis Bernard rh',
            email: 'louis.rh@caap.cm',
            password: 'password',
            userRole: 'HR_MANAGER',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
        {
            userName: 'Richard Responsable Achats',
            email: 'richard.achats@caap.cm',
            password: 'password',
            userRole: 'PURCHASING_MANAGER',
            subsidiaryEmail: 'contact.douala@caap.cm',
        },
    ];
    for (const u of users) {
        const subsidiary = await prisma.subsidiary.findUnique({
            where: { email: u.subsidiaryEmail },
        });
        if (!subsidiary) {
            console.warn(`Subsidiary ${u.subsidiaryEmail} not found for user ${u.email}`);
            continue;
        }
        const passwordHash = bcrypt_1.default.hashSync(u.password, 10);
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                userName: u.userName,
                passwordHash,
                userRole: u.userRole,
                subsidiaryId: subsidiary.id,
            },
            create: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.USER),
                userName: u.userName,
                email: u.email,
                passwordHash,
                userRole: u.userRole,
                subsidiaryId: subsidiary.id,
            },
        });
    }
    console.log('Users seeded');
}
//# sourceMappingURL=user.seeder.js.map