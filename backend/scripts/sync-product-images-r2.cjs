/* Sync only product/image associations. Does not upload files or copy products. */
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const normalize = value => value.normalize('NFC').trim().toLocaleLowerCase('fr');
const productKey = product => JSON.stringify([normalize(product.name), normalize(product.category)]);
const snapshot = images => JSON.stringify(images.map(({ id, imageName, imageUrl }) => ({ id, imageName, imageUrl })).sort((a, b) => a.id.localeCompare(b.id)));
const placeholder = url => url === 'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png';

function publicOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('R2_PUBLIC_BASE_URL doit être une origine HTTPS sans chemin.');
  return url.origin;
}

function validateManifest(manifest, origin) {
  if (manifest.version !== 1 || manifest.publicOrigin !== origin || !Array.isArray(manifest.products)) throw new Error('Export incompatible ou domaine R2 différent.');
  const ids = new Set();
  for (const product of manifest.products) {
    for (const field of ['sourceProductId', 'name', 'category']) {
      if (typeof product[field] !== 'string' || !product[field].trim() || product[field].length > 255) throw new Error(`Produit invalide : ${field}`);
    }
    if (ids.has(product.sourceProductId)) throw new Error('Identifiant source dupliqué.');
    ids.add(product.sourceProductId);
    if (!Array.isArray(product.images) || !product.images.length || product.images.length > 5) throw new Error('Chaque produit doit avoir entre 1 et 5 images R2.');
    const urls = new Set();
    for (const image of product.images) {
      if (typeof image.imageName !== 'string' || !image.imageName || image.imageName.length > 255 || typeof image.imageUrl !== 'string') throw new Error('Image invalide.');
      const url = new URL(image.imageUrl);
      if (url.origin !== origin || url.username || url.password || url.search || url.hash) throw new Error('Image extérieure au domaine R2 ou URL temporaire.');
      if (urls.has(image.imageUrl)) throw new Error('Image dupliquée.');
      urls.add(image.imageUrl);
    }
  }
  return manifest;
}

function buildPlan(manifest, targets) {
  const actions = [], unchanged = [], conflicts = [], used = new Set();
  for (const source of manifest.products) {
    const sameId = targets.find(target => target.id === source.sourceProductId);
    let target = sameId;
    let match = 'id';
    if (sameId && productKey(sameId) !== productKey(source)) {
      conflicts.push(`${source.name} : même identifiant mais nom/catégorie différents.`);
      continue;
    }
    if (!target) {
      const candidates = targets.filter(item => productKey(item) === productKey(source));
      const sources = manifest.products.filter(item => productKey(item) === productKey(source));
      if (candidates.length !== 1 || sources.length !== 1) {
        conflicts.push(`${source.name} : correspondance nom/catégorie absente ou ambiguë.`);
        continue;
      }
      target = candidates[0];
      match = 'name-category';
    }
    if (used.has(target.id)) { conflicts.push(`${source.name} : produit cible déjà utilisé.`); continue; }
    used.add(target.id);
    const before = target.productImages;
    const equal = JSON.stringify(before.map(image => image.imageUrl).sort()) === JSON.stringify(source.images.map(image => image.imageUrl).sort());
    if (equal) { unchanged.push(target.name); continue; }
    // Never silently overwrite actual photos already configured in production.
    if (before.some(image => !placeholder(image.imageUrl))) {
      conflicts.push(`${target.name} : possède déjà des photos différentes en production.`);
      continue;
    }
    actions.push({ productId: target.id, name: target.name, category: target.category, match, before, after: source.images.map(({ imageName, imageUrl }) => ({ imageName, imageUrl })) });
  }
  return { actions, unchanged, conflicts };
}

async function applyPlan(db, plan) {
  if (plan.conflicts.length) throw new Error('Conflits à résoudre : aucune modification appliquée.');
  await db.$transaction(async tx => {
    for (const action of plan.actions) {
      const current = await tx.item.findFirst({ where: { id: action.productId, type: 'SERVICE' }, include: { productImages: true } });
      if (!current || current.name !== action.name || current.category !== action.category || snapshot(current.productImages) !== snapshot(action.before)) throw new Error(`Modification concurrente : ${action.name}. Relancer l’audit.`);
      await tx.productImage.deleteMany({ where: { productId: action.productId } });
      await tx.productImage.createMany({ data: action.after.map(image => ({ id: `PIM-${randomUUID()}`, productId: action.productId, ...image })) });
    }
  }, { isolationLevel: 'Serializable', timeout: 120000 });
}

async function main() {
  require('dotenv').config({ quiet: true });
  const { PrismaClient } = require('@prisma/client');
  const mode = process.argv[2];
  if (!['export', 'import'].includes(mode)) throw new Error('Utilisation : node scripts/sync-product-images-r2.cjs export|import [--file chemin.json] [--apply]');
  if (mode === 'export' && process.argv.includes('--apply')) throw new Error('--apply est réservé à l’import.');
  const index = process.argv.indexOf('--file');
  if (index !== -1 && (!process.argv[index + 1] || process.argv[index + 1].startsWith('--'))) throw new Error('Chemin manquant après --file.');
  const file = path.resolve(index === -1 ? '.temp/product-images-r2.json' : process.argv[index + 1]);
  const origin = publicOrigin(process.env.R2_PUBLIC_BASE_URL || '');
  const db = new PrismaClient();
  try {
    if (mode === 'export') {
      const products = await db.item.findMany({ where: { type: 'SERVICE' }, select: { id: true, name: true, category: true, productImages: { select: { imageName: true, imageUrl: true }, orderBy: { id: 'asc' } } }, orderBy: { id: 'asc' } });
      const manifest = { version: 1, createdAt: new Date().toISOString(), publicOrigin: origin, products: [] };
      for (const product of products) {
        const images = product.productImages.filter(image => { try { return new URL(image.imageUrl).origin === origin; } catch { return false; } });
        if (images.length) manifest.products.push({ sourceProductId: product.id, name: product.name, category: product.category, images });
      }
      validateManifest(manifest, origin);
      if (!manifest.products.length) throw new Error('Aucune image R2 référencée dans cette base. Vérifier la base locale et enregistrer les photos sur les produits.');
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ mode, file, products: manifest.products.length, images: manifest.products.reduce((total, p) => total + p.images.length, 0), skippedWithoutR2Images: products.length - manifest.products.length }, null, 2));
      return;
    }
    const manifest = validateManifest(JSON.parse(await fs.readFile(file, 'utf8')), origin);
    const products = await db.item.findMany({ where: { type: 'SERVICE' }, include: { productImages: true } });
    const plan = buildPlan(manifest, products);
    console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', productsToUpdate: plan.actions.map(action => ({ name: action.name, match: action.match, images: action.after.length })), unchanged: plan.unchanged, conflicts: plan.conflicts }, null, 2));
    if (plan.conflicts.length) throw new Error('Audit en conflit : aucune modification appliquée.');
    if (!process.argv.includes('--apply') || !plan.actions.length) return;
    // Verify all publicly accessible image URLs before touching the database.
    const urls = new Set(plan.actions.flatMap(action => action.after.map(image => image.imageUrl)));
    for (const url of urls) {
      const response = await fetch(url, { method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (!response.ok || !/^image\//i.test(response.headers.get('content-type') || '')) throw new Error('Image R2 inaccessible : aucune modification appliquée.');
    }
    const backup = path.resolve('.temp/r2-image-sync', `${Date.now()}-${randomUUID()}.json`);
    await fs.mkdir(path.dirname(backup), { recursive: true });
    await fs.writeFile(backup, JSON.stringify({ createdAt: new Date().toISOString(), publicOrigin: origin, ...plan }, null, 2), { flag: 'wx', mode: 0o600 });
    console.log(`Sauvegarde des associations : ${backup}`);
    await applyPlan(db, plan);
    console.log(`${plan.actions.length} produits associés aux images R2. Aucun produit recréé, aucun fichier déplacé.`);
  } finally { await db.$disconnect(); }
}

module.exports = { buildPlan, validateManifest, applyPlan };
if (require.main === module) main().catch(error => {
  // Do not print Prisma errors containing connection strings or credentials.
  console.error(error.name === 'PrismaClientInitializationError' ? 'Connexion à la base impossible. Vérifier DATABASE_URL.' : error.message);
  process.exitCode = 1;
});
