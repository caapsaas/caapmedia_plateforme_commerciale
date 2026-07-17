import { Product } from './models';

export enum OptionType {
  FORMATS = 'FORMATS',
  GRAMMAGES = 'GRAMMAGES',
  PRINTSIDES = 'PRINTSIDES',
  LAMINATIONS = 'LAMINATIONS',
  SIZES = 'SIZES',
  COLORS = 'COLORS',
  MATERIALS = 'MATERIALS',
  DIMENSIONS = 'DIMENSIONS',
  BINDINGS = 'BINDINGS',
  FOLDINGS = 'FOLDINGS',
  CORNERS = 'CORNERS',
  EYELETS = 'EYELETS',
  PAGES = 'PAGES',
  HANDLES = 'HANDLES',
  STUB = 'STUB',
  NUMBERING = 'NUMBERING',
}

// Type pour les données du formulaire de produit, gérant les fichiers et les types de données envoyés.
export type ProductFormData = Omit<Product, 'id' | 'subsidiaryId' | 'productImages' | 'configurableOptions' | 'stock'> & {
    stock: string | number;
    productImages?: File[];
    configurableOptions?: {
        optionType: OptionType;
        item: { optionName: string; multiplier: number | string };
    }[];
};
