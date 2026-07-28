import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { FILE_UPLOAD_CONFIG } from '../constants/file-upload.const';

/**
 * Valide un fichier image avant upload
 * @param file - Fichier Multer
 * @throws BadRequestException si validation échoue
 */
export const validateImageFile = (file: Express.Multer.File): void => {
  // ✅ Vérifier l'extension
  const ext = extname(file.originalname).toLowerCase();
  if (!FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.IMAGES.includes(ext)) {
    throw new BadRequestException(FILE_UPLOAD_CONFIG.ERRORS.INVALID_FILE_TYPE);
  }

  // ✅ Vérifier le type MIME
  if (!FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.IMAGES.includes(file.mimetype)) {
    throw new BadRequestException(FILE_UPLOAD_CONFIG.ERRORS.INVALID_MIME_TYPE);
  }

  // ✅ Vérifier la taille (Multer le fait aussi, mais redondant = sûr)
  if (file.size > FILE_UPLOAD_CONFIG.LIMITS.MAX_FILE_SIZE) {
    throw new BadRequestException(FILE_UPLOAD_CONFIG.ERRORS.FILE_TOO_LARGE);
  }
};

/**
 * Génère un nom de fichier sécurisé avec renommage aléatoire
 * Format : img-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p.jpg
 */
export const generateSecureFilename = (
  file: Express.Multer.File,
  prefix: string = 'img',
): string => {
  const ext = extname(file.originalname);
  const randomHash = Array(32)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');

  return `${prefix}-${randomHash}${ext}`;
};

/**
 * Construit le chemin relatif stocké en BD
 */
export const buildRelativeImagePath = (
  uploadDir: string,
  filename: string,
): string => {
  return `/public/${uploadDir.replace('./public/', '')}/${filename}`;
};

/**
 * Supprime un fichier image physique (après suppression en BD)
 */
export const deleteImageFile = async (relativePath: string): Promise<void> => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const fullPath = path.join(process.cwd(), relativePath);

    // Vérifications de sécurité
    if (!fullPath.includes('/public/')) {
      throw new Error('Invalid path: file not in public directory');
    }

    await fs.unlink(fullPath);
  } catch (error) {
    // Log mais ne pas lever d'erreur (suppression en BD = succès)
    console.warn(`Failed to delete image file: ${relativePath}`, error);
  }
};
