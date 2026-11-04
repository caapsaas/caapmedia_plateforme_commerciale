// All fixtures and notification records are rolled back; no live SSE is used.
require('ts-node').register({ transpileOnly: true });
require('tsconfig-paths/register');
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { NeedRequestsService } = require('../src/purchase/need-requests/need-requests.service');
const { NotificationsService } = require('../src/notifications/notifications.service');
const { AccountingOutboxService } = require('../src/accounting/outbox/accounting-outbox.service');
const prisma = new PrismaClient();
const fixtureId = randomUUID();
const rollback = new Error('ROLLBACK_NEED_NOTIFICATION_FIXTURES');
(async () => {
  try {
    await prisma.$transaction(async tx => {
      const branch = await tx.subsidiary.create({ data: { id: fixtureId, subsidiaryName: 'Notifications test ' + fixtureId, logoSvg: '', address: 'Test', phone: '000', email: fixtureId + '@test.invalid', ifu: fixtureId, rccm: fixtureId, bankName: 'Test', accountNumber: 'Test', swiftCode: 'Test', shareCapital: 0 } });
      const createUser = role => tx.user.create({ data: { userName: role, email: role + '-' + fixtureId + '@test.invalid', passwordHash: 'DISABLED_TEST_ONLY', subsidiaryId: branch.id, userRole: role, roles: [role], activeRole: role } });
      const admin = await createUser('SUPER_ADMIN');
      const requester = await createUser('COMMERCIAL');
      const adapter = new Proxy(tx, { get(target, key) { return key === '$transaction' ? async callback => callback(tx) : target[key]; } });
      const pushes = [];
      const notifications = new NotificationsService(adapter, { push: (recipientId, data) => pushes.push({ recipientId, data }) });
      const service = new NeedRequestsService(adapter, notifications, new AccountingOutboxService());
      const identity = user => ({ id: user.id, email: user.email, role: user.userRole, roles: user.roles, activeRole: user.activeRole, subsidiaryId: branch.id });
      const approved = await service.create(identity(requester), { title: 'Besoin à approuver', description: 'Fixture de vérification des notifications aller-retour' });
      const adminMessages = await tx.notification.findMany({ where: { recipientId: admin.id } });
      assert.equal(adminMessages.length, 1);
      assert.equal(adminMessages[0].data.event, 'need.created');
      assert.equal(adminMessages[0].data.requestId, approved.id);
      await service.review(identity(admin), approved.id, { status: 'APPROVED' });
      const approval = await tx.notification.findFirst({ where: { recipientId: requester.id, data: { path: ['requestId'], equals: approved.id } } });
      assert(approval);
      assert.equal(approval.data.event, 'need.approved');
      assert.equal(approval.read, false);
      assert(pushes.some(push => push.recipientId === requester.id && push.data.id === approval.id));
      const rejected = await service.create(identity(requester), { title: 'Besoin à rejeter', description: 'Autre fixture de vérification des notifications aller-retour' });
      await service.review(identity(admin), rejected.id, { status: 'REJECTED', rejectionReason: ' Budget non disponible ' });
      const rejection = await tx.notification.findFirst({ where: { recipientId: requester.id, data: { path: ['requestId'], equals: rejected.id } } });
      assert(rejection);
      assert.equal(rejection.data.event, 'need.rejected');
      assert(rejection.message.includes('Motif : Budget non disponible'));
      assert.equal(await tx.notification.count({ where: { recipientId: requester.id } }), 2);
      await assert.rejects(() => service.review(identity(admin), approved.id, { status: 'REJECTED', rejectionReason: 'Second traitement' }), /déjà été traitée/);
      assert.equal(await tx.notification.count({ where: { recipientId: requester.id } }), 2);
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await prisma.subsidiary.count({ where: { id: fixtureId } }), 0);
  console.log('PASS: creation notifies admin; approval/rejection notify requester with deep links and reason; duplicate decisions do not notify; fixtures rolled back.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
