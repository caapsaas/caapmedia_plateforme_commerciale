const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const Module = require('node:module');
const path = require('node:path');

// Compile the actual UI policy with Vite's existing compiler; no test dependency.
const output = buildSync({ entryPoints: [path.resolve('utils/orderWorkflow.ts')], bundle: true, platform: 'node', format: 'cjs', write: false });
const compiled = new Module(path.resolve('test/order-workflow.generated.cjs'));
compiled.filename = path.resolve('test/order-workflow.generated.cjs');
compiled.paths = module.paths;
compiled._compile(output.outputFiles[0].text, compiled.filename);
const { allowedOrderTransitions, isKanbanOrder, canAdvanceProduction } = compiled.exports;
const pending = { status: 'PENDING_VALIDATION', productionStatus: 'PREPRESS', paymentStatus: 'UNPAID', amountPaid: 0, totalAmount: 100 };

test('commercial and cashier cannot approve fabrication', () => {
  assert.deepEqual(allowedOrderTransitions(pending, 'COMMERCIAL'), ['CANCELLED']);
  assert.deepEqual(allowedOrderTransitions(pending, 'CAISSIER'), []);
  assert(allowedOrderTransitions(pending, 'PRODUCTION_DIRECTOR').includes('IN_PRODUCTION'));
});
test('paid orders cannot be cancelled before validation', () => {
  assert.deepEqual(allowedOrderTransitions({ ...pending, amountPaid: 1 }, 'COMMERCIAL'), []);
  assert.deepEqual(allowedOrderTransitions({ ...pending, amountPaid: 1 }, 'PRODUCTION_DIRECTOR'), ['IN_PRODUCTION']);
});
test('the kanban includes ready orders and excludes unapproved and delivered orders', () => {
  assert.equal(isKanbanOrder(pending), false);
  assert.equal(isKanbanOrder({ ...pending, status: 'NEW' }), false);
  assert.equal(isKanbanOrder({ ...pending, status: 'PENDING_DELIVERY', productionStatus: 'READY_FOR_DELIVERY' }), true);
  assert.equal(isKanbanOrder({ ...pending, status: 'DELIVERED' }), false);
});
test('production controls only offer the next stage to a production manager', () => {
  const printing = { ...pending, status: 'IN_PRODUCTION', productionStatus: 'PRINTING' };
  assert.equal(canAdvanceProduction(printing, 'FINISHING', 'PRODUCTION_DIRECTOR'), true);
  assert.equal(canAdvanceProduction(printing, 'READY_FOR_DELIVERY', 'PRODUCTION_DIRECTOR'), false);
  assert.equal(canAdvanceProduction(printing, 'PREPRESS', 'PRODUCTION_DIRECTOR'), false);
  assert.equal(canAdvanceProduction(printing, 'FINISHING', 'COMMERCIAL'), false);
});
test('delivery and closure actions depend on the lifecycle and payment state', () => {
  const ready = { ...pending, status: 'PENDING_DELIVERY', productionStatus: 'READY_FOR_DELIVERY' };
  assert.deepEqual(allowedOrderTransitions(ready, 'COMMERCIAL'), ['DELIVERED']);
  assert.deepEqual(allowedOrderTransitions({ ...ready, status: 'DELIVERED' }, 'COMMERCIAL'), []);
  assert.deepEqual(allowedOrderTransitions({ ...ready, status: 'DELIVERED', paymentStatus: 'PAID', amountPaid: 100 }, 'COMMERCIAL'), ['COMPLETED']);
  assert.deepEqual(allowedOrderTransitions(ready, 'SUPER_ADMIN'), []);
});
