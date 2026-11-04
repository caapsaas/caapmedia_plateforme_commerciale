"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const document_storage_1 = require("./document-storage");
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
let FileUploadService = class FileUploadService {
    publicPath = path.join(__dirname, '..', '..', '..', '..', 'public');
    async uploadFile(buffer, originalFilename, options = {}) {
        const { subfolder = 'uploads', maxSizeMb = 10, allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg',
        ], } = options;
        if (buffer.length > maxSizeMb * 1024 * 1024) {
            throw new common_1.BadRequestException(`File size exceeds ${maxSizeMb}MB limit`);
        }
        const mimeType = this.getMimeType(buffer, originalFilename);
        if (!allowedMimes.includes(mimeType)) {
            throw new common_1.BadRequestException(`File type not allowed. Allowed types: ${allowedMimes.join(', ')}`);
        }
        if (options.privateSubsidiaryId &&
            !/^[a-zA-Z0-9_-]+$/.test(options.privateSubsidiaryId)) {
            throw new common_1.BadRequestException('Invalid subsidiary');
        }
        const uploadDir = options.privateSubsidiaryId
            ? path.join(document_storage_1.PRIVATE_DOCUMENT_ROOT, 'employee-documents', options.privateSubsidiaryId)
            : path.join(this.publicPath, subfolder);
        await fs_1.promises.mkdir(uploadDir, {
            recursive: true,
            mode: options.privateSubsidiaryId ? 0o700 : 0o755,
        });
        const ext = path.extname(originalFilename);
        const filename = `${(0, uuid_1.v4)()}${ext}`;
        const filepath = path.join(uploadDir, filename);
        await fs_1.promises.writeFile(filepath, buffer, {
            mode: options.privateSubsidiaryId ? 0o600 : 0o644,
        });
        const url = options.privateSubsidiaryId
            ? `${document_storage_1.PRIVATE_DOCUMENT_PREFIX}employee-documents/${options.privateSubsidiaryId}/${filename}`
            : `/public/${subfolder}/${filename}`;
        return { url, filename };
    }
    async deleteFile(url) {
        if (!url)
            return;
        try {
            const urlPath = url.replace('/public/', '');
            const filepath = path.join(this.publicPath, urlPath);
            const realPath = await fs_1.promises.realpath(filepath);
            const publicRealPath = await fs_1.promises.realpath(this.publicPath);
            if (!realPath.startsWith(publicRealPath)) {
                throw new common_1.BadRequestException('Invalid file path');
            }
            await fs_1.promises.unlink(filepath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    getMimeType(buffer, filename) {
        const ext = path.extname(filename).toLowerCase();
        if (buffer.length > 4) {
            const magicBytes = buffer.slice(0, 4);
            if (magicBytes[0] === 0x25 &&
                magicBytes[1] === 0x50 &&
                magicBytes[2] === 0x44 &&
                magicBytes[3] === 0x46) {
                return 'application/pdf';
            }
            if (magicBytes[0] === 0xff &&
                magicBytes[1] === 0xd8 &&
                magicBytes[2] === 0xff) {
                return 'image/jpeg';
            }
            if (magicBytes[0] === 0x89 &&
                magicBytes[1] === 0x50 &&
                magicBytes[2] === 0x4e &&
                magicBytes[3] === 0x47) {
                return 'image/png';
            }
        }
        const extMimeMap = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
        };
        return extMimeMap[ext] || 'application/octet-stream';
    }
};
exports.FileUploadService = FileUploadService;
exports.FileUploadService = FileUploadService = __decorate([
    (0, common_1.Injectable)()
], FileUploadService);
//# sourceMappingURL=file-upload.service.js.map