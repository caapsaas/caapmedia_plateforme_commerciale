import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
assert(html.includes('id="root"'), 'Point de montage React absent.');
assert(!html.includes('/index.tsx'), 'index.html référence encore le code source.');
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)(?:[?#][^"]*)?"/g)].map(match => match[1]);
assert(assets.some(asset => asset.endsWith('.js')), 'JavaScript compilé absent.');
assert(assets.some(asset => asset.endsWith('.css')), 'CSS compilé absent.');
for (const asset of assets) {
  const target = resolve(dist, `.${asset}`);
  assert(target.startsWith(dist + sep) && existsSync(target), `Asset introuvable : ${asset}`);
}
for (const file of ['.htaccess', 'CaaMedia.png', 'CaapMedia.png', 'robots.txt', 'sitemap.xml', 'product-placeholder.svg']) {
  assert(existsSync(resolve(dist, file)), `Fichier public absent : ${file}`);
}
const env = loadEnv('production', root, '');
const origin = new URL(env.VITE_API_ORIGIN || 'https://caapmedia.com');
assert(origin.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Origine API de production invalide.');
const files = readdirSync(resolve(dist, 'assets')).filter(name => name.endsWith('.js'));
const javascript = files.map(name => readFileSync(resolve(dist, 'assets', name), 'utf8')).join('\n');
assert(javascript.includes(origin.origin), 'Origine API attendue absente du JavaScript compilé.');
assert(!env.GEMINI_API_KEY, 'Une clé Gemini est définie dans l’environnement de build.');
assert(!/AIza[0-9A-Za-z_-]{35}/.test(javascript), 'Une clé Google semble présente dans le JavaScript compilé.');
assert(!readdirSync(dist).some(name => name === '.env' || name.startsWith('.env.')), 'Fichier d’environnement présent dans dist.');
console.log(`Build vérifié : HTML, JavaScript, CSS, fichiers publics et origine API ${origin.origin}.`);
