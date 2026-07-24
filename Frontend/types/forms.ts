import { Product, StockItem } from './models';

// Formulaire de service (catalogue) : pas de prix, pas de stock. Les
// spécifications techniques se configurent séparément via le Builder
// (Chantier 5), pas dans ce formulaire d'informations générales.
export type ProductFormData = Omit<Product, 'id' | 'productImages'> & {
    productImages?: File[];
};

// Formulaire de produit de stock (matière première) : garde prix/stock, scopé filiale.
// baseUnit/packagingUnits sont en lecture seule (renvoyés par l'API) — le
// formulaire n'envoie que baseUnitId ; les unités d'emballage se gèrent à part.
export type StockItemFormData = Omit<StockItem, 'id' | 'subsidiaryId' | 'stock' | 'price' | 'baseUnit' | 'packagingUnits'> & {
    stock: string | number;
    price: string | number;
};
