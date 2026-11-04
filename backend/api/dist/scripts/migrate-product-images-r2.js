"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const product_image_storage_1 = require("../src/ecommerce/products/product-image-storage");
async function main() {
    const apply = process.argv.includes('--apply');
    const sourceRoot = (0, node_path_1.resolve)(process.env.PRODUCT_IMAGES_SOURCE_ROOT || 'public/products');
    const prisma = new client_1.PrismaClient();
    let settings;
    try {
        const images = await prisma.productImage.findMany({
            orderBy: { id: 'asc' },
        });
        const plan = [];
        const types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        };
        let external = 0;
        for (const image of images) {
            const normalized = image.imageUrl.replace(/\\/g, '/');
            if (/^https?:\/\//i.test(normalized)) {
                external++;
                continue;
            }
            const match = /^\/?public\/products\/([^/]+)$/.exec(normalized);
            if (!match)
                throw new Error(`Chemin local non pris en charge : ${image.id}`);
            const file = (0, node_path_1.resolve)(sourceRoot, match[1]);
            const rel = (0, node_path_1.relative)(sourceRoot, file);
            if (rel.startsWith('..') || (0, node_path_1.isAbsolute)(rel))
                throw new Error(`Chemin hors dossier : ${image.id}`);
            const contentType = types[(0, node_path_1.extname)(file).toLowerCase()];
            if (!contentType)
                throw new Error(`Type non pris en charge : ${image.id}`);
            const body = await (0, promises_1.readFile)(file);
            plan.push({
                id: image.id,
                oldUrl: image.imageUrl,
                file,
                hash: (0, product_image_storage_1.sha256)(body),
                contentType,
            });
        }
        console.log(JSON.stringify({
            mode: apply ? 'apply' : 'dry-run',
            referenced: images.length,
            local: plan.length,
            external,
            sourceRoot,
        }, null, 2));
        if (!apply || !plan.length)
            return;
        settings = (0, product_image_storage_1.r2Settings)(process.env);
        await (0, promises_1.mkdir)('.temp/r2-migrations', { recursive: true });
        const manifest = (0, node_path_1.resolve)('.temp/r2-migrations', `${Date.now()}.json`);
        for (const entry of plan)
            entry.newUrl = `${settings.baseUrl}/products/migrated/${entry.hash}${(0, node_path_1.extname)(entry.file).toLowerCase()}`;
        await (0, promises_1.writeFile)(manifest, JSON.stringify({ createdAt: new Date().toISOString(), bucket: settings.bucket, plan }, null, 2), { flag: 'wx', mode: 0o600 });
        console.log(`Manifeste de sauvegarde : ${manifest}`);
        for (const entry of plan) {
            const body = await (0, promises_1.readFile)(entry.file);
            if ((0, product_image_storage_1.sha256)(body) !== entry.hash)
                throw new Error(`Source modifiée : ${entry.id}`);
            const key = `products/migrated/${entry.hash}${(0, node_path_1.extname)(entry.file).toLowerCase()}`;
            await (0, product_image_storage_1.putVerified)(settings, key, body, entry.contentType);
            const response = await fetch(entry.newUrl, {
                signal: AbortSignal.timeout(30000),
            });
            if (!response.ok ||
                (0, product_image_storage_1.sha256)(new Uint8Array(await response.arrayBuffer())) !== entry.hash)
                throw new Error(`Vérification URL publique échouée : ${entry.id}`);
        }
        await prisma.$transaction(async (tx) => {
            for (const entry of plan) {
                const result = await tx.productImage.updateMany({
                    where: { id: entry.id, imageUrl: entry.oldUrl },
                    data: { imageUrl: entry.newUrl },
                });
                if (result.count !== 1)
                    throw new Error(`Image modifiée simultanément : ${entry.id}. Relancer la migration.`);
            }
        }, { timeout: 120000 });
        console.log(`${plan.length} références migrées. Fichiers locaux conservés.`);
    }
    finally {
        settings?.client.destroy();
        await prisma.$disconnect();
    }
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Migration échouée');
    process.exitCode = 1;
});
//# sourceMappingURL=migrate-product-images-r2.js.map