"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const config_1 = require("@prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: './prisma/schema.prisma',
    migrations: {
        seed: 'ts-node prisma/seeds.ts',
    },
});
//# sourceMappingURL=prisma.config.js.map