"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_UPLOAD_CONFIG = void 0;
exports.FILE_UPLOAD_CONFIG = {
    UPLOAD_DIRS: {
        PRODUCTS: './public/products',
        CATEGORIES: './public/categories',
        BRANDS: './public/brands',
        SUBSIDIARY_LOGOS: './public/subsidiaries',
    },
    LIMITS: {
        MAX_FILE_SIZE: 5 * 1024 * 1024,
        MAX_FILES_PER_UPLOAD: 5,
        MAX_IMAGE_WIDTH: 2000,
        MAX_IMAGE_HEIGHT: 2000,
    },
    ALLOWED_MIME_TYPES: {
        IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
    ALLOWED_EXTENSIONS: {
        IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    ERRORS: {
        INVALID_FILE_TYPE: 'Only image files (jpg, png, gif, webp) are allowed',
        FILE_TOO_LARGE: 'File size exceeds maximum limit of 5MB',
        TOO_MANY_FILES: 'Maximum 5 files per upload',
        INVALID_MIME_TYPE: 'Invalid file MIME type',
    },
};
//# sourceMappingURL=file-upload.const.js.map