/**
 * Configuration centralisée pour les uploads de fichiers
 * Utilisée par tous les contrôleurs d'upload (products, categories, etc.)
 */
export const FILE_UPLOAD_CONFIG = {
  // Dossiers de destination
  UPLOAD_DIRS: {
    PRODUCTS: './public/products',
    CATEGORIES: './public/categories',
    BRANDS: './public/brands',
    SUBSIDIARY_LOGOS: './public/subsidiaries',
  },

  // Limites
  LIMITS: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES_PER_UPLOAD: 5,
    MAX_IMAGE_WIDTH: 2000,
    MAX_IMAGE_HEIGHT: 2000,
  },

  // Types acceptés
  ALLOWED_MIME_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  ALLOWED_EXTENSIONS: {
    IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },

  // Messages d'erreur
  ERRORS: {
    INVALID_FILE_TYPE: 'Only image files (jpg, png, gif, webp) are allowed',
    FILE_TOO_LARGE: 'File size exceeds maximum limit of 5MB',
    TOO_MANY_FILES: 'Maximum 5 files per upload',
    INVALID_MIME_TYPE: 'Invalid file MIME type',
  },
};
