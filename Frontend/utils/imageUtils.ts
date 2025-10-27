/**
 * L'URL de base du backend.
 * En développement, cela pointe vers votre serveur local.
 * En production, cela devrait être l'URL de votre API déployée.
 */
const BACKEND_URL = process.env.NEST_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Construit l'URL complète pour une ressource image du backend.
 * @param relativeUrl - L'URL relative de l'image stockée en base de données (ex: /public/products/image.jpg).
 * @returns L'URL complète et accessible par le navigateur.
 */
export const getImageUrl = (relativeUrl: string): string => {
    if (!relativeUrl) {
        return ''; // ou une image par défaut
    }
    // L'URL relative commence déjà par '/', donc on concatène directement.
    return `${BACKEND_URL}${relativeUrl}`;
};