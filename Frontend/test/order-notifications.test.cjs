const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transformSync } = require('esbuild');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const models = new Module(path.resolve('test/order-models.generated.cjs'));
models.filename = path.resolve('test/order-models.generated.cjs');
models._compile(transformSync(fs.readFileSync('types/models.ts', 'utf8'), { loader: 'ts', format: 'cjs' }).code, models.filename);
const compiled = new Module(path.resolve('test/order-notifications.generated.cjs'));
compiled.filename = path.resolve('test/order-notifications.generated.cjs');
compiled.paths = module.paths;
compiled.require = (id) => id === '../types' ? models.exports : require(id);
compiled._compile(transformSync(fs.readFileSync('utils/orderNotifications.ts', 'utf8'), { loader: 'ts', format: 'cjs' }).code, compiled.filename);
const { getOrderNotificationTarget } = compiled.exports;

test('a new order opens production for its production recipient', () => {
  assert.deepEqual(getOrderNotificationTarget({ orderId: 'ORD-123', targetRole: 'PRODUCTION_DIRECTOR', data: { event: 'order.created' } }), { to: '/dashboard/production', hash: 'ORD-123' });
});
for (const event of ['order.validated', 'order.cancelled', 'order.production', 'order.ready', 'order.delivery', 'order.payment']) {
  test(`${event} opens the assigned commercial order in sales`, () => {
    assert.deepEqual(getOrderNotificationTarget({ orderId: 'ORD-123', targetRole: 'COMMERCIAL', data: { event } }), { to: '/dashboard/sales', hash: 'ORD-123' });
  });
}
test('legacy role-less order notifications use the active role', () => {
  assert.equal(getOrderNotificationTarget({ orderId: 'ORD-123', data: { event: 'order.status' } }, 'PRODUCTION_DIRECTOR').to, '/dashboard/production');
});
test('unrelated notifications and unsafe identifiers cannot navigate to arbitrary locations', () => {
  for (const value of [
    { orderId: 'ORD-123', data: { event: 'need.created' } },
    { orderId: '../admin', data: { event: 'order.created' } },
    { orderId: 'https://attacker.example', data: { event: 'order.created' } },
    { orderId: 'ORD-123', data: null },
    { data: { event: 'order.created' } },
  ]) assert.equal(getOrderNotificationTarget(value), null);
});
