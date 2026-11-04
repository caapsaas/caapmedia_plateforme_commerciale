// Load the production module graph without starting HTTP, cron jobs or Prisma.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ quiet: true });

const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'dist/src/main.js');
assert(fs.existsSync(entry), 'Build absent : exécuter npm run build avant ce contrôle.');
assert.equal(require('../package.json').scripts['start:prod'], 'node dist/src/main.js');
const { AppModule } = require(path.join(root, 'dist/src/app.module.js'));
assert(AppModule, 'AppModule absent du code compilé.');
console.log('Build vérifié : point d’entrée et modules compilés chargeables par Node.js.');
