const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPlan, validateManifest, applyPlan } = require('../scripts/sync-product-images-r2.cjs');
const origin = 'https://images.caapmedia.com';
const image = { imageName: 'rollup.jpg', imageUrl: `${origin}/products/photo.jpg` };
const source = { sourceProductId: 'local-1', name: 'Roll-up', category: 'Impression', images: [image] };
const manifest = products => ({ version: 1, publicOrigin: origin, products });
const target = (overrides = {}) => ({ id: 'prod-1', name: 'Roll-up', category: 'Impression', productImages: [{ id: 'old', imageName: 'placeholder', imageUrl: 'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png' }], ...overrides });

test('matches different local/production IDs by unique name and category', () => {
  const plan = buildPlan(manifest([source]), [target()]);
  assert.equal(plan.actions[0].productId, 'prod-1');
  assert.equal(plan.actions[0].match, 'name-category');
  assert.deepEqual(plan.actions[0].after, [image]);
  assert.equal(plan.conflicts.length, 0);
});
test('blocks ambiguous names, absent products, and mismatched reused IDs', () => {
  for (const targets of [[target(), target({ id: 'prod-2' })], [], [target({ id: 'local-1', name: 'Different' })]]) {
    const plan = buildPlan(manifest([source]), targets);
    assert.equal(plan.actions.length, 0);
    assert.equal(plan.conflicts.length, 1);
  }
});
test('does not replace different real production photos', () => {
  const plan = buildPlan(manifest([source]), [target({ productImages: [{ id: 'existing', imageName: 'real.jpg', imageUrl: `${origin}/products/other.jpg` }] })]);
  assert.equal(plan.actions.length, 0);
  assert.equal(plan.conflicts.length, 1);
});
test('repeat imports are unchanged and products without exported photos are untouched', () => {
  const plan = buildPlan(manifest([source]), [target({ productImages: [{ id: 'new', ...image }] }), target({ id: 'untouched', name: 'Another product' })]);
  assert.equal(plan.actions.length, 0);
  assert.deepEqual(plan.unchanged, ['Roll-up']);
  assert.equal(plan.conflicts.length, 0);
});
test('rejects foreign domains, temporary URLs, duplicate source IDs, and excessive images', () => {
  assert.doesNotThrow(() => validateManifest(manifest([source]), origin));
  for (const products of [
    [source, source],
    [{ ...source, images: [{ ...image, imageUrl: 'https://evil.example/photo.jpg' }] }],
    [{ ...source, images: [{ ...image, imageUrl: `${image.imageUrl}?token=secret` }] }],
    [{ ...source, images: Array(6).fill(image) }],
  ]) assert.throws(() => validateManifest(manifest(products), origin));
});
test('detects changed production associations before deleting anything', async () => {
  const plan = buildPlan(manifest([source]), [target()]);
  let deleted = false;
  const db = { $transaction: async callback => callback({
    item: { findFirst: async () => target({ productImages: [] }) },
    productImage: { deleteMany: async () => { deleted = true; } },
  }) };
  await assert.rejects(applyPlan(db, plan), /Modification concurrente/);
  assert.equal(deleted, false);
});
test('updates only image relations using production product IDs in one transaction', async () => {
  const current = target();
  const plan = buildPlan(manifest([source]), [current]);
  const writes = [];
  let settings;
  const db = { $transaction: async (callback, options) => {
    settings = options;
    return callback({ item: { findFirst: async () => current }, productImage: {
      deleteMany: async args => { writes.push(args); },
      createMany: async args => { writes.push(args); },
    } });
  } };
  await applyPlan(db, plan);
  assert.equal(settings.isolationLevel, 'Serializable');
  assert.deepEqual(writes[0], { where: { productId: 'prod-1' } });
  assert.equal(writes[1].data[0].productId, 'prod-1');
  assert.equal(writes[1].data[0].imageUrl, image.imageUrl);
});
