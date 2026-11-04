"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderDesignUploadInterceptor = exports.ORDER_FILE_LIMIT = void 0;
exports.validateDesignHeader = validateDesignHeader;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
exports.ORDER_FILE_LIMIT = 10 * 1024 * 1024;
const MIME_TYPES = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
};
const staging = (0, path_1.resolve)(process.cwd(), 'private', 'order-uploads');
const destination = (0, path_1.resolve)(process.cwd(), 'public', 'order_item_img');
function validateDesignHeader(extension, header) {
    const valid = extension === '.pdf'
        ? header.subarray(0, 5).toString() === '%PDF-'
        : extension === '.png'
            ? header
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : ['.jpg', '.jpeg'].includes(extension)
                ? header.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
                : extension === '.webp' &&
                    header.subarray(0, 4).toString() === 'RIFF' &&
                    header.subarray(8, 12).toString() === 'WEBP';
    if (!valid)
        throw new common_1.BadRequestException('Le contenu du fichier ne correspond pas au format autorisé.');
}
async function storageSize(directory) {
    let entries;
    try {
        entries = await fs_1.promises.readdir(directory, { withFileTypes: true });
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return 0;
        throw error;
    }
    let total = 0;
    for (const entry of entries) {
        const path = (0, path_1.join)(directory, entry.name);
        if (entry.isDirectory())
            total += await storageSize(path);
        else if (entry.isFile())
            total += (await fs_1.promises.stat(path)).size;
    }
    return total;
}
function quotaBytes(name, defaultMb) {
    const mb = Number(process.env[name] ?? defaultMb);
    if (!Number.isFinite(mb) || mb <= 0)
        throw new Error(`Invalid ${name}`);
    return mb * 1024 * 1024;
}
let publication = Promise.resolve();
let activeUploads = 0;
async function publish(files, subsidiaryId) {
    if (!files.length)
        return;
    if (!/^[a-zA-Z0-9_-]+$/.test(subsidiaryId))
        throw new common_1.BadRequestException('Filiale invalide.');
    for (const file of files) {
        const handle = await fs_1.promises.open(file.path, 'r');
        try {
            const header = Buffer.alloc(12);
            await handle.read(header, 0, 12, 0);
            validateDesignHeader((0, path_1.extname)(file.originalname).toLowerCase(), header);
        }
        finally {
            await handle.close();
        }
    }
    const previous = publication;
    let release;
    publication = new Promise((resolve) => {
        release = resolve;
    });
    await previous;
    try {
        const tenantDirectory = (0, path_1.join)(destination, subsidiaryId);
        const addedSize = files.reduce((sum, file) => sum + file.size, 0);
        const [globalSize, tenantSize] = await Promise.all([
            storageSize(destination),
            storageSize(tenantDirectory),
        ]);
        if (globalSize + addedSize >
            quotaBytes('ORDER_UPLOAD_GLOBAL_QUOTA_MB', 5120) ||
            tenantSize + addedSize >
                quotaBytes('ORDER_UPLOAD_SUBSIDIARY_QUOTA_MB', 1024)) {
            throw new common_1.PayloadTooLargeException('Quota de stockage des fichiers de commande atteint.');
        }
        await fs_1.promises.mkdir(tenantDirectory, { recursive: true, mode: 0o755 });
        for (const file of files) {
            const filename = `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname).toLowerCase()}`;
            const target = (0, path_1.join)(tenantDirectory, filename);
            await fs_1.promises.rename(file.path, target);
            file.path = target;
            file.filename = `${subsidiaryId}/${filename}`;
        }
    }
    finally {
        release();
    }
}
const Multipart = (0, platform_express_1.FileFieldsInterceptor)([{ name: 'designFiles', maxCount: 10 }], {
    storage: (0, multer_1.diskStorage)({
        destination: (_req, _file, callback) => {
            void fs_1.promises.mkdir(staging, { recursive: true, mode: 0o700 }).then(() => callback(null, staging), (error) => callback(error, staging));
        },
        filename: (_req, _file, callback) => callback(null, (0, crypto_1.randomUUID)()),
    }),
    limits: {
        fileSize: exports.ORDER_FILE_LIMIT,
        files: 10,
        fields: 20,
        parts: 30,
        fieldSize: 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        if (MIME_TYPES[(0, path_1.extname)(file.originalname).toLowerCase()] !==
            file.mimetype ||
            !MIME_TYPES[(0, path_1.extname)(file.originalname).toLowerCase()]) {
            return callback(new common_1.BadRequestException('Formats autorisés : PDF, PNG, JPEG et WebP.'), false);
        }
        callback(null, true);
    },
});
let OrderDesignUploadInterceptor = class OrderDesignUploadInterceptor {
    multipart = new Multipart();
    async intercept(context, next) {
        if (activeUploads >= 4)
            throw new common_1.HttpException('Trop de transferts simultanés.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        activeUploads++;
        try {
            const disk = await fs_1.promises.statfs(process.cwd());
            if (disk.bavail * disk.bsize < 500 * 1024 * 1024) {
                throw new common_1.PayloadTooLargeException('Espace disque insuffisant pour recevoir des fichiers.');
            }
            const request = context.switchToHttp().getRequest();
            const result = await this.multipart.intercept(context, {
                handle: () => {
                    const files = request.files
                        ?.designFiles ?? [];
                    return (0, rxjs_1.defer)(() => publish(files, request.user.subsidiaryId)).pipe((0, rxjs_1.switchMap)(() => next.handle()), (0, rxjs_1.catchError)((error) => (0, rxjs_1.defer)(async () => {
                        await Promise.all(files.map((file) => fs_1.promises.rm(file.path, { force: true })));
                        throw error;
                    })));
                },
            });
            return result.pipe((0, rxjs_1.finalize)(() => {
                activeUploads--;
            }));
        }
        catch (error) {
            activeUploads--;
            throw error;
        }
    }
};
exports.OrderDesignUploadInterceptor = OrderDesignUploadInterceptor;
exports.OrderDesignUploadInterceptor = OrderDesignUploadInterceptor = __decorate([
    (0, common_1.Injectable)()
], OrderDesignUploadInterceptor);
//# sourceMappingURL=order-design-upload.interceptor.js.map