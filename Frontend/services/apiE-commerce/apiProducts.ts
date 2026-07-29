import { api } from '../api';
import { Product } from '../../types/models';
import { ProductFormData } from '../../types/forms';

/**
 * Récupère la page du catalogue de services visible sur le site vitrine
 * (donnée globale, filtrée isActive/isVisibleOnSite côté backend).
 */
export const getProducts = async (page: number, category?: string) => {
    let url = `/products/get-all-products?page=${page}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    const { data } = await api.get(url);
    return data;
};

export const getFavoriteProducts = async (ids: string[]) => {
  const { data } = await api.post('/products/favorites', {
    ids,
  });

  return data;
};
export const getProduitsSearch = async (searchTerm: string) => {
    const { data } = await api.get(`/products/search-products?query=${searchTerm}`);
    return data;
};

/**
 * Récupère tout le catalogue de services (vue admin, donnée globale — plus de scope filiale).
 */
export const getServicesCatalog = async () => {
    const { data } = await api.get('/products');
    return data;
};

/**
 * Récupère un service spécifique par son ID.
 * @param id - L'ID du service à récupérer.
 */
export const getProductById = async (id: string) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
};

/**
 * Crée un nouveau service au catalogue.
 * @param productData - Les données du service à créer.
 */
export const createProduct = async (productData: ProductFormData) => {
    const formData = new FormData();

    // Ajoute les champs de texte et numériques
    Object.entries(productData).forEach(([key, value]) => {
        if (key !== 'productImages' && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    // Ajoute les fichiers d'images
    if (productData.productImages) {
        productData.productImages.forEach(file => {
            formData.append('productImages', file);
        });
    }

    const { data } = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

/**
 * Met à jour un service existant.
 * @param id - L'ID du service à mettre à jour.
 * @param productData - Les données du service à mettre à jour.
 */
export const updateProduct = async (id: string, productData: Partial<ProductFormData> & { existingImages?: string[] }): Promise<Product> => {
    const formData = new FormData();

    // Ajoute les champs de texte et numériques
    Object.entries(productData).forEach(([key, value]) => {
        if (key !== 'productImages' && key !== 'existingImages' && value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    // Ajoute les nouveaux fichiers d'images s'ils sont fournis
    if (productData.productImages && productData.productImages.length > 0) {
        productData.productImages.forEach(file => {
            formData.append('productImages', file);
        });
    }

    // Images existantes à conserver — permet de retirer une image individuellement
    // sans supprimer tout le lot au prochain upload (voir products.service.ts#update).
    if (productData.existingImages && productData.existingImages.length > 0) {
        productData.existingImages.forEach(url => {
            formData.append('existingImages', url);
        });
    } else {
        formData.append('existingImages', '');
    }

    const { data } = await api.patch(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

/**
 * Supprime un service par son ID.
 * @param id - L'ID du service à supprimer.
 */
export const deleteProduct = async (id: string) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
};
