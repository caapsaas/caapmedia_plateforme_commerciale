#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map seeders to their entity prefixes
const seedersMap = {
  'subsidiary.seeder.ts': 'SUBSIDIARY',
  'user.seeder.ts': 'USER',
  'contact.seeder.ts': 'CONTACT',
  'employee.seeder.ts': 'EMPLOYEE',
  'product.seeder.ts': 'PRODUCT',
  'supplier.seeder.ts': 'SUPPLIER',
  'equipement.seeder.ts': 'EQUIPMENT',
  'order.seeder.ts': 'ORDER',
  'treasury.seeder.ts': 'TREASURY',
  'tax_rate.seeder.ts': 'TAXRATE',
  'contact-cities.seeder.ts': 'CONTACT', // cities are part of contact
};

function addImportsToSeeder(content, prefix) {
  // Check if already has imports
  if (content.includes('generateId')) {
    return content;
  }

  // Find the first import line (usually PrismaClient)
  const firstImportEnd = content.indexOf("';") + 2;

  const imports = `\nimport { generateId } from '../../src/common/utils/generate-id.util';\nimport { ID_PREFIXES } from '../../src/common/constants/id-prefixes.const';`;

  return content.slice(0, firstImportEnd) + imports + content.slice(firstImportEnd);
}

function fixSubsidiarySeeder(content) {
  // Fix subsidiary seeder - add id to each subsidiary object
  const pattern = /{\s*subsidiaryName:/g;
  let fixed = content;
  let match;
  let offset = 0;

  while ((match = pattern.exec(fixed)) !== null) {
    const startPos = match.index;
    const insertPos = startPos + offset + 1; // After opening {

    const idLine = `\n            id: generateId(ID_PREFIXES.SUBSIDIARY),\n            `;
    fixed = fixed.slice(0, insertPos) + idLine + fixed.slice(insertPos);
    offset += idLine.length;
    pattern.lastIndex = 0; // Reset pattern
  }

  return fixed;
}

function fixUserSeeder(content) {
  // For users, add id when creating/upserting
  if (content.includes('prisma.user.create') || content.includes('prisma.user.upsert')) {
    // Add id: generateId(ID_PREFIXES.USER) in the data object
    let fixed = content.replace(
      /\.create\(\{\s*data:\s*\{/g,
      `.create({\n    data: {\n      id: generateId(ID_PREFIXES.USER),`
    );
    fixed = fixed.replace(
      /\.upsert\(\{\s*where:/g,
      `.upsert({\n    where:`
    );
    return fixed;
  }

  // Alternative: if data is constructed elsewhere, add id in the final user object
  return content.replace(
    /(const createData.*?=\s*\{)/,
    `$1\n      id: generateId(ID_PREFIXES.USER),`
  );
}

function fixContactSeeder(content) {
  if (content.includes('prisma.contact.create')) {
    return content.replace(
      /\.create\(\{\s*data:\s*\{/g,
      `.create({\n    data: {\n      id: generateId(ID_PREFIXES.CONTACT),`
    );
  }
  return content;
}

function fixEmployeeSeeder(content) {
  if (content.includes('prisma.employee.create')) {
    return content.replace(
      /\.create\(\{\s*data:\s*\{/g,
      `.create({\n    data: {\n      id: generateId(ID_PREFIXES.EMPLOYEE),`
    );
  }
  return content;
}

function fixProductSeeder(content) {
  if (content.includes('prisma.product.create')) {
    return content.replace(
      /\.create\(\{\s*data:\s*\{/g,
      `.create({\n      data: {\n        id: generateId(ID_PREFIXES.PRODUCT),`
    );
  }
  return content;
}

function fixSupplierSeeder(content) {
  if (content.includes('prisma.supplier.create')) {
    return content.replace(
      /\.create\(\{\s*data:\s*\{/g,
      `.create({\n    data: {\n      id: generateId(ID_PREFIXES.SUPPLIER),`
    );
  }
  return content;
}

function fixEquipementSeeder(content) {
  if (content.includes('prisma.equipment.create')) {
    return content.replace(
      /\.create\(\{\s*data:\s*\{/g,
      `.create({\n      data: {\n        id: generateId(ID_PREFIXES.EQUIPMENT),`
    );
  }
  return content;
}

function fixOrderSeeder(content) {
  if (content.includes('prisma.order.create')) {
    return content.replace(
      /\.create\(\{\s*data:\s*\{/g,
      `.create({\n      data: {\n        id: generateId(ID_PREFIXES.ORDER),`
    );
  }
  return content;
}

function fixTreasurySeeder(content) {
  if (content.includes('prisma.treasuryAccount.create')) {
    return content.replace(
      /\.create\(\{\s*data:\s*\{/g,
      `.create({\n    data: {\n      id: generateId(ID_PREFIXES.TREASURY),`
    );
  }
  return content;
}

function fixTaxRateSeeder(content) {
  if (content.includes('prisma.taxRate.create')) {
    return content.replace(
      /\.create\(\{\s*data:\s*\{/g,
      `.create({\n    data: {\n      id: generateId(ID_PREFIXES.TAXRATE),`
    );
  }
  return content;
}

function fixSeeder(filePath, filename, prefix) {
  const fullPath = path.join(__dirname, '..', 'backend/prisma/seeders', filename);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${filename}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');

  if (content.includes(`generateId(ID_PREFIXES.${prefix})`)) {
    console.log(`✓ Already fixed: ${filename}`);
    return true;
  }

  // Add imports
  content = addImportsToSeeder(content, prefix);

  // Apply specific fixes based on seeder type
  if (filename.includes('subsidiary')) {
    content = fixSubsidiarySeeder(content);
  } else if (filename.includes('user')) {
    content = fixUserSeeder(content);
  } else if (filename.includes('contact')) {
    content = fixContactSeeder(content);
  } else if (filename.includes('employee')) {
    content = fixEmployeeSeeder(content);
  } else if (filename.includes('product')) {
    content = fixProductSeeder(content);
  } else if (filename.includes('supplier')) {
    content = fixSupplierSeeder(content);
  } else if (filename.includes('equipement')) {
    content = fixEquipementSeeder(content);
  } else if (filename.includes('order')) {
    content = fixOrderSeeder(content);
  } else if (filename.includes('treasury')) {
    content = fixTreasurySeeder(content);
  } else if (filename.includes('tax_rate')) {
    content = fixTaxRateSeeder(content);
  }

  fs.writeFileSync(fullPath, content);
  console.log(`✓ Fixed: ${filename} -> ${prefix}`);
  return true;
}

function main() {
  let count = 0;

  console.log('🔧 Fixing seeders to include generated IDs...\n');

  for (const [filename, prefix] of Object.entries(seedersMap)) {
    if (fixSeeder('backend/prisma/seeders', filename, prefix)) {
      count++;
    }
  }

  console.log(`\n✅ Fixed ${count} seeders!`);
}

main();
