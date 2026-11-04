const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transformSync } = require('esbuild');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

let responseData;
const compiled = new Module(path.resolve('test/equipment-values.generated.cjs'));
compiled.filename = path.resolve('test/equipment-values.generated.cjs');
compiled.require = (id) => {
  if (id === '../api') {
    const respond = async () => ({ data: responseData });
    return { api: { get: respond, post: respond, patch: respond } };
  }
  return require(id);
};
compiled._compile(transformSync(fs.readFileSync('services/apiMaintenance/apiEquipment.ts', 'utf8'), {
  loader: 'ts', format: 'cjs',
}).code, compiled.filename);
const service = compiled.exports;

test('equipment lists convert decimal strings for monetary display and numeric totals', async () => {
  responseData = [
    { id: 'a', acquisitionValue: '25000000.50' },
    { id: 'b', acquisitionValue: '15000000.25' },
    { id: 'c', acquisitionValue: 0 },
  ];
  for (const load of [() => service.getEquipments('subsidiary-a'), () => service.searchEquipments({})]) {
    const equipment = await load();
    assert.equal(equipment[0].acquisitionValue, 25000000.5);
    assert.equal(equipment[2].acquisitionValue, 0);
    assert.equal(equipment.reduce((sum, item) => sum + item.acquisitionValue, 0), 40000000.75);
    assert.equal(responseData[0].acquisitionValue, '25000000.50');
  }
});

test('detail, creation and update return numeric acquisition values', async () => {
  for (const value of ['1200000.75', 8500000, '0']) {
    responseData = { id: 'a', equipmentName: 'Machine', acquisitionValue: value };
    for (const load of [
      () => service.getEquipmentById('a'),
      () => service.createEquipment({}),
      () => service.updateEquipment('a', {}),
    ]) {
      const equipment = await load();
      assert.equal(equipment.acquisitionValue, Number(value));
      assert.equal(equipment.equipmentName, 'Machine');
    }
  }
});
