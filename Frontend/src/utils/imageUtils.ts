/**
 * Utilitaires pour gérer les images du backend
 * Centralise la construction d'URLs et la gestion des fallbacks
 */

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Construit l'URL absolue pour une image
 * @param relativeUrl - Chemin relatif stocké en BD (ex: /public/products/img-xxx.jpg)
 * @param fallback - Image par défaut si pas d'URL
 * @returns URL absolue (ex: http://localhost:3000/public/products/img-xxx.jpg)
 */
export const getImageUrl = (
  relativeUrl?: string,
  fallback: string = '/default-product.png',
): string => {
  if (!relativeUrl) {
    return fallback;
  }
  return `${BACKEND_URL}${relativeUrl}`;
};

/**
 * Valide une URL d'image côté frontend
 */
export const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Formate les fichiers sélectionnés pour upload
 * @param files - FileList ou Array de File
 * @returns FormData formaté pour multipart/form-data
 */
export const prepareFilesForUpload = (
  files: FileList | File[],
): FormData => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('productImages', file);
  });
  return formData;
};

/**
 * Gère les erreurs d'upload d'image
 */
export const getImageUploadErrorMessage = (
  status: number,
  errorMessage: string,
): string => {
  const errorMap: Record<number, string> = {
    400: 'Invalid file type or size',
    413: 'File too large (max 5MB)',
    401: 'Unauthorized - please login',
    403: 'Forbidden - no permission',
    500: 'Server error - please try again',
  };

  return errorMap[status] || errorMessage || 'Upload failed';
};
