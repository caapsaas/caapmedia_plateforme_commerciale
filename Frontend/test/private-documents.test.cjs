const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transformSync } = require('esbuild');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

let apiGet;
const compiled = new Module(path.resolve('test/private-documents.generated.cjs'));
compiled.filename = path.resolve('test/private-documents.generated.cjs');
compiled.require = (id) => {
  if (id === './api') return { api: { get: (...args) => apiGet(...args) } };
  if (id === './apiConfig') return { BACKEND_ORIGIN: 'https://backend.example' };
  return require(id);
};
compiled._compile(transformSync(fs.readFileSync('services/privateDocuments.ts', 'utf8'), { loader: 'ts', format: 'cjs' }).code, compiled.filename);
const { privateDocumentUrl, downloadPrivateDocument } = compiled.exports;

test('legacy RH and secretariat links use authenticated API routes', () => {
  assert.equal(privateDocumentUrl('/public/employee-documents/contract.pdf'), 'https://backend.example/api-caapmedia/private-documents/employee-documents/contract.pdf');
  assert.equal(privateDocumentUrl('/public/uploads/secretariat/file.pdf'), 'https://backend.example/api-caapmedia/private-documents/secretariat/file.pdf');
  assert.equal(privateDocumentUrl('/api-caapmedia/private-documents/employee-documents/SUB-A/file.pdf'), 'https://backend.example/api-caapmedia/private-documents/employee-documents/SUB-A/file.pdf');
});

test('external destinations and unrelated public resources cannot receive authenticated requests', () => {
  for (const url of ['https://attacker.example/public/employee-documents/file.pdf', '//attacker.example/file.pdf', '/public/products/image.png', 'javascript:alert(1)']) {
    assert.throws(() => privateDocumentUrl(url));
  }
});

test('downloads use the shared API session and a temporary blob URL', async () => {
  const calls = [];
  let clicked = false;
  let removed = false;
  const link = { click() { clicked = true; }, remove() { removed = true; } };
  global.document = { createElement: () => link, body: { appendChild: () => {} } };
  global.window = { setTimeout: (callback) => callback() };
  apiGet = async (...args) => { calls.push(args); return { data: new Blob(['confidential']) }; };
  await downloadPrivateDocument('/public/employee-documents/file.pdf', 'contract.pdf');
  assert.deepEqual(calls, [['https://backend.example/api-caapmedia/private-documents/employee-documents/file.pdf', { responseType: 'blob' }]]);
  assert.equal(link.download, 'contract.pdf');
  assert.match(link.href, /^blob:/);
  assert(clicked && removed);
  delete global.document;
  delete global.window;
});

test('denied downloads propagate their error without opening an unprotected URL', async () => {
  apiGet = async () => { throw new Error('403'); };
  await assert.rejects(downloadPrivateDocument('/public/employee-documents/file.pdf'), /403/);
});
