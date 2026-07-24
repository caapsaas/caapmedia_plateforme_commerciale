#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map of service files and their ID prefixes
const servicesMap = {
  'backend/src/finance/treasury/treasury.service.ts': 'TREASURY',
  'backend/src/finance/expense/expense.service.ts': 'EXPENSE',
  'backend/src/finance/external-transaction/external-transaction.service.ts': 'EXTERNALTRANSACTION',
  'backend/src/finance/prefinancement/prefinancement.service.ts': 'PREFINANCEMENT',
  'backend/src/finance/debts/debts.service.ts': 'LONGTERDEBT',
  'backend/src/finance/assets/assets.service.ts': 'FIXEDASSET',
  'backend/src/hr/absencerecord/absencerecord.service.ts': 'ABSENCE',
  'backend/src/hr/attendancerecord/attendancerecord.service.ts': 'ATTENDANCE',
  'backend/src/hr/payrollrecord/payrollrecord.service.ts': 'PAYROLL',
  'backend/src/maintenance/equipement/equipement.service.ts': 'EQUIPMENT',
  'backend/src/maintenance/maintenance_record/maintenance_record.service.ts': 'MAINTENANCERECORD',
  'backend/src/crm/contracts/contracts.service.ts': 'CONTRACT',
  'backend/src/crm/crmtasks/crmtasks.service.ts': 'CRMTASK',
  'backend/src/crm/interactions/interactions.service.ts': 'INTERACTION',
  'backend/src/crm/proformas/proformas.service.ts': 'PROFORMA',
  'backend/src/newsletter/newsletter.service.ts': 'NEWSLETTER',
  'backend/src/secretariat/secretariat.service.ts': 'SECRETARIATASK',
  'backend/src/accounting/accounts/accounts.service.ts': 'ACCOUNTINGACCOUNT',
  'backend/src/accounting/entries/entries.service.ts': 'JOURNALENTRY',
  'backend/src/accounting/journalization/journalization.service.ts': 'JOURNALENTRY',
  'backend/src/accounting/periods/periods.service.ts': 'ACCOUNTINGPERIOD',
};

function addImportsIfNeeded(content) {
  const hasGenerateId = content.includes('generateId');
  if (hasGenerateId) return content; // Already has imports

  const importLine = `import { generateId } from 'src/common/utils/generate-id.util';\nimport { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';`;

  // Find the last import and add after it
  const lastImportMatch = content.lastIndexOf("from '");
  if (lastImportMatch === -1) return content;

  const endOfLastImport = content.indexOf("';", lastImportMatch) + 3;
  return content.slice(0, endOfLastImport) + '\n' + importLine + content.slice(endOfLastImport);
}

function addGenerateIdToCreate(content, prefix) {
  // Find all .create( patterns and add id: generateId(...) after data: {
  const pattern = /(\s*\.create\(\s*\{\s*data:\s*\{)/g;

  return content.replace(pattern, (match) => {
    if (match.includes(`generateId(ID_PREFIXES.${prefix})`)) {
      return match; // Already has generateId
    }
    // Add the generateId line after data: {
    return match + `\n        id: generateId(ID_PREFIXES.${prefix}),`;
  });
}

function processService(filePath, prefix) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');

  // Skip if already done
  if (content.includes(`generateId(ID_PREFIXES.${prefix})`)) {
    console.log(`✓ Already done: ${filePath}`);
    return true;
  }

  // Add imports
  content = addImportsIfNeeded(content);

  // Add generateId to create calls
  content = addGenerateIdToCreate(content, prefix);

  fs.writeFileSync(fullPath, content);
  console.log(`✓ Refactored: ${filePath} -> ${prefix}`);
  return true;
}

function main() {
  let successCount = 0;
  let skipCount = 0;

  console.log('🚀 Starting ID refactoring for remaining services...\n');

  for (const [file, prefix] of Object.entries(servicesMap)) {
    if (processService(file, prefix)) {
      successCount++;
    } else {
      skipCount++;
    }
  }

  console.log(`\n✅ Refactoring complete!`);
  console.log(`   Processed: ${successCount}`);
  console.log(`   Skipped: ${skipCount}`);
}

main();
