// Real browser regression: export a QR surrounded by OKLCH styles, then scan the JPEG.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const { buildSync } = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { QRCodeSVG } = require('qrcode.react');

const browser = process.env.QR_TEST_BROWSER || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(file => fs.existsSync(file));
assert(browser, 'Set QR_TEST_BROWSER to a Chrome/Chromium/Edge executable');
const expected = 'https://caapmedia.com/pointage?t=QR-EXPORT-TEST';
const svg = renderToStaticMarkup(React.createElement(QRCodeSVG, {
  value: expected, size: 200, level: 'H', includeMargin: true,
}));
const bundle = buildSync({
  stdin: {
    contents: `
      import { qrCodeToJpeg } from '../utils/qrCodeExport';
      import jsQR from 'jsqr';
      async function run() {
        const result = document.getElementById('result');
        try {
          const jpeg = await qrCodeToJpeg(document.querySelector('svg'));
          if (!jpeg.startsWith('data:image/jpeg;')) throw new Error('Not a JPEG');
          const image = new Image();
          image.src = jpeg;
          await image.decode();
          if (image.width !== 496 || image.height !== 496) throw new Error('Unexpected dimensions');
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(pixels.data, pixels.width, pixels.height);
          if (decoded?.data !== ${JSON.stringify(expected)}) throw new Error('Exported QR cannot be scanned');
          document.body.setAttribute('data-test-status', 'passed');
          result.textContent = 'PASS: JPEG QR decoded with OKLCH styles around it';
        } catch (error) {
          document.body.setAttribute('data-test-status', 'failed');
          result.textContent = 'FAIL: ' + error.message;
        }
      }
      run();
    `,
    resolveDir: path.resolve('test'), loader: 'ts',
  },
  bundle: true, platform: 'browser', format: 'iife', write: false,
});
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'caapmedia-qr-export-'));
try {
  fs.writeFileSync(path.join(temporary, 'test.js'), bundle.outputFiles[0].text);
  const html = `<!doctype html><html><body style="color:oklch(0.3 0.1 120);background:oklch(0.95 0.02 120)"><div style="border:2px solid oklch(0.8 0.03 250);padding:24px">${svg}</div><pre id="result">PENDING</pre><script src="test.js"></script></body></html>`;
  fs.writeFileSync(path.join(temporary, 'index.html'), html);
  const result = spawnSync(browser, [
    '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking',
    `--user-data-dir=${path.join(temporary, 'profile')}`,
    '--dump-dom', '--virtual-time-budget=5000',
    pathToFileURL(path.join(temporary, 'index.html')).href,
  ], { windowsHide: true, encoding: 'utf8', timeout: 25000, maxBuffer: 5 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr?.slice(-2000));
  assert.match(result.stdout, /data-test-status="passed"/, result.stdout?.slice(-2000));
  console.log('PASS: real browser exports the JPEG under OKLCH styling and jsQR decodes the original attendance URL.');
} finally {
  const resolved = path.resolve(temporary);
  assert(path.dirname(resolved) === path.resolve(os.tmpdir()) && path.basename(resolved).startsWith('caapmedia-qr-export-'));
  // Chromium may briefly keep profile files open after returning the DOM.
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
}
