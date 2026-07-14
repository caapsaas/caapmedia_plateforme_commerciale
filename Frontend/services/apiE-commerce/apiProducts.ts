import { api } from '../api';
import { Product } from '../../types/models';
import { ProductFormData } from '../../types/forms';

export type UpdateProductSellingAndPriceData = {
    price: string | number;
    sellingPrice: string | number;
};

/**
 * Récupère tous les produits peut importe la filiale pour la partie e-commerce
 */
export const getProducts = async (page: number, mainCategory?: string, category?: string) => {
    let url = `/products/get-all-products?page=${page}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    else if (mainCategory) url += `&mainCategory=${encodeURIComponent(mainCategory)}`;
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
 * Récupère tous les produits.
 * Le backend filtre automatiquement par la filiale de l'utilisateur connecté.
 */
export const getProductsBySubsidiary = async () => {
    const { data } = await api.get('/products');
    return data;
};

/**
 * Récupère un produit spécifique par son ID.
 * @param id - L'ID du produit à récupérer.
 */
export const getProductById = async (id: string) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
};

/**
 * Crée un nouveau produit.
 * @param productData - Les données du produit à créer.
 */
export const createProduct = async (productData: ProductFormData) => {
    const formData = new FormData();

    // Ajoute les champs de texte et numériques
    Object.entries(productData).forEach(([key, value]) => {
        if (key !== 'productImages' && key !== 'configurableOptions' && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    // Ajoute les options configurables si elles existent
    if (productData.configurableOptions) {
        productData.configurableOptions.forEach((opt, index) => {
            formData.append(`configurableOptions[${index}][optionType]`, opt.optionType);
            formData.append(`configurableOptions[${index}][item][optionName]`, opt.item.optionName);
            formData.append(`configurableOptions[${index}][item][multiplier]`, String(opt.item.multiplier));
        });
    }

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
 * Met à jour le prix d'un produit.
 * @param id - L'ID du produit à mettre à jour.
 * @param updateData - Les données du produit à mettre à jour.
 */
export const updateProductSellingAndPrice = async (id: string, updateData: UpdateProductSellingAndPriceData) => {
    const { data } = await api.patch(`/products/${id}/update-price`, updateData);
    return data;
}

/**
 * Met à jour un produit existant.
 * @param id - L'ID du produit à mettre à jour.
 * @param productData - Les données du produit à mettre à jour.
 */
export const updateProduct = async (id: string, productData: Partial<ProductFormData>): Promise<Product> => {
    const formData = new FormData();

    // Ajoute les champs de texte et numériques
    Object.entries(productData).forEach(([key, value]) => {
        if (key !== 'productImages' && key !== 'configurableOptions' && value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    // Ajoute les options configurables si elles sont fournies
    if (productData.configurableOptions) {
        productData.configurableOptions.forEach((opt, index) => {
            formData.append(`configurableOptions[${index}][optionType]`, opt.optionType);
            formData.append(`configurableOptions[${index}][item][optionName]`, opt.item.optionName);
            formData.append(`configurableOptions[${index}][item][multiplier]`, String(opt.item.multiplier));
        });
    }

    // Ajoute les nouveaux fichiers d'images s'ils sont fournis
    if (productData.productImages && productData.productImages.length > 0) {
        productData.productImages.forEach(file => {
            formData.append('productImages', file);
        });
    }

    const { data } = await api.patch(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

/**
 * Supprime un produit par son ID.
 * @param id - L'ID du produit à supprimer.
 */
export const deleteProduct = async (id: string) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
};

/**
 * Demande la génération d'une nouvelle image pour un produit via l'IA.
 * @param productId - L'ID du produit.
 */
export const generateProductImage = async (productId: string): Promise<Product> => {
    const { data } = await api.post<Product>(`/products/${productId}/generate-image`);
    return data;
};
