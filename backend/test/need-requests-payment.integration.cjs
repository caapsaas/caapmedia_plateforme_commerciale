// Local PostgreSQL integration check: every fixture and movement is rolled back.
require('ts-node').register({ transpileOnly: true });
require('tsconfig-paths/register');
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient, Prisma } = require('@prisma/client');
const { NeedRequestsService } = require('../src/purchase/need-requests/need-requests.service');
const { NotificationsService } = require('../src/notifications/notifications.service');
const { AccountingOutboxService } = require('../src/accounting/outbox/accounting-outbox.service');
const prisma = new PrismaClient();
const fixtureId = randomUUID();
const rollback = new Error('ROLLBACK_NEED_PAYMENT_FIXTURES');
(async () => {
  try {
    await prisma.$transaction(async tx => {
      const branch = await tx.subsidiary.create({ data: { id: fixtureId, subsidiaryName: 'Test besoins ' + fixtureId, logoSvg: '', address: 'Test', phone: '000', email: fixtureId + '@test.invalid', ifu: fixtureId, rccm: fixtureId, bankName: 'Test', accountNumber: 'Test', swiftCode: 'Test', shareCapital: 0 } });
      const createUser = (role) => tx.user.create({ data: { userName: role, email: role + '-' + fixtureId + '@test.invalid', passwordHash: 'DISABLED_TEST_ONLY', subsidiaryId: branch.id, userRole: role, roles: [role], activeRole: role } });
      const admin = await createUser('SUPER_ADMIN');
      const commercial = await createUser('COMMERCIAL');
      const box = await tx.treasuryAccount.create({ data: { accountName: 'Test expense box', subsidiaryId: branch.id, accountType: 'EXPENSE_BOX', currency: 'XOF', balance: 50000 } });
      const bank = await tx.treasuryAccount.create({ data: { accountName: 'Bank must stay unchanged', subsidiaryId: branch.id, accountType: 'BANQUE', currency: 'XOF', balance: 100000 } });
      const request = await tx.needRequest.create({ data: { title: 'Test paiement caisse', description: 'Fixture jetable, transaction annulée', subsidiaryId: branch.id, requesterId: commercial.id, status: 'APPROVED' } });
      const adapter = new Proxy(tx, { get(target, key) { if (key === '$transaction') return async (callback, options) => { assert.equal(options.isolationLevel, 'Serializable'); return callback(tx); }; return target[key]; } });
      const pushes = [];
      const notifications = new NotificationsService(adapter, { push: (id, data) => pushes.push({ id, data }) });
      const service = new NeedRequestsService(adapter, notifications, new AccountingOutboxService());
      const identity = { id: admin.id, email: admin.email, role: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'], activeRole: 'SUPER_ADMIN', subsidiaryId: branch.id };
      const paid = await service.pay(identity, request.id, { amount: 12500.5, beneficiary: 'Test fournisseur', category: 'ADVERTISING', transactionDate: '2026-10-27' });
      assert.equal(paid.payment.amount.toString(), '12500.5');
      assert.equal(paid.payment.financialTransaction.treasuryAccount.id, box.id);
      assert.equal((await tx.treasuryAccount.findUniqueOrThrow({ where: { id: box.id } })).balance.toString(), '37499.5');
      assert.equal((await tx.treasuryAccount.findUniqueOrThrow({ where: { id: bank.id } })).balance.toString(), '100000');
      assert.equal(await tx.financialTransaction.count({ where: { relatedDocumentId: request.id, status: 'VALIDE' } }), 1);
      const events = await tx.accountingOutboxEntry.findMany({ where: { subsidiaryId: branch.id } });
      assert.equal(events.length, 1);
      assert.equal(events[0].eventType, 'TREASURY_EXPENSE');
      assert.equal(events[0].payload.expenseCategory, 'ADVERTISING');
      assert.equal(await tx.notification.count({ where: { recipientId: commercial.id } }), 1);
      assert.equal(pushes.length, 1);
      assert.equal(pushes[0].data.data.event, 'need.paid');
      await assert.rejects(() => service.pay(identity, request.id, { amount: 12500.5, beneficiary: 'Test fournisseur', category: 'ADVERTISING', transactionDate: '2026-10-27' }), /déjà réglée/);
      assert.equal((await tx.treasuryAccount.findUniqueOrThrow({ where: { id: box.id } })).balance.toString(), '37499.5');
      const unfunded = await tx.needRequest.create({ data: { title: 'Test solde insuffisant', description: 'Fixture jetable, transaction annulée', subsidiaryId: branch.id, requesterId: commercial.id, status: 'APPROVED' } });
      await assert.rejects(() => service.pay(identity, unfunded.id, { amount: 40000, beneficiary: 'Test fournisseur', category: 'OTHER', transactionDate: '2026-10-27' }), /Solde insuffisant/);
      assert.equal(await tx.needRequestPayment.count({ where: { needRequestId: unfunded.id } }), 0);
      assert.equal((await tx.treasuryAccount.findUniqueOrThrow({ where: { id: box.id } })).balance.toString(), '37499.5');
      throw rollback;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await prisma.subsidiary.count({ where: { id: fixtureId } }), 0);
  console.log('PASS: cash-box debit, bank unchanged, unique payment, accounting, notification, insufficient funds, full fixture rollback.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
