import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname } from 'node:path';
import {
  r2Settings,
  putVerified,
  sha256,
} from '../src/ecommerce/products/product-image-storage';

async function main() {
  const apply = process.argv.includes('--apply');
  const sourceRoot = resolve(
    process.env.PRODUCT_IMAGES_SOURCE_ROOT || 'public/products',
  );
  const prisma = new PrismaClient();
  let settings: ReturnType<typeof r2Settings> | undefined;
  try {
    const images = await prisma.productImage.findMany({
      orderBy: { id: 'asc' },
    });
    const plan: {
      id: string;
      oldUrl: string;
      newUrl?: string;
      file: string;
      hash: string;
      contentType: string;
    }[] = [];
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    let external = 0;
    // Preflight every local reference before any upload or database mutation.
    for (const image of images) {
      const normalized = image.imageUrl.replace(/\\/g, '/');
      if (/^https?:\/\//i.test(normalized)) {
        external++;
        continue;
      }
      const match = /^\/?public\/products\/([^/]+)$/.exec(normalized);
      if (!match)
        throw new Error(`Chemin local non pris en charge : ${image.id}`);
      const file = resolve(sourceRoot, match[1]);
      const rel = relative(sourceRoot, file);
      if (rel.startsWith('..') || isAbsolute(rel))
        throw new Error(`Chemin hors dossier : ${image.id}`);
      const contentType = types[extname(file).toLowerCase()];
      if (!contentType)
        throw new Error(`Type non pris en charge : ${image.id}`);
      const body = await readFile(file);
      plan.push({
        id: image.id,
        oldUrl: image.imageUrl,
        file,
        hash: sha256(body),
        contentType,
      });
    }
    console.log(
      JSON.stringify(
        {
          mode: apply ? 'apply' : 'dry-run',
          referenced: images.length,
          local: plan.length,
          external,
          sourceRoot,
        },
        null,
        2,
      ),
    );
    if (!apply || !plan.length) return;
    settings = r2Settings(process.env);
    await mkdir('.temp/r2-migrations', { recursive: true });
    const manifest = resolve('.temp/r2-migrations', `${Date.now()}.json`);
    for (const entry of plan)
      entry.newUrl = `${settings.baseUrl}/products/migrated/${entry.hash}${extname(entry.file).toLowerCase()}`;
    await writeFile(
      manifest,
      JSON.stringify(
        { createdAt: new Date().toISOString(), bucket: settings.bucket, plan },
        null,
        2,
      ),
      { flag: 'wx', mode: 0o600 },
    );
    console.log(`Manifeste de sauvegarde : ${manifest}`);
    for (const entry of plan) {
      const body = await readFile(entry.file);
      if (sha256(body) !== entry.hash)
        throw new Error(`Source modifiée : ${entry.id}`);
      const key = `products/migrated/${entry.hash}${extname(entry.file).toLowerCase()}`;
      await putVerified(settings, key, body, entry.contentType);
      const response = await fetch(entry.newUrl!, {
        signal: AbortSignal.timeout(30000),
      });
      if (
        !response.ok ||
        sha256(new Uint8Array(await response.arrayBuffer())) !== entry.hash
      )
        throw new Error(`Vérification URL publique échouée : ${entry.id}`);
    }
    // All public originals verified before one atomic, concurrency-safe switch.
    await prisma.$transaction(
      async (tx) => {
        for (const entry of plan) {
          const result = await tx.productImage.updateMany({
            where: { id: entry.id, imageUrl: entry.oldUrl },
            data: { imageUrl: entry.newUrl },
          });
          if (result.count !== 1)
            throw new Error(
              `Image modifiée simultanément : ${entry.id}. Relancer la migration.`,
            );
        }
      },
      { timeout: 120000 },
    );
    console.log(
      `${plan.length} références migrées. Fichiers locaux conservés.`,
    );
  } finally {
    settings?.client.destroy();
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Migration échouée');
  process.exitCode = 1;
});
