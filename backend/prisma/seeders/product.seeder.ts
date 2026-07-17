// prisma/seeders/product.seeder.ts
import { PrismaClient, Prisma, OptionType  } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

async function runProductSeeder(prisma: PrismaClient) {
 
    const productsData = [
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Roll-up Classique 85x200cm',
            mainCategory: 'Signalétique & Display',
            category: 'Roll-up & Kakemono',
            description: 'Support d’information et de promotion très polyvalent. Structure en aluminium brossé avec 2 pieds de stabilisation. Livré avec sac de transport. Visuel sur Syntisol 220 microns.',
            stock: 150,
            price: 18000,
            sellingPrice: 35000,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Populaire',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'X-Banner Classique Indoor',
            mainCategory: 'Signalétique & Display',
            category: 'Stands & PLV',
            description: 'Structure en fibre de verre ultra légère pour communiquer efficacement à petit prix. Fixation du visuel avec oeillets. L60 x H160 cm.',
            stock: 300,
            price: 8000,
            sellingPrice: 15000,
            warehouse: 'Yaoundé Centre',
            subsidiaryEmail: 'contact.yaounde@caap.cm',
            range: 'Standard',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Flying Banner Feather (Oriflamme Plume)',
            mainCategory: 'Signalétique & Display',
            category: 'Drapeaux & Oriflammes',
            description: "Idéal pour les événementiels. Mât en fibre de carbone, impression sublimation sur maille polyester 120g. Impression traversée visible des deux côtés.",
            stock: 100,
            price: 25000,
            sellingPrice: 45000,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Premium',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {
                dimensions: [
                    { name: 'H: 2,90m', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'H: 4,10m', multiplier: 1.25 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'H: 5,20m', multiplier: 1.5 }
                ]
            }
        },
        {
            name: "Backdrop Stand Parapluie Textile",
            mainCategory: 'Signalétique & Display',
            category: "Stands & PLV",
            description: "Mur d'images facile à déplier et replier. Structure en aluminium droite ou courbe. Fixation du visuel par système velcro. Livré avec sac de transport à roulettes.",
            stock: 20,
            price: 180000,
            sellingPrice: 350000,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Premium',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {
                dimensions: [
                    { name: '3m x 2,25m', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: '6m x 2,25m', multiplier: 1.8 }
                ]
            }
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Flyers & Dépliants',
            mainCategory: 'Imprimerie',
            category: 'Pub',
            description: 'Impressions Offset de haute qualité pour vos flyers, dépliants, et autres supports de communication. Idéal pour les grandes quantités.',
            stock: 100000,
            price: 15,
            sellingPrice: 30,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Populaire',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {
                formats: [
                    { name: 'A6', multiplier: 0.8 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'A5', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'DL', multiplier: 1.1 }
                ],
                grammages: [
                    { name: '135g', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: '170g', multiplier: 1.2 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: '300g', multiplier: 1.5 }
                ],
                printSides: [
                    { name: 'Recto', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Recto/Verso', multiplier: 1.6 }
                ],
                laminations: [
                    { name: 'Aucun', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Mat', multiplier: 1.2 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Brillant', multiplier: 1.2 }
                ]
            },
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'T-Shirt Imprimé',
            mainCategory: 'Objets publicitaires',
            category: 'Textile',
            description: 'T-shirt de haute qualité 100% coton, personnalisé avec votre logo ou design en sérigraphie ou broderie.',
            stock: 500,
            price: 4500,
            sellingPrice: 7500,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Populaire',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {
                sizes: [
                    { name: 'S', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'M', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'L', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'XL', multiplier: 1.05 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'XXL', multiplier: 1.1 }
                ],
                colors: [
                    { name: 'Blanc', multiplier: 1.0 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Noir', multiplier: 1.1 },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Couleur', multiplier: 1.2 }
                ]
            },
        },
        // --- New products added to fill categories ---
        {
            name: 'Cartes de visite',
            mainCategory: 'Imprimerie',
            category: 'Carterie',
            description: 'Cartes de visite professionnelles, impression haute qualité sur papier 350g. Finition mate ou brillante.',
            stock: 10000,
            price: 20,
            sellingPrice: 50,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Populaire',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Packaging Produit',
            mainCategory: 'Imprimerie',
            category: 'Packaging',
            description: 'Solutions d\'emballage sur mesure pour vos produits. Boîtes, étuis, et coffrets personnalisés.',
            stock: 5000,
            price: 300,
            sellingPrice: 700,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Premium',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Papier à en-tête',
            mainCategory: 'Imprimerie',
            category: 'Papeterie',
            description: 'Papier à en-tête A4 de qualité supérieure pour une correspondance professionnelle.',
            stock: 20000,
            price: 40,
            sellingPrice: 100,
            warehouse: 'Yaoundé Centre',
            subsidiaryEmail: 'contact.yaounde@caap.cm',
            range: 'Standard',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Menu de Restaurant',
            mainCategory: 'Imprimerie',
            category: 'Resto - Hôtels',
            description: 'Menus de restaurant personnalisés, résistants et élégants. Différents formats et finitions disponibles.',
            stock: 2000,
            price: 800,
            sellingPrice: 2500,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Standard',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Brochure / Magazine',
            mainCategory: 'Imprimerie',
            category: 'Impression livre',
            description: 'Impression de brochures, catalogues et magazines avec reliure piquée ou dos carré collé.',
            stock: 1000,
            price: 1500,
            sellingPrice: 4000,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Premium',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Bâche publicitaire',
            mainCategory: 'Signalétique & Display',
            category: 'Bâches & Banderoles',
            description: 'Bâche PVC grand format pour une visibilité maximale en extérieur. Résistante aux intempéries.',
            stock: 500,
            price: 5000,
            sellingPrice: 12000,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Standard',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Panneau en PVC',
            mainCategory: 'Signalétique & Display',
            category: 'Panneaux & Enseignes',
            description: 'Panneaux en PVC Forex pour signalétique intérieure ou extérieure. Léger et résistant.',
            stock: 1000,
            price: 8000,
            sellingPrice: 18000,
            warehouse: 'Yaoundé Centre',
            subsidiaryEmail: 'contact.yaounde@caap.cm',
            range: 'Standard',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Mug Personnalisé',
            mainCategory: 'Objets publicitaires',
            category: 'Mugs, gobelets et gourdes',
            description: 'Mug en céramique blanc personnalisé avec votre logo ou photo. Idéal pour les cadeaux d\'entreprise.',
            stock: 1000,
            price: 2000,
            sellingPrice: 4500,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Populaire',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Sac en Tissu (Tote Bag)',
            mainCategory: 'Objets publicitaires',
            category: 'Sacs personnalisés',
            description: 'Tote bag en coton personnalisé, un goodies écologique et pratique.',
            stock: 3000,
            price: 1500,
            sellingPrice: 3500,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Populaire',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Badge Événementiel',
            mainCategory: 'Objets publicitaires',
            category: 'Événementiel',
            description: 'Badges personnalisés avec porte-badge et lanière pour vos événements, salons et conférences.',
            stock: 5000,
            price: 500,
            sellingPrice: 1500,
            warehouse: 'Yaoundé Centre',
            subsidiaryEmail: 'contact.yaounde@caap.cm',
            range: 'Standard',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Stylo Publicitaire',
            mainCategory: 'Objets publicitaires',
            category: 'Écriture & Bureau',
            description: 'Stylo à bille personnalisé avec votre logo, un classique indémodable.',
            stock: 10000,
            price: 150,
            sellingPrice: 400,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Populaire',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            name: "Comptoir d'accueil",
            mainCategory: 'Objets publicitaires',
            category: 'Mobilier publicitaire',
            description: "Comptoir d'accueil portable et personnalisable pour vos stands et événements.",
            stock: 50,
            price: 80000,
            sellingPrice: 150000,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Premium',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Tableau personnalisé',
            mainCategory: 'Objets publicitaires',
            category: 'Maison & Déco',
            description: 'Impression de vos photos ou designs sur toile pour une décoration unique.',
            stock: 200,
            price: 10000,
            sellingPrice: 25000,
            warehouse: 'Douala Centre',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Premium',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Création de Site Web Vitrine',
            mainCategory: 'Prestations de services',
            category: 'Création & gestion de sites web',
            description: 'Conception et développement d\'un site web professionnel pour présenter votre entreprise.',
            stock: 300000,
            price: 250000,
            sellingPrice: 450000,
            warehouse: 'Service',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Premium',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Campagne Publicitaire Google Ads',
            mainCategory: 'Prestations de services',
            category: 'Marketing digital & publicité',
            description: 'Gestion de campagnes publicitaires sur Google pour augmenter votre visibilité.',
            stock: 300000,
            price: 100000,
            sellingPrice: 180000,
            warehouse: 'Service',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Standard',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Community Management Mensuel',
            mainCategory: 'Prestations de services',
            category: 'Réseaux sociaux',
            description: 'Animation et gestion de vos comptes sur les réseaux sociaux (Facebook, Instagram...).',
            stock: 100000,
            price: 80000,
            sellingPrice: 150000,
            warehouse: 'Service',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Standard',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Création de Logo & Charte Graphique',
            mainCategory: 'Prestations de services',
            category: 'Design & identité visuelle',
            description: 'Conception d\'un logo unique et d\'une charte graphique complète pour votre marque.',
            stock: 100000,
            price: 120000,
            sellingPrice: 200000,
            warehouse: 'Service',
            subsidiaryEmail: 'contact.douala@caap.cm',
            range: 'Premium',
            imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
            configurableOptions: {},
        },
        // --- Raw Materials & Consumables ---
        { name: 'Cartons pour emballage', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Carton rigide ou ondulé utilisé pour emballage et packaging.', stock: 50, price: 5000, sellingPrice: 5000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Plaques pour Insoleuse', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Plaques aluminium pour impression offset via insoleuse.', stock: 50, price: 12000, sellingPrice: 12000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Encre Offset Jaune', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre offset couleur jaune pour impressions CMJN.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Agrafes', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Petites pièces métalliques pour relier brochures et carnets.', stock: 50, price: 500, sellingPrice: 500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Elastiques', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Élastiques pour regroupement et maintien de documents.', stock: 50, price: 300, sellingPrice: 300, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'White Spirit', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Solvant utilisé pour nettoyage des machines et encres.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Nettoyeur plaques', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit chimique pour le nettoyage des plaques offset.', stock: 50, price: 6000, sellingPrice: 6000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Solution de mouillage', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Solution chimique utilisée en offset pour équilibrer eau/encre.', stock: 50, price: 7000, sellingPrice: 7000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Gomme de plaque', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit de protection et de conservation des plaques offset.', stock: 50, price: 3500, sellingPrice: 3500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Poudre anti maculant', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Poudre utilisée pour éviter le maculage des impressions.', stock: 50, price: 4000, sellingPrice: 4000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Révélateur plaque', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit chimique pour révéler l\'image sur les plaques offset.', stock: 50, price: 7500, sellingPrice: 7500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Poudre bébé', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Utilisée pour certains travaux de façonnage et de finition.', stock: 50, price: 1500, sellingPrice: 1500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Blanché', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit de blanchiment ou nettoyage spécial (papier/atelier).', stock: 50, price: 3000, sellingPrice: 3000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Racle', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Accessoire pour sérigraphie servant à étaler l\'encre.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Bâche', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Support souple en PVC pour impression grand format.', stock: 50, price: 3500, sellingPrice: 3500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Vinyle', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Film autocollant imprimable utilisé pour stickers et covering.', stock: 50, price: 4000, sellingPrice: 4000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Colle', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Colle industrielle pour reliure, affiches et packaging.', stock: 50, price: 2000, sellingPrice: 2000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Bâton pour banderole', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Tiges ou barres servant de support à une banderole.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Encre Offset noir', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre offset couleur noire pour impressions.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Encre Offset cyan', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre offset couleur cyan pour impressions CMJN.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Encre Offset magenta', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre offset couleur magenta pour impressions CMJN.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Encre noir Roland', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre spécifique pour traceurs Roland couleur noire.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Encre cyan Roland', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre spécifique pour traceurs Roland couleur cyan.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Encre magenta Roland', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre spécifique pour traceurs Roland couleur magenta.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Encre jaune Roland', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre spécifique pour traceurs Roland couleur jaune.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Solvant', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Solvant pour entretien et dilution d\'encres.', stock: 50, price: 5000, sellingPrice: 5000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Papier A4', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier bureautique A4 standard pour usage courant.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Révélateur Plaque CTP', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit chimique pour révéler plaques CTP.', stock: 50, price: 10000, sellingPrice: 10000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Plaque CTP', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Plaques aluminium utilisées pour impression offset CTP.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Carte de visite', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Support imprimé standard pour identité professionnelle.', stock: 50, price: 50, sellingPrice: 50, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Films', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Films transparents pour impression ou pelliculage.', stock: 50, price: 5000, sellingPrice: 5000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Numérotation Carnet', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Procédé d\'impression permettant de numéroter carnets.', stock: 50, price: 2000, sellingPrice: 2000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Façonnage', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Opérations de finition : pliage, coupe, reliure.', stock: 50, price: 3000, sellingPrice: 3000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Transport lié à un service', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Frais de livraison ou transport spécifique lié à production.', stock: 50, price: 10000, sellingPrice: 10000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rouleau vinyle', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Rouleau de vinyle adhésif imprimable grand format.', stock: 50, price: 35000, sellingPrice: 35000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Achat d\'huile vrac', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Huile industrielle en vrac pour entretien machines.', stock: 50, price: 12000, sellingPrice: 12000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Transport', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Frais de transport généraux.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Sous-Traitance', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux confiés à des prestataires externes.', stock: 50, price: 50000, sellingPrice: 50000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Façonnage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux de finition réalisés par un sous-traitant.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Numérotage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Numérotation de carnets confiée à un prestataire.', stock: 50, price: 10000, sellingPrice: 10000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Flasheuse externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux de flashage réalisés en externe.', stock: 50, price: 20000, sellingPrice: 20000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Pelliculage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Pelliculage confié à un prestataire externe.', stock: 50, price: 12000, sellingPrice: 12000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Plastification externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Plastification confiée à un prestataire externe.', stock: 50, price: 10000, sellingPrice: 10000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Encollage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux d\'encollage effectués par un tiers.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Articles pour BAT', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Épreuves imprimées et fournitures pour Bon à Tirer.', stock: 50, price: 5000, sellingPrice: 5000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'T-Shirt', mainCategory: 'Matières Premières', category: 'Textiles', description: 'Support textile pour impression personnalisée.', stock: 50, price: 3500, sellingPrice: 3500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rainage', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Procédé de façonnage créant un pli net sur papier/carton.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Bristol - Couverture', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Carton fort utilisé pour couvertures et supports rigides.', stock: 50, price: 4000, sellingPrice: 4000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Flocage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux de flocage réalisés en externe.', stock: 50, price: 7000, sellingPrice: 7000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Casquette', mainCategory: 'Matières Premières', category: 'Textiles', description: 'Support textile personnalisable.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Bâche', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Support PVC souple pour affichage extérieur.', stock: 50, price: 3500, sellingPrice: 3500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Polo', mainCategory: 'Matières Premières', category: 'Textiles', description: 'Textile personnalisable type polo.', stock: 50, price: 4500, sellingPrice: 4500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Offset Blanc 350', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Rame de Papier non couché avec surface lisse, haute qualité pour longs tirages.', stock: 50, price: 28500, sellingPrice: 28500, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Offset Blanc 300', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier non couché standard, utilisé pour flyers et catalogues.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Offset Blanc 200', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier issu de fibres recyclées, écologique et imprimable.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Offset Blanc 175', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier couché satiné, rendu des couleurs optimal, utilisé pour magazines.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Offset Blanc 145', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier avec face couchée et non couchée, pour catalogues et dos carré collé.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Offset Laser', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier blanc éclatant, adapté aux impressions laser et offset.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Recyclé Certifié', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier certifié FSC/PEFC issu de fibres renouvelables.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Création', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier texturé ou original pour impressions créatives haut de gamme.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Offset Naturel', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier crème ou beige clair, esthétique naturelle, éco-responsable.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
        {
            id: generateId(ID_PREFIXES.PRODUCT),
            name: 'Rame de Papier Offset Supra', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier offset de qualité supérieure pour ouvrages de prestige.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryEmail: 'contact.douala@caap.cm', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    ];

    for (const p of productsData) {
        // Vérifier la filiale
        const subsidiary = await prisma.subsidiary.findUnique({ where: { email: p.subsidiaryEmail } });
        if (!subsidiary) {
          console.warn(`Subsidiary ${p.subsidiaryEmail} not found for product ${p.name}`);
          continue;
        }
        
        // Création du produit
        const product = await prisma.product.create({
      data: {
        id: generateId(ID_PREFIXES.PRODUCT),
            productName: p.name,
            mainCategory: p.mainCategory,
            category: p.category,
            description: p.description,
            stock: new Prisma.Decimal(p.stock),
            price: new Prisma.Decimal(p.price),
            sellingPrice: new Prisma.Decimal(p.sellingPrice),
            warehouse: p.warehouse,
            productRange: p.range,
            subsidiary: { connect: { id: subsidiary.id } },
          },
        });
    
        // Création des images
        for (const url of p.imageUrls) {
          await prisma.productImage.create({
            data: {
              imageName: `${p.name}-${url.split('/').pop()}`,
              imageUrl: url,
              product: { connect: { id: product.id } },
            },
          });
        }
    
        // Création des options configurables
        const optionTypes = Object.keys(p.configurableOptions || {});
        for (const type of optionTypes) {
          const items = p.configurableOptions[type];
          for (const item of items) {
            // Vérifier si l'option existe déjà
            let optionItem = await prisma.configurableOptionItem.findFirst({
              where: { optionName: item.name },
            });
    
            if (!optionItem) {
              optionItem = await prisma.configurableOptionItem.create({
                data: { optionName: item.name, multiplier: new Prisma.Decimal(item.multiplier) },
              });
            }
    
            await prisma.configurableOption.create({
              data: {
                optionType: type.toUpperCase() as OptionType,
                product: { connect: { id: product.id } },
                item: { connect: { id: optionItem.id } },
              },
            });
          }
        }
      }

    console.log('Products, ProductImages & ConfigurableOptions seeded');
}

export { runProductSeeder };
