/**
 * L'URL de base du backend.
 * En développement, cela pointe vers votre serveur local.
 * En production, cela devrait être l'URL de votre API déployée.
 */
const API_BASE_URL = process.env.NEST_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Construit l'URL complète pour une ressource image du backend.
 * @param relativeUrl - L'URL relative de l'image stockée en base de données (ex: /api-caapsaas/products/image.jpg).
 * @returns L'URL complète et accessible par le navigateur.
 */
export const getImageUrl = (relativeUrl: string): string => {
    return `${API_BASE_URL}${relativeUrl}`;
};