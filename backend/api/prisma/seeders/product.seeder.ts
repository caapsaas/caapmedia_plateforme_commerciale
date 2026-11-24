// prisma/seeders/product.seeder.ts
import { PrismaClient, Prisma, ItemType } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

// Catalogue de services (donnée globale, pas de filiale, pas de stock/prix
// sur l'article — le prix est négocié à chaque commande, voir Chantier 4).
// Les spécifications techniques d'un service se configurent via le Builder
// (Chantier 5, prisma/seeders/product-specs.seeder.ts) — plus de variantes
// génériques ici (ancien système ConfigurableOption, supprimé).
interface ServiceSeedData {
  name: string;
  category: string;
  description: string;
  range: string;
  imageUrls: string[];
}

// Produit de stock (matière première/consommable) — scopé filiale : prix
// d'achat, quantité et entrepôt n'ont de sens que rattachés à une filiale.
// baseUnit = unité dans laquelle le stock est réellement compté (Chantier 2).
// packagingUnit, si défini, est l'unité d'achat courante avec son facteur de
// conversion vers baseUnit (ex. Rame = 500 Feuilles) — voir receiveItems().
interface StockProductSeedData {
  name: string;
  category: string;
  description: string;
  stock: number;
  price: number;
  warehouse: string;
  subsidiaryEmail: string;
  range: string;
  baseUnit: string;
  packagingUnit?: { name: string; conversionFactor: number };
}

// Référentiel d'unités global (Chantier 2) — administrable ensuite via
// Configuration > Unités, mais seedé ici pour que les produits de stock
// ci-dessous aient tous une unité de base fonctionnelle dès le démarrage.
const UNITS_DATA: { name: string; symbol?: string }[] = [
  { name: 'Feuille', symbol: 'f.' },
  { name: 'Rame', symbol: 'rm' },
  { name: 'Millilitre', symbol: 'ml' },
  { name: 'Litre', symbol: 'L' },
  { name: 'Mètre', symbol: 'm' },
  { name: 'Rouleau', symbol: 'rlx' },
  { name: 'Unité', symbol: 'u' },
  { name: 'Boîte', symbol: 'bte' },
  { name: 'Kilogramme', symbol: 'kg' },
  { name: 'Gramme', symbol: 'g' },
  { name: 'Sachet', symbol: 'sach' },
  { name: 'Carton', symbol: 'ctn' },
  { name: 'Paquet', symbol: 'pqt' },
];

const SERVICES_DATA: ServiceSeedData[] = [
  {
    name: 'Roll-up Classique 85x200cm',
    category: 'Roll-up & Kakemono',
    description:
      'Support d’information et de promotion très polyvalent. Structure en aluminium brossé avec 2 pieds de stabilisation. Livré avec sac de transport. Visuel sur Syntisol 220 microns.',
    range: 'Populaire',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'X-Banner Classique Indoor',
    category: 'Stands & PLV',
    description:
      'Structure en fibre de verre ultra légère pour communiquer efficacement à petit prix. Fixation du visuel avec oeillets. L60 x H160 cm.',
    range: 'Standard',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Flying Banner Feather (Oriflamme Plume)',
    category: 'Drapeaux & Oriflammes',
    description:
      'Idéal pour les événementiels. Mât en fibre de carbone, impression sublimation sur maille polyester 120g. Impression traversée visible des deux côtés.',
    range: 'Premium',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Backdrop Stand Parapluie Textile',
    category: 'Stands & PLV',
    description:
      "Mur d'images facile à déplier et replier. Structure en aluminium droite ou courbe. Fixation du visuel par système velcro. Livré avec sac de transport à roulettes.",
    range: 'Premium',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Flyers & Dépliants',
    category: 'Pub',
    description:
      'Impressions Offset de haute qualité pour vos flyers, dépliants, et autres supports de communication. Idéal pour les grandes quantités.',
    range: 'Populaire',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'T-Shirt Imprimé',
    category: 'Textile',
    description:
      'T-shirt de haute qualité 100% coton, personnalisé avec votre logo ou design en sérigraphie ou broderie.',
    range: 'Populaire',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Cartes de visite',
    category: 'Carterie',
    description:
      'Cartes de visite professionnelles, impression haute qualité sur papier 350g. Finition mate ou brillante.',
    range: 'Populaire',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Packaging Produit',
    category: 'Packaging',
    description:
      "Solutions d'emballage sur mesure pour vos produits. Boîtes, étuis, et coffrets personnalisés.",
    range: 'Premium',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Papier à en-tête',
    category: 'Papeterie',
    description:
      'Papier à en-tête A4 de qualité supérieure pour une correspondance professionnelle.',
    range: 'Standard',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Menu de Restaurant',
    category: 'Resto - Hôtels',
    description:
      'Menus de restaurant personnalisés, résistants et élégants. Différents formats et finitions disponibles.',
    range: 'Standard',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Brochure / Magazine',
    category: 'Impression livre',
    description:
      'Impression de brochures, catalogues et magazines avec reliure piquée ou dos carré collé.',
    range: 'Premium',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Bâche publicitaire',
    category: 'Bâches & Banderoles',
    description:
      'Bâche PVC grand format pour une visibilité maximale en extérieur. Résistante aux intempéries.',
    range: 'Standard',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Panneau en PVC',
    category: 'Panneaux & Enseignes',
    description:
      'Panneaux en PVC Forex pour signalétique intérieure ou extérieure. Léger et résistant.',
    range: 'Standard',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Mug Personnalisé',
    category: 'Mugs, gobelets et gourdes',
    description:
      "Mug en céramique blanc personnalisé avec votre logo ou photo. Idéal pour les cadeaux d'entreprise.",
    range: 'Populaire',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Sac en Tissu (Tote Bag)',
    category: 'Sacs personnalisés',
    description:
      'Tote bag en coton personnalisé, un goodies écologique et pratique.',
    range: 'Populaire',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Badge Événementiel',
    category: 'Événementiel',
    description:
      'Badges personnalisés avec porte-badge et lanière pour vos événements, salons et conférences.',
    range: 'Standard',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Stylo Publicitaire',
    category: 'Écriture & Bureau',
    description:
      'Stylo à bille personnalisé avec votre logo, un classique indémodable.',
    range: 'Populaire',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: "Comptoir d'accueil",
    category: 'Mobilier publicitaire',
    description:
      "Comptoir d'accueil portable et personnalisable pour vos stands et événements.",
    range: 'Premium',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Tableau personnalisé',
    category: 'Maison & Déco',
    description:
      'Impression de vos photos ou designs sur toile pour une décoration unique.',
    range: 'Premium',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Création de Site Web Vitrine',
    category: 'Création & gestion de sites web',
    description:
      "Conception et développement d'un site web professionnel pour présenter votre entreprise.",
    range: 'Premium',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Campagne Publicitaire Google Ads',
    category: 'Marketing digital & publicité',
    description:
      'Gestion de campagnes publicitaires sur Google pour augmenter votre visibilité.',
    range: 'Standard',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Community Management Mensuel',
    category: 'Réseaux sociaux',
    description:
      'Animation et gestion de vos comptes sur les réseaux sociaux (Facebook, Instagram...).',
    range: 'Standard',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
  {
    name: 'Création de Logo & Charte Graphique',
    category: 'Design & identité visuelle',
    description:
      "Conception d'un logo unique et d'une charte graphique complète pour votre marque.",
    range: 'Premium',
    imageUrls: [
      'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
    ],
  },
];

const RAME_500_FEUILLES = { name: 'Rame', conversionFactor: 500 };
const LITRE_1000_ML = { name: 'Litre', conversionFactor: 1000 };
const KG_1000_G = { name: 'Kilogramme', conversionFactor: 1000 };
const ROULEAU_50_M = { name: 'Rouleau', conversionFactor: 50 };

const STOCK_PRODUCTS_DATA: StockProductSeedData[] = [
  {
    name: 'Cartons pour emballage',
    category: 'Papiers & Cartons',
    description: 'Carton rigide ou ondulé utilisé pour emballage et packaging.',
    stock: 50,
    price: 5000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
    packagingUnit: { name: 'Paquet', conversionFactor: 25 },
  },
  {
    name: 'Plaques pour Insoleuse',
    category: 'Supports & Bâches',
    description: 'Plaques aluminium pour impression offset via insoleuse.',
    stock: 50,
    price: 12000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
    packagingUnit: { name: 'Boîte', conversionFactor: 10 },
  },
  {
    name: 'Encre Offset Jaune',
    category: 'Encres & Chimiques',
    description: 'Encre offset couleur jaune pour impressions CMJN.',
    stock: 50,
    price: 8000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Agrafes',
    category: 'Finition & Façonnage',
    description: 'Petites pièces métalliques pour relier brochures et carnets.',
    stock: 50,
    price: 500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
    packagingUnit: { name: 'Boîte', conversionFactor: 1000 },
  },
  {
    name: 'Elastiques',
    category: 'Finition & Façonnage',
    description: 'Élastiques pour regroupement et maintien de documents.',
    stock: 50,
    price: 300,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
    packagingUnit: { name: 'Sachet', conversionFactor: 100 },
  },
  {
    name: 'White Spirit',
    category: 'Encres & Chimiques',
    description: 'Solvant utilisé pour nettoyage des machines et encres.',
    stock: 50,
    price: 2500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Nettoyeur plaques',
    category: 'Encres & Chimiques',
    description: 'Produit chimique pour le nettoyage des plaques offset.',
    stock: 50,
    price: 6000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Solution de mouillage',
    category: 'Encres & Chimiques',
    description:
      'Solution chimique utilisée en offset pour équilibrer eau/encre.',
    stock: 50,
    price: 7000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Gomme de plaque',
    category: 'Encres & Chimiques',
    description: 'Produit de protection et de conservation des plaques offset.',
    stock: 50,
    price: 3500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Poudre anti maculant',
    category: 'Encres & Chimiques',
    description: 'Poudre utilisée pour éviter le maculage des impressions.',
    stock: 50,
    price: 4000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Gramme',
    packagingUnit: KG_1000_G,
  },
  {
    name: 'Révélateur plaque',
    category: 'Encres & Chimiques',
    description:
      "Produit chimique pour révéler l'image sur les plaques offset.",
    stock: 50,
    price: 7500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Poudre bébé',
    category: 'Encres & Chimiques',
    description: 'Utilisée pour certains travaux de façonnage et de finition.',
    stock: 50,
    price: 1500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Gramme',
    packagingUnit: KG_1000_G,
  },
  {
    name: 'Blanché',
    category: 'Encres & Chimiques',
    description:
      'Produit de blanchiment ou nettoyage spécial (papier/atelier).',
    stock: 50,
    price: 3000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Racle',
    category: 'Finition & Façonnage',
    description: "Accessoire pour sérigraphie servant à étaler l'encre.",
    stock: 50,
    price: 8000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
  },
  {
    name: 'Bâche',
    category: 'Supports & Bâches',
    description: 'Support souple en PVC pour impression grand format.',
    stock: 50,
    price: 3500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Mètre',
    packagingUnit: ROULEAU_50_M,
  },
  {
    name: 'Vinyle',
    category: 'Supports & Bâches',
    description:
      'Film autocollant imprimable utilisé pour stickers et covering.',
    stock: 50,
    price: 4000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Mètre',
    packagingUnit: ROULEAU_50_M,
  },
  {
    name: 'Colle',
    category: 'Finition & Façonnage',
    description: 'Colle industrielle pour reliure, affiches et packaging.',
    stock: 50,
    price: 2000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Gramme',
    packagingUnit: KG_1000_G,
  },
  {
    name: 'Bâton pour banderole',
    category: 'Finition & Façonnage',
    description: 'Tiges ou barres servant de support à une banderole.',
    stock: 50,
    price: 2500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
    packagingUnit: { name: 'Paquet', conversionFactor: 10 },
  },
  {
    name: 'Encre Offset noir',
    category: 'Encres & Chimiques',
    description: 'Encre offset couleur noire pour impressions.',
    stock: 50,
    price: 8000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Encre Offset cyan',
    category: 'Encres & Chimiques',
    description: 'Encre offset couleur cyan pour impressions CMJN.',
    stock: 50,
    price: 8000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Encre Offset magenta',
    category: 'Encres & Chimiques',
    description: 'Encre offset couleur magenta pour impressions CMJN.',
    stock: 50,
    price: 8000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Encre noir Roland',
    category: 'Encres & Chimiques',
    description: 'Encre spécifique pour traceurs Roland couleur noire.',
    stock: 50,
    price: 15000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Encre cyan Roland',
    category: 'Encres & Chimiques',
    description: 'Encre spécifique pour traceurs Roland couleur cyan.',
    stock: 50,
    price: 15000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Encre magenta Roland',
    category: 'Encres & Chimiques',
    description: 'Encre spécifique pour traceurs Roland couleur magenta.',
    stock: 50,
    price: 15000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Encre jaune Roland',
    category: 'Encres & Chimiques',
    description: 'Encre spécifique pour traceurs Roland couleur jaune.',
    stock: 50,
    price: 15000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Solvant',
    category: 'Encres & Chimiques',
    description: "Solvant pour entretien et dilution d'encres.",
    stock: 50,
    price: 5000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Papier A4',
    category: 'Papiers & Cartons',
    description: 'Papier bureautique A4 standard pour usage courant.',
    stock: 50,
    price: 2500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Révélateur Plaque CTP',
    category: 'Encres & Chimiques',
    description: 'Produit chimique pour révéler plaques CTP.',
    stock: 50,
    price: 10000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Millilitre',
    packagingUnit: LITRE_1000_ML,
  },
  {
    name: 'Plaque CTP',
    category: 'Supports & Bâches',
    description: 'Plaques aluminium utilisées pour impression offset CTP.',
    stock: 50,
    price: 15000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
    packagingUnit: { name: 'Boîte', conversionFactor: 10 },
  },
  {
    name: 'Films',
    category: 'Supports & Bâches',
    description: 'Films transparents pour impression ou pelliculage.',
    stock: 50,
    price: 5000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Mètre',
    packagingUnit: ROULEAU_50_M,
  },
  {
    name: 'Numérotation Carnet',
    category: 'Finition & Façonnage',
    description: "Procédé d'impression permettant de numéroter carnets.",
    stock: 50,
    price: 2000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
  },
  {
    name: 'Façonnage',
    category: 'Finition & Façonnage',
    description: 'Opérations de finition : pliage, coupe, reliure.',
    stock: 50,
    price: 3000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
  },
  {
    name: 'Rouleau vinyle',
    category: 'Supports & Bâches',
    description: 'Rouleau de vinyle adhésif imprimable grand format.',
    stock: 50,
    price: 35000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Mètre',
    packagingUnit: ROULEAU_50_M,
  },
  {
    name: 'T-Shirt',
    category: 'Textiles',
    description: 'Support textile pour impression personnalisée.',
    stock: 50,
    price: 3500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
    packagingUnit: { name: 'Carton', conversionFactor: 50 },
  },
  {
    name: 'Rainage',
    category: 'Finition & Façonnage',
    description: 'Procédé de façonnage créant un pli net sur papier/carton.',
    stock: 50,
    price: 2500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
  },
  {
    name: 'Bristol - Couverture',
    category: 'Papiers & Cartons',
    description: 'Carton fort utilisé pour couvertures et supports rigides.',
    stock: 50,
    price: 4000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Casquette',
    category: 'Textiles',
    description: 'Support textile personnalisable.',
    stock: 50,
    price: 2500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
    packagingUnit: { name: 'Carton', conversionFactor: 50 },
  },
  {
    name: 'Polo',
    category: 'Textiles',
    description: 'Textile personnalisable type polo.',
    stock: 50,
    price: 4500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Unité',
    packagingUnit: { name: 'Carton', conversionFactor: 50 },
  },
  {
    name: 'Rame de Papier Offset Blanc 350',
    category: 'Papiers & Cartons',
    description:
      'Rame de Papier non couché avec surface lisse, haute qualité pour longs tirages.',
    stock: 50,
    price: 28500,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Rame de Papier Offset Blanc 300',
    category: 'Papiers & Cartons',
    description:
      'Papier non couché standard, utilisé pour flyers et catalogues.',
    stock: 50,
    price: 26000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Rame de Papier Offset Blanc 200',
    category: 'Papiers & Cartons',
    description: 'Papier issu de fibres recyclées, écologique et imprimable.',
    stock: 50,
    price: 26000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Rame de Papier Offset Blanc 175',
    category: 'Papiers & Cartons',
    description:
      'Papier couché satiné, rendu des couleurs optimal, utilisé pour magazines.',
    stock: 50,
    price: 26000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Rame de Papier Offset Blanc 145',
    category: 'Papiers & Cartons',
    description:
      'Papier avec face couchée et non couchée, pour catalogues et dos carré collé.',
    stock: 50,
    price: 26000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Rame de Papier Offset Laser',
    category: 'Papiers & Cartons',
    description:
      'Papier blanc éclatant, adapté aux impressions laser et offset.',
    stock: 50,
    price: 26000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Rame de Papier Recyclé Certifié',
    category: 'Papiers & Cartons',
    description: 'Papier certifié FSC/PEFC issu de fibres renouvelables.',
    stock: 50,
    price: 26000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Rame de Papier Création',
    category: 'Papiers & Cartons',
    description:
      'Papier texturé ou original pour impressions créatives haut de gamme.',
    stock: 50,
    price: 26000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Rame de Papier Offset Naturel',
    category: 'Papiers & Cartons',
    description:
      'Papier crème ou beige clair, esthétique naturelle, éco-responsable.',
    stock: 50,
    price: 26000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
  {
    name: 'Rame de Papier Offset Supra',
    category: 'Papiers & Cartons',
    description:
      'Papier offset de qualité supérieure pour ouvrages de prestige.',
    stock: 50,
    price: 26000,
    warehouse: 'Douala Centre',
    subsidiaryEmail: 'contact.douala@caap.cm',
    range: 'Standard',
    baseUnit: 'Feuille',
    packagingUnit: RAME_500_FEUILLES,
  },
];

async function seedUnits(prisma: PrismaClient): Promise<Map<string, string>> {
  const unitIdByName = new Map<string, string>();
  for (const u of UNITS_DATA) {
    const unit = await prisma.unit.upsert({
      where: { name: u.name },
      update: {},
      create: { id: generateId(ID_PREFIXES.UNIT), name: u.name, symbol: u.symbol },
    });
    unitIdByName.set(unit.name, unit.id);
  }
  console.log('Référentiel unités seedé');
  return unitIdByName;
}

async function seedServices(prisma: PrismaClient) {
  for (const s of SERVICES_DATA) {
    // Catalogue global : pas de filiale, idempotence sur (nom, type) seul.
    const existing = await prisma.item.findFirst({
      where: { name: s.name, type: ItemType.SERVICE },
    });
    if (existing) continue;

    const item = await prisma.item.create({
      data: {
        id: generateId(ID_PREFIXES.PRODUCT),
        name: s.name,
        category: s.category,
        description: s.description,
        type: ItemType.SERVICE,
        productRange: s.range,
      },
    });

    for (const url of s.imageUrls) {
      await prisma.productImage.create({
        data: {
          id: generateId(ID_PREFIXES.PRODUCTIMAGE),
          imageName: `${s.name}-${url.split('/').pop()}`,
          imageUrl: url,
          product: { connect: { id: item.id } },
        },
      });
    }
  }
  console.log('Services (catalogue global) seedés');
}

async function seedStockProducts(
  prisma: PrismaClient,
  unitIdByName: Map<string, string>,
) {
  // Les Items de stock sont GLOBAUX — on charge toutes les filiales une seule
  // fois pour créer un ItemStock par filiale pour chaque article.
  const allSubsidiaries = await prisma.subsidiary.findMany();
  if (allSubsidiaries.length === 0) {
    console.warn('Aucune filiale trouvée — seedStockProducts ignoré.');
    return;
  }

  for (const p of STOCK_PRODUCTS_DATA) {

    const baseUnitId = unitIdByName.get(p.baseUnit);
    if (!baseUnitId) {
      console.warn(`Unité de base "${p.baseUnit}" introuvable pour ${p.name}`);
      continue;
    }

    // Article global : idempotence sur (nom, type) seul — le stock est
    // propre à chaque filiale (voir ItemStock).
    let item = await prisma.item.findFirst({
      where: { name: p.name, type: ItemType.STOCK_PRODUCT },
    });

    if (!item) {
      item = await prisma.item.create({
        data: {
          id: generateId(ID_PREFIXES.PRODUCT),
          name: p.name,
          category: p.category,
          description: p.description,
          type: ItemType.STOCK_PRODUCT,
          productRange: p.range,
          stockManaged: true,
          baseUnitId,
        },
      });
    } else if (!item.baseUnitId) {
      // Article seedé avant l'introduction des unités (Chantier 2) : complète.
      item = await prisma.item.update({
        where: { id: item.id },
        data: { baseUnitId },
      });
    }

    if (p.packagingUnit) {
      const packagingUnitId = unitIdByName.get(p.packagingUnit.name);
      if (!packagingUnitId) {
        console.warn(
          `Unité d'emballage "${p.packagingUnit.name}" introuvable pour ${p.name}`,
        );
      } else {
        await prisma.itemPackagingUnit.upsert({
          where: {
            itemId_unitId: { itemId: item.id, unitId: packagingUnitId },
          },
          update: {
            conversionFactor: new Prisma.Decimal(
              p.packagingUnit.conversionFactor,
            ),
          },
          create: {
            id: generateId(ID_PREFIXES.ITEMPACKAGINGUNIT),
            itemId: item.id,
            unitId: packagingUnitId,
            conversionFactor: new Prisma.Decimal(
              p.packagingUnit.conversionFactor,
            ),
          },
        });
      }
    }

    // Créer un ItemStock pour CHAQUE filiale (article global, stock par filiale).
    // L'entrepôt de référence vient de la filiale d'origine (subsidiaryEmail) ;
    // les autres filiales héritent du même nom d'entrepôt par défaut.
    const refWarehouse = p.warehouse;

    for (const subsidiary of allSubsidiaries) {
      const existingStock = await prisma.itemStock.findFirst({
        where: { itemId: item.id, subsidiaryId: subsidiary.id },
      });
      if (existingStock) continue;

      await prisma.itemStock.create({
        data: {
          id: generateId(ID_PREFIXES.ITEMSTOCK),
          itemId: item.id,
          subsidiaryId: subsidiary.id,
          stock: new Prisma.Decimal(p.stock),
          warehouse: refWarehouse,
        },
      });
    }
  }
  console.log(
    'Produits de stock (article global + unités + stock par filiale) seedés',
  );
}

async function runProductSeeder(prisma: PrismaClient) {
  const unitIdByName = await seedUnits(prisma);
  await seedServices(prisma);
  await seedStockProducts(prisma, unitIdByName);
}

export { runProductSeeder };

// Réexporté pour purchase-order.seeder.ts : le champ `price` ci-dessus n'est
// jamais écrit sur l'Item (le schéma n'a plus de colonne price, voir
// stock-items.service.ts) — c'est purchase-order.seeder.ts qui le transforme
// en un vrai PurchaseOrderItem.purchasePrice ("prix de revient" = dernier
// achat réel), seule et unique source de vérité pour le coût d'un article.
export { STOCK_PRODUCTS_DATA };
