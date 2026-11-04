export declare const FILE_UPLOAD_CONFIG: {
    UPLOAD_DIRS: {
        PRODUCTS: string;
        CATEGORIES: string;
        BRANDS: string;
        SUBSIDIARY_LOGOS: string;
    };
    LIMITS: {
        MAX_FILE_SIZE: number;
        MAX_FILES_PER_UPLOAD: number;
        MAX_IMAGE_WIDTH: number;
        MAX_IMAGE_HEIGHT: number;
    };
    ALLOWED_MIME_TYPES: {
        IMAGES: string[];
    };
    ALLOWED_EXTENSIONS: {
        IMAGES: string[];
    };
    ERRORS: {
        INVALID_FILE_TYPE: string;
        FILE_TOO_LARGE: string;
        TOO_MANY_FILES: string;
        INVALID_MIME_TYPE: string;
    };
};
