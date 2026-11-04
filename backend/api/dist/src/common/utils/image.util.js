"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFile = exports.buildRelativeImagePath = exports.generateSecureFilename = exports.validateImageFile = void 0;
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const file_upload_const_1 = require("../constants/file-upload.const");
const validateImageFile = (file) => {
    const ext = (0, path_1.extname)(file.originalname).toLowerCase();
    if (!file_upload_const_1.FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.IMAGES.includes(ext)) {
        throw new common_1.BadRequestException(file_upload_const_1.FILE_UPLOAD_CONFIG.ERRORS.INVALID_FILE_TYPE);
    }
    if (!file_upload_const_1.FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.IMAGES.includes(file.mimetype)) {
        throw new common_1.BadRequestException(file_upload_const_1.FILE_UPLOAD_CONFIG.ERRORS.INVALID_MIME_TYPE);
    }
    if (file.size > file_upload_const_1.FILE_UPLOAD_CONFIG.LIMITS.MAX_FILE_SIZE) {
        throw new common_1.BadRequestException(file_upload_const_1.FILE_UPLOAD_CONFIG.ERRORS.FILE_TOO_LARGE);
    }
};
exports.validateImageFile = validateImageFile;
const generateSecureFilename = (file, prefix = 'img') => {
    const ext = (0, path_1.extname)(file.originalname);
    const randomHash = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
    return `${prefix}-${randomHash}${ext}`;
};
exports.generateSecureFilename = generateSecureFilename;
const buildRelativeImagePath = (uploadDir, filename) => {
    return `/public/${uploadDir.replace('./public/', '')}/${filename}`;
};
exports.buildRelativeImagePath = buildRelativeImagePath;
const deleteImageFile = async (relativePath) => {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const fullPath = path.join(process.cwd(), relativePath);
        if (!fullPath.includes('/public/')) {
            throw new Error('Invalid path: file not in public directory');
        }
        await fs.unlink(fullPath);
    }
    catch (error) {
        console.warn(`Failed to delete image file: ${relativePath}`, error);
    }
};
exports.deleteImageFile = deleteImageFile;
//# sourceMappingURL=image.util.js.map