"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProductImageStorage_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductImageStorage = exports.sha256 = void 0;
exports.r2Settings = r2Settings;
exports.putVerified = putVerified;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const image_util_1 = require("../../common/utils/image.util");
function r2Settings(env) {
    const required = [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME',
        'R2_PUBLIC_BASE_URL',
    ];
    for (const key of required)
        if (!env[key]?.trim())
            throw new Error(`Configuration R2 manquante : ${key}`);
    const url = new URL(env.R2_PUBLIC_BASE_URL);
    if (url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/')
        throw new Error('R2_PUBLIC_BASE_URL doit être une origine HTTPS publique sans chemin');
    if (!/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID))
        throw new Error('R2_ACCOUNT_ID invalide');
    return {
        bucket: env.R2_BUCKET_NAME,
        baseUrl: url.origin,
        client: new client_s3_1.S3Client({
            region: 'auto',
            endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: env.R2_ACCESS_KEY_ID,
                secretAccessKey: env.R2_SECRET_ACCESS_KEY,
            },
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        }),
    };
}
const sha256 = (body) => (0, node_crypto_1.createHash)('sha256').update(body).digest('hex');
exports.sha256 = sha256;
async function putVerified(settings, key, body, contentType) {
    await settings.client.send(new client_s3_1.PutObjectCommand({
        Bucket: settings.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: { sha256: (0, exports.sha256)(body) },
    }));
    const stored = await settings.client.send(new client_s3_1.GetObjectCommand({ Bucket: settings.bucket, Key: key }));
    if (!stored.Body ||
        (0, exports.sha256)(await stored.Body.transformToByteArray()) !== (0, exports.sha256)(body))
        throw new Error('Vérification du contenu R2 échouée');
    return `${settings.baseUrl}/${key}`;
}
let ProductImageStorage = ProductImageStorage_1 = class ProductImageStorage {
    logger = new common_1.Logger(ProductImageStorage_1.name);
    settings;
    constructor(config) {
        const mode = config.get('PRODUCT_IMAGE_STORAGE') || 'r2';
        if (mode === 'r2')
            this.settings = r2Settings(Object.fromEntries([
                'R2_ACCOUNT_ID',
                'R2_ACCESS_KEY_ID',
                'R2_SECRET_ACCESS_KEY',
                'R2_BUCKET_NAME',
                'R2_PUBLIC_BASE_URL',
            ].map((k) => [k, config.get(k)])));
        else if (mode !== 'local' ||
            config.get('NODE_ENV') === 'production')
            throw new Error('Le stockage local des images doit être explicitement réservé au développement');
    }
    async upload(files = []) {
        const result = [];
        for (const file of files) {
            (0, image_util_1.validateImageFile)(file);
            const b = file.buffer;
            const valid = b?.length &&
                ((file.mimetype === 'image/jpeg' &&
                    b[0] === 0xff &&
                    b[1] === 0xd8 &&
                    b[2] === 0xff) ||
                    (file.mimetype === 'image/png' &&
                        b
                            .subarray(0, 8)
                            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
                    (file.mimetype === 'image/gif' &&
                        ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString())) ||
                    (file.mimetype === 'image/webp' &&
                        b.subarray(0, 4).toString() === 'RIFF' &&
                        b.subarray(8, 12).toString() === 'WEBP'));
            if (!valid)
                throw new common_1.BadRequestException('Le contenu du fichier ne correspond pas au type image annoncé');
        }
        for (const file of files) {
            const filename = `${(0, node_crypto_1.randomUUID)()}${(0, node_path_1.extname)(file.originalname).toLowerCase()}`;
            let imageUrl;
            if (this.settings)
                imageUrl = await putVerified(this.settings, `products/${filename}`, file.buffer, file.mimetype);
            else {
                const directory = (0, node_path_1.resolve)(process.cwd(), 'public/products');
                await (0, promises_1.mkdir)(directory, { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.resolve)(directory, filename), file.buffer, {
                    flag: 'wx',
                });
                imageUrl = `/public/products/${filename}`;
            }
            result.push({ imageName: file.originalname, imageUrl });
        }
        return result;
    }
    retainDetached(url) {
        this.logger.debug(`Image conservée après détachement : ${url}`);
    }
};
exports.ProductImageStorage = ProductImageStorage;
exports.ProductImageStorage = ProductImageStorage = ProductImageStorage_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ProductImageStorage);
//# sourceMappingURL=product-image-storage.js.map