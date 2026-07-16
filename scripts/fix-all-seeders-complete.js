#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map seeders to their entity prefixes and patterns
const seedersConfig = [
  {
    file: 'contact-cities.seeder.ts',
    prefix: 'CONTACT',
    pattern: 'contact',
    createPattern: /await\s+prisma\.contact\.create\(\{/g
  },
  {
    file: 'employee.seeder.ts',
    prefix: 'EMPLOYEE',
    pattern: 'employee',
    createPatterns: [
      /data:\s*\{(?!.*id:)/,  // data: { without id:
      /createData\s*=\s*\{(?!.*id:)/  // createData = { without id:
    ]
  },
  {
    file: 'equipement.seeder.ts',
    prefix: 'EQUIPMENT',
    pattern: 'equipment',
    createPattern: /await\s+prisma\.equipment\.create\(\{/g
  },
  {
    file: 'product.seeder.ts',
    prefix: 'PRODUCT',
    pattern: 'product',
    createPattern: /await\s+prisma\.product\.create\(\{/g
  },
  {
    file: 'supplier.seeder.ts',
    prefix: 'SUPPLIER',
    pattern: 'supplier',
    createPattern: /create:\s*\{/
  },
  {
    file: 'tax_rate.seeder.ts',
    prefix: 'TAXRATE',
    pattern: 'taxRate',
    createPattern: /await\s+prisma\.taxRate\.create\(\{/g
  },
  {
    file: 'treasury.seeder.ts',
    prefix: 'TREASURY',
    pattern: 'treasuryAccount',
    createPattern: /await\s+prisma\.treasuryAccount\.create\(\{/g
  },
  {
    file: 'order.seeder.ts',
    prefix: 'ORDER',
    pattern: 'order',
    createPattern: /await\s+prisma\.order\.create\(\{/g
  },
  {
    file: 'contact-cities.seeder.ts',
    prefix: 'CONTACT',
    pattern: 'contact',
    hasLeaveBalances: true
  }
];

function addImportsIfMissing(content, prefix) {
  if (content.includes('generateId')) {
    return content;
  }

  // Find first import line
  const importMatch = content.match(/^import\s+.+?from\s+['"].+?['"];/m);
  if (!importMatch) return content;

  const importEnd = content.indexOf(importMatch[0]) + importMatch[0].length;
  const imports = `\nimport { generateId } from './generate-id.util';\nimport { ID_PREFIXES } from './id-prefixes.const';`;

  return content.slice(0, importEnd) + imports + content.slice(importEnd);
}

function fixSeeder(filePath, config) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${config.file}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Already has IDs
  if (content.includes(`generateId(ID_PREFIXES.${config.prefix})`)) {
    console.log(`✓ Already fixed: ${config.file}`);
    return true;
  }

  // Add imports
  content = addImportsIfMissing(content, config.prefix);

  // Fix data objects by adding id as first property
  // Pattern: look for opening { and add id: generateId(...),

  const idLine = `id: generateId(ID_PREFIXES.${config.prefix}),`;

  // For objects in arrays or create calls
  if (config.file === 'product.seeder.ts') {
    // Fix: const productsData = [ { ... } ]
    content = content.replace(
      /const\s+productsData\s*=\s*\[\s*\n\s*\{(?![\s\S]*?id:)/,
      `const productsData = [\n    {\n      ${idLine}`
    );
    // Fix remaining objects in array
    content = content.replace(
      /,\s*\{\s*(?![\s\S]*?id:)/g,
      `,\n    {\n      ${idLine}`
    );
  }

  if (config.file === 'supplier.seeder.ts') {
    // Fix upsert create block
    content = content.replace(
      /create:\s*\{(?!\s*id:)/,
      `create: {\n        ${idLine}`
    );
  }

  if (config.file === 'treasury.seeder.ts') {
    // Fix: const accountsData = [ { ... } ]
    content = content.replace(
      /const\s+accountsData\s*=\s*\[\s*\n\s*\{(?![\s\S]*?id:)/,
      `const accountsData = [\n    {\n      ${idLine}`
    );
  }

  if (config.file === 'equipement.seeder.ts') {
    // Fix create block
    content = content.replace(
      /data:\s*\{(?!\s*id:)/,
      `data: {\n        ${idLine}`
    );
    // Fix maintenance record create
    content = content.replace(
      /maintenanceData:\s*\{(?!\s*id:)/,
      `maintenanceData: {\n        ${idLine}`
    );
  }

  if (config.file === 'tax_rate.seeder.ts') {
    // Fix: const taxRatesData = [ { ... } ]
    content = content.replace(
      /const\s+taxRatesData\s*=\s*\[\s*\{(?![\s\S]*?id:)/,
      `const taxRatesData = [\n    {\n      ${idLine}`
    );
  }

  if (config.file === 'contact-cities.seeder.ts') {
    // Fix create blocks
    content = content.replace(
      /create:\s*\{(?!\s*id:)/g,
      `create: {\n        ${idLine}`
    );
  }

  if (config.file === 'employee.seeder.ts') {
    // Fix subsidiary create
    content = content.replace(
      /data:\s*\{(?!\s*id:)[\s\S]*?subsidiaryName/,
      `data: {\n        ${idLine}\n        subsidiaryName`
    );

    // Fix employee create
    content = content.replace(
      /data:\s*\{(?!\s*id:)[\s\S]*?lastName/,
      `data: {\n        ${idLine}\n        lastName`
    );

    // Fix leave balance createMany
    content = content.replace(
      /data:\s*\[[\s\S]*?\{(?!\s*id:)/g,
      `data: [\n          {\n            ${idLine}`
    );
  }

  if (config.file === 'order.seeder.ts') {
    // Fix create blocks
    content = content.replace(
      /data:\s*\{(?!\s*id:)/g,
      `data: {\n        ${idLine}`
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`✓ Fixed: ${config.file} -> ${config.prefix}`);
  return true;
}

function main() {
  const seedersDir = path.join(__dirname, '..', 'backend/prisma/seeders');
  let count = 0;

  console.log('🔧 Auto-fixing all seeders with generateId...\n');

  // Get unique seeders
  const uniqueSeeders = {};
  seedersConfig.forEach(cfg => {
    if (!uniqueSeeders[cfg.file]) {
      uniqueSeeders[cfg.file] = cfg;
    }
  });

  for (const [file, config] of Object.entries(uniqueSeeders)) {
    const filePath = path.join(seedersDir, file);
    if (fixSeeder(filePath, config)) {
      count++;
    }
  }

  console.log(`\n✅ Fixed ${count} seeders!`);
  console.log('\nTo verify:');
  console.log('  npx prisma db seed');
}

main();
