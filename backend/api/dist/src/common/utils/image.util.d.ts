export declare const validateImageFile: (file: Express.Multer.File) => void;
export declare const generateSecureFilename: (file: Express.Multer.File, prefix?: string) => string;
export declare const buildRelativeImagePath: (uploadDir: string, filename: string) => string;
export declare const deleteImageFile: (relativePath: string) => Promise<void>;
