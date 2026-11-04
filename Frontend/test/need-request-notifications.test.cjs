const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const Module = require('node:module');
const path = require('node:path');
const output = buildSync({ entryPoints: [path.resolve('utils/needRequestNotifications.ts')], bundle: true, platform: 'node', format: 'cjs', write: false });
const compiled = new Module(path.resolve('test/need-request-notifications.generated.cjs'));
compiled.filename = path.resolve('test/need-request-notifications.generated.cjs');
compiled.paths = module.paths;
compiled._compile(output.outputFiles[0].text, compiled.filename);
const { getNeedRequestNotificationId } = compiled.exports;
for (const event of ['need.created', 'need.approved', 'need.rejected', 'need.paid']) {
  test(event + ' opens and refreshes its associated request', () => {
    assert.equal(getNeedRequestNotificationId({ data: { event, requestId: 'request-123' } }), 'request-123');
  });
}
test('unrelated or malformed notifications cannot open an arbitrary request', () => {
  for (const data of [null, undefined, {}, { event: 'order.created', requestId: 'other' }, { event: 'need.approved' }, { event: 'need.rejected', requestId: 123 }, { event: 'need.paid', requestId: '  ' }]) {
    assert.equal(getNeedRequestNotificationId({ data }), null);
  }
});
