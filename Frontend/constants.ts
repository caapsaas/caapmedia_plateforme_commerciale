import { Product, Sale, Contact, CreditAccount, TreasuryAccount, FinancialTransaction, SupplierDebt, User, UserRole, Supplier, Subsidiary, SalesChartData, StockChartData, Order, OrderStatus, Employee, AttendanceRecord, PayrollRecord, AttendanceStatus, PayrollStatus, Gender, ContractType, EmployeeStatus, PaymentMethod, AbsenceRecord, AbsenceType, CompanyDocument, DocumentCategory, DocumentStatus, Meeting, SecretariatTask, SecretariatTaskStatus, ExpenseRecord, ExpenseType, PurchaseOrder, PurchaseOrderStatus, PaymentTerms, Opportunity, OpportunityStage, CrmTask, CrmTaskStatus, Interaction, InteractionType, ContactStatus, ConfigurableOptions, Lead, LeadStatus, Account, Contract, ContractStatus, FixedAsset, LongTermDebt, Equipment, EquipmentStatus, ProductionStatus, TaxRate } from './types';
import { PaymentStatus } from './types/models';
import IconGmoOuaga from './components/icons/IconGmoOuaga';
import IconGmoBobo from './components/icons/IconGmoBobo';

export const MOCK_TAX_RATES: TaxRate[] = [
    { id: 'tax1', name: 'TVA', rate: 0.1925, isDefault: true, description: 'Taxe sur la Valeur Ajoutée standard.' },
    { id: 'tax2', name: 'Exonéré', rate: 0, isDefault: false, description: 'Exonéré de taxes.' },
];

// FIX: Add exported TAX_RATE constant to resolve module import errors.
export const TAX_RATE = MOCK_TAX_RATES.find(t => t.isDefault)?.rate || 0.1925;

export const PRODUCT_HIERARCHY = [
  { "category": "Imprimerie", "slug": "imprimerie", "subcategories": [
      { "name": "Pub", "slug": "pub" },
      { "name": "Carterie", "slug": "carterie" },
      { "name": "Packaging", "slug": "packaging" },
      { "name": "Papeterie", "slug": "papeterie" },
      { "name": "Resto - Hôtels", "slug": "resto-hotels" },
      { "name": "Impression livre", "slug": "impression-livre" }
  ]},
  { "category": "Signalétique & Display", "slug": "signaletique-display", "subcategories": [
      { "name": "Bâches & Banderoles", "slug": "baches-banderoles" },
      { "name": "Roll-up & Kakemono", "slug": "rollup-kakemono" },
      { "name": "Drapeaux & Oriflammes", "slug": "drapeaux-oriflammes" },
      { "name": "Panneaux & Enseignes", "slug": "panneaux-enseignes" },
      { "name": "Stands & PLV", "slug": "stands-plv" }
  ]},
  { "category": "Objets publicitaires", "slug": "objets-publicitaires", "subcategories": [
      { "name": "Textile", "slug": "textile" },
      { "name": "Mugs, gobelets et gourdes", "slug": "mugs-gobelets-gourdes" },
      { "name": "Sacs personnalisés", "slug": "sacs-personnalises" },
      { "name": "Événementiel", "slug": "evenementiel" },
      { "name": "Mobilier publicitaire", "slug": "mobilier-publicitaire" },
      { "name": "Écriture & Bureau", "slug": "ecriture-bureau" },
      { "name": "Maison & Déco", "slug": "maison-deco" }
  ]},
  { "category": "Prestations de services", "slug": "prestations-services", "subcategories": [
      { "name": "Création & gestion de sites web", "slug": "creation-sites-web" },
      { "name": "Marketing digital & publicité", "slug": "marketing-digital" },
      { "name": "Réseaux sociaux", "slug": "reseaux-sociaux" },
      { "name": "Design & identité visuelle", "slug": "design-identite-visuelle" }
  ]},
  { "category": "Matières Premières", "slug": "matieres-premieres", "subcategories": [
      { "name": "Papiers & Cartons", "slug": "papiers-cartons" },
      { "name": "Encres & Chimiques", "slug": "encres-chimiques" },
      { "name": "Supports & Bâches", "slug": "supports-baches" },
      { "name": "Finition & Façonnage", "slug": "finition-faconnage" },
      { "name": "Prestations Externes", "slug": "prestations-externes" },
      { "name": "Textiles", "slug": "textiles-raw" }
  ]}
];


export const MOCK_SUBSIDIARIES: Subsidiary[] = [
    { 
        id: 'sub1', 
        name: 'CAAP Douala', 
        logo: IconGmoOuaga,
        address: "Akwa, Douala, Cameroun",
        phone: "+237 233 42 00 00",
        email: "contact.douala@caap.cm",
        ifu: "M123456789012",
        rccm: "RC/DLA/2023/A/1234",
        bankDetails: {
            bankName: "Afriland First Bank",
            accountNumber: "10001 00002 12345678901 25",
            swift: "AFRCMCX"
        },
        shareCapital: 10000000
    },
    { 
        id: 'sub2', 
        name: 'CAAP Yaoundé', 
        logo: IconGmoBobo,
        address: "Centre-ville, Yaoundé, Cameroun",
        phone: "+237 222 22 00 00",
        email: "contact.yaounde@caap.cm",
        ifu: "M098765432109",
        rccm: "RC/YAE/2023/A/5678",
        bankDetails: {
            bankName: "SCB Cameroun",
            accountNumber: "20001 00003 09876543210 99",
            swift: "SCCMCMCX"
        },
        shareCapital: 5000000
    },
];

export const MOCK_USERS: User[] = [
    {
        id: 'U001',
        name: 'Nalobert',
        email: 'nalobert@gmail.com',
        role: UserRole.ADMIN,
        subsidiaryId: 'sub1', 
        password: 'a1234578o',
    },
    {
        id: 'U002',
        name: 'Jean Commercial',
        email: 'jean.commercial@caap.cm',
        role: UserRole.COMMERCIAL,
        subsidiaryId: 'sub1',
        password: 'password',
    },
    {
        id: 'U003',
        name: 'Marie Caissiere',
        email: 'marie.caissiere@caap.cm',
        role: UserRole.CAISSIER,
        subsidiaryId: 'sub2',
        password: 'password',
    },
    {
        id: 'U004',
        name: 'Serge Production',
        email: 'serge.prod@caap.cm',
        role: UserRole.PRODUCTION_DIRECTOR,
        subsidiaryId: 'sub1',
        password: 'password',
    },
];

export const MOCK_PRODUCTS: Product[] = [
    // --- Finished Products ---
    {
        id: 'P001',
        name: 'Roll-up Classique 85x200cm',
        mainCategory: 'Signalétique & Display',
        category: 'Roll-up & Kakemono',
        description: 'Support d’information et de promotion très polyvalent. Structure en aluminium brossé avec 2 pieds de stabilisation. Livré avec sac de transport. Visuel sur Syntisol 220 microns.',
        stock: 150,
        price: 18000,
        sellingPrice: 35000,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Populaire',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P002',
        name: 'X-Banner Classique Indoor',
        mainCategory: 'Signalétique & Display',
        category: 'Stands & PLV',
        description: 'Structure en fibre de verre ultra légère pour communiquer efficacement à petit prix. Fixation du visuel avec oeillets. L60 x H160 cm.',
        stock: 300,
        price: 8000,
        sellingPrice: 15000,
        warehouse: 'Yaoundé Centre',
        subsidiaryId: 'sub2',
        range: 'Standard',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P003',
        name: 'Flying Banner Feather (Oriflamme Plume)',
        mainCategory: 'Signalétique & Display',
        category: 'Drapeaux & Oriflammes',
        description: "Idéal pour les événementiels. Mât en fibre de carbone, impression sublimation sur maille polyester 120g. Impression traversée visible des deux côtés.",
        stock: 100,
        price: 25000,
        sellingPrice: 45000,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Premium',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {
            dimensions: [
                { name: 'H: 2,90m', multiplier: 1.0 },
                { name: 'H: 4,10m', multiplier: 1.25 },
                { name: 'H: 5,20m', multiplier: 1.5 }
            ]
        }
    },
    {
        id: 'P004',
        name: "Backdrop Stand Parapluie Textile",
        mainCategory: 'Signalétique & Display',
        category: "Stands & PLV",
        description: "Mur d'images facile à déplier et replier. Structure en aluminium droite ou courbe. Fixation du visuel par système velcro. Livré avec sac de transport à roulettes.",
        stock: 20,
        price: 180000,
        sellingPrice: 350000,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Premium',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {
            dimensions: [
                { name: '3m x 2,25m', multiplier: 1.0 },
                { name: '6m x 2,25m', multiplier: 1.8 }
            ]
        }
    },
    {
        id: 'P015',
        name: 'Flyers & Dépliants',
        mainCategory: 'Imprimerie',
        category: 'Pub',
        description: 'Impressions Offset de haute qualité pour vos flyers, dépliants, et autres supports de communication. Idéal pour les grandes quantités.',
        stock: 100000,
        price: 15,
        sellingPrice: 30,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Populaire',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {
            formats: [
                { name: 'A6', multiplier: 0.8 },
                { name: 'A5', multiplier: 1.0 },
                { name: 'DL', multiplier: 1.1 }
            ],
            grammages: [
                { name: '135g', multiplier: 1.0 },
                { name: '170g', multiplier: 1.2 },
                { name: '300g', multiplier: 1.5 }
            ],
            printSides: [
                { name: 'Recto', multiplier: 1.0 },
                { name: 'Recto/Verso', multiplier: 1.6 }
            ],
            laminations: [
                { name: 'Aucun', multiplier: 1.0 },
                { name: 'Mat', multiplier: 1.2 },
                { name: 'Brillant', multiplier: 1.2 }
            ]
        },
    },
    {
        id: 'P016',
        name: 'T-Shirt Imprimé',
        mainCategory: 'Objets publicitaires',
        category: 'Textile',
        description: 'T-shirt de haute qualité 100% coton, personnalisé avec votre logo ou design en sérigraphie ou broderie.',
        stock: 500,
        price: 4500,
        sellingPrice: 7500,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Populaire',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {
            sizes: [
                { name: 'S', multiplier: 1.0 },
                { name: 'M', multiplier: 1.0 },
                { name: 'L', multiplier: 1.0 },
                { name: 'XL', multiplier: 1.05 },
                { name: 'XXL', multiplier: 1.1 }
            ],
            colors: [
                { name: 'Blanc', multiplier: 1.0 },
                { name: 'Noir', multiplier: 1.1 },
                { name: 'Couleur', multiplier: 1.2 }
            ]
        },
    },
    // --- New products added to fill categories ---
    {
        id: 'P020',
        name: 'Cartes de visite',
        mainCategory: 'Imprimerie',
        category: 'Carterie',
        description: 'Cartes de visite professionnelles, impression haute qualité sur papier 350g. Finition mate ou brillante.',
        stock: 10000,
        price: 20,
        sellingPrice: 50,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Populaire',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P021',
        name: 'Packaging Produit',
        mainCategory: 'Imprimerie',
        category: 'Packaging',
        description: 'Solutions d\'emballage sur mesure pour vos produits. Boîtes, étuis, et coffrets personnalisés.',
        stock: 5000,
        price: 300,
        sellingPrice: 700,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Premium',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P022',
        name: 'Papier à en-tête',
        mainCategory: 'Imprimerie',
        category: 'Papeterie',
        description: 'Papier à en-tête A4 de qualité supérieure pour une correspondance professionnelle.',
        stock: 20000,
        price: 40,
        sellingPrice: 100,
        warehouse: 'Yaoundé Centre',
        subsidiaryId: 'sub2',
        range: 'Standard',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P023',
        name: 'Menu de Restaurant',
        mainCategory: 'Imprimerie',
        category: 'Resto - Hôtels',
        description: 'Menus de restaurant personnalisés, résistants et élégants. Différents formats et finitions disponibles.',
        stock: 2000,
        price: 800,
        sellingPrice: 2500,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Standard',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P024',
        name: 'Brochure / Magazine',
        mainCategory: 'Imprimerie',
        category: 'Impression livre',
        description: 'Impression de brochures, catalogues et magazines avec reliure piquée ou dos carré collé.',
        stock: 1000,
        price: 1500,
        sellingPrice: 4000,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Premium',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P025',
        name: 'Bâche publicitaire',
        mainCategory: 'Signalétique & Display',
        category: 'Bâches & Banderoles',
        description: 'Bâche PVC grand format pour une visibilité maximale en extérieur. Résistante aux intempéries.',
        stock: 500,
        price: 5000,
        sellingPrice: 12000,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Standard',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P026',
        name: 'Panneau en PVC',
        mainCategory: 'Signalétique & Display',
        category: 'Panneaux & Enseignes',
        description: 'Panneaux en PVC Forex pour signalétique intérieure ou extérieure. Léger et résistant.',
        stock: 1000,
        price: 8000,
        sellingPrice: 18000,
        warehouse: 'Yaoundé Centre',
        subsidiaryId: 'sub2',
        range: 'Standard',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P027',
        name: 'Mug Personnalisé',
        mainCategory: 'Objets publicitaires',
        category: 'Mugs, gobelets et gourdes',
        description: 'Mug en céramique blanc personnalisé avec votre logo ou photo. Idéal pour les cadeaux d\'entreprise.',
        stock: 1000,
        price: 2000,
        sellingPrice: 4500,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Populaire',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P028',
        name: 'Sac en Tissu (Tote Bag)',
        mainCategory: 'Objets publicitaires',
        category: 'Sacs personnalisés',
        description: 'Tote bag en coton personnalisé, un goodies écologique et pratique.',
        stock: 3000,
        price: 1500,
        sellingPrice: 3500,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Populaire',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P029',
        name: 'Badge Événementiel',
        mainCategory: 'Objets publicitaires',
        category: 'Événementiel',
        description: 'Badges personnalisés avec porte-badge et lanière pour vos événements, salons et conférences.',
        stock: 5000,
        price: 500,
        sellingPrice: 1500,
        warehouse: 'Yaoundé Centre',
        subsidiaryId: 'sub2',
        range: 'Standard',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P030',
        name: 'Stylo Publicitaire',
        mainCategory: 'Objets publicitaires',
        category: 'Écriture & Bureau',
        description: 'Stylo à bille personnalisé avec votre logo, un classique indémodable.',
        stock: 10000,
        price: 150,
        sellingPrice: 400,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Populaire',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P031',
        name: "Comptoir d'accueil",
        mainCategory: 'Objets publicitaires',
        category: 'Mobilier publicitaire',
        description: "Comptoir d'accueil portable et personnalisable pour vos stands et événements.",
        stock: 50,
        price: 80000,
        sellingPrice: 150000,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Premium',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'P032',
        name: 'Tableau personnalisé',
        mainCategory: 'Objets publicitaires',
        category: 'Maison & Déco',
        description: 'Impression de vos photos ou designs sur toile pour une décoration unique.',
        stock: 200,
        price: 10000,
        sellingPrice: 25000,
        warehouse: 'Douala Centre',
        subsidiaryId: 'sub1',
        range: 'Premium',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'SERV001',
        name: 'Création de Site Web Vitrine',
        mainCategory: 'Prestations de services',
        category: 'Création & gestion de sites web',
        description: 'Conception et développement d\'un site web professionnel pour présenter votre entreprise.',
        stock: Infinity,
        price: 250000,
        sellingPrice: 450000,
        warehouse: 'Service',
        subsidiaryId: 'sub1',
        range: 'Premium',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'SERV002',
        name: 'Campagne Publicitaire Google Ads',
        mainCategory: 'Prestations de services',
        category: 'Marketing digital & publicité',
        description: 'Gestion de campagnes publicitaires sur Google pour augmenter votre visibilité.',
        stock: Infinity,
        price: 100000,
        sellingPrice: 180000,
        warehouse: 'Service',
        subsidiaryId: 'sub1',
        range: 'Standard',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'SERV003',
        name: 'Community Management Mensuel',
        mainCategory: 'Prestations de services',
        category: 'Réseaux sociaux',
        description: 'Animation et gestion de vos comptes sur les réseaux sociaux (Facebook, Instagram...).',
        stock: Infinity,
        price: 80000,
        sellingPrice: 150000,
        warehouse: 'Service',
        subsidiaryId: 'sub1',
        range: 'Standard',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    {
        id: 'SERV004',
        name: 'Création de Logo & Charte Graphique',
        mainCategory: 'Prestations de services',
        category: 'Design & identité visuelle',
        description: 'Conception d\'un logo unique et d\'une charte graphique complète pour votre marque.',
        stock: Infinity,
        price: 120000,
        sellingPrice: 200000,
        warehouse: 'Service',
        subsidiaryId: 'sub1',
        range: 'Premium',
        imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'],
        configurableOptions: {},
    },
    // --- Raw Materials & Consumables ---
    { id: 'CAC001', name: 'Cartons pour emballage', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Carton rigide ou ondulé utilisé pour emballage et packaging.', stock: 50, price: 5000, sellingPrice: 5000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC002', name: 'Plaques pour Insoleuse', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Plaques aluminium pour impression offset via insoleuse.', stock: 50, price: 12000, sellingPrice: 12000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC003', name: 'Encre Offset Jaune', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre offset couleur jaune pour impressions CMJN.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC004', name: 'Agrafes', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Petites pièces métalliques pour relier brochures et carnets.', stock: 50, price: 500, sellingPrice: 500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC005', name: 'Elastiques', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Élastiques pour regroupement et maintien de documents.', stock: 50, price: 300, sellingPrice: 300, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC006', name: 'White Spirit', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Solvant utilisé pour nettoyage des machines et encres.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC007', name: 'Nettoyeur plaques', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit chimique pour le nettoyage des plaques offset.', stock: 50, price: 6000, sellingPrice: 6000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC008', name: 'Solution de mouillage', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Solution chimique utilisée en offset pour équilibrer eau/encre.', stock: 50, price: 7000, sellingPrice: 7000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC009', name: 'Gomme de plaque', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit de protection et de conservation des plaques offset.', stock: 50, price: 3500, sellingPrice: 3500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC010', name: 'Poudre anti maculant', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Poudre utilisée pour éviter le maculage des impressions.', stock: 50, price: 4000, sellingPrice: 4000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC011', name: 'Révélateur plaque', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit chimique pour révéler l\'image sur les plaques offset.', stock: 50, price: 7500, sellingPrice: 7500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC012', name: 'Poudre bébé', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Utilisée pour certains travaux de façonnage et de finition.', stock: 50, price: 1500, sellingPrice: 1500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC013', name: 'Blanché', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit de blanchiment ou nettoyage spécial (papier/atelier).', stock: 50, price: 3000, sellingPrice: 3000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC014', name: 'Racle', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Accessoire pour sérigraphie servant à étaler l\'encre.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC015', name: 'Bâche', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Support souple en PVC pour impression grand format.', stock: 50, price: 3500, sellingPrice: 3500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC016', name: 'Vinyle', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Film autocollant imprimable utilisé pour stickers et covering.', stock: 50, price: 4000, sellingPrice: 4000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC017', name: 'Colle', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Colle industrielle pour reliure, affiches et packaging.', stock: 50, price: 2000, sellingPrice: 2000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC018', name: 'Bâton pour banderole', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Tiges ou barres servant de support à une banderole.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC019', name: 'Encre Offset noir', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre offset couleur noire pour impressions.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC020', name: 'Encre Offset cyan', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre offset couleur cyan pour impressions CMJN.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC021', name: 'Encre Offset magenta', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre offset couleur magenta pour impressions CMJN.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC022', name: 'Encre noir Roland', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre spécifique pour traceurs Roland couleur noire.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC023', name: 'Encre cyan Roland', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre spécifique pour traceurs Roland couleur cyan.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC024', name: 'Encre magenta Roland', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre spécifique pour traceurs Roland couleur magenta.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC025', name: 'Encre jaune Roland', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Encre spécifique pour traceurs Roland couleur jaune.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC026', name: 'Solvant', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Solvant pour entretien et dilution d\'encres.', stock: 50, price: 5000, sellingPrice: 5000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC027', name: 'Papier A4', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier bureautique A4 standard pour usage courant.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC028', name: 'Révélateur Plaque CTP', mainCategory: 'Matières Premières', category: 'Encres & Chimiques', description: 'Produit chimique pour révéler plaques CTP.', stock: 50, price: 10000, sellingPrice: 10000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC029', name: 'Plaque CTP', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Plaques aluminium utilisées pour impression offset CTP.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC030', name: 'Carte de visite', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Support imprimé standard pour identité professionnelle.', stock: 50, price: 50, sellingPrice: 50, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC031', name: 'Films', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Films transparents pour impression ou pelliculage.', stock: 50, price: 5000, sellingPrice: 5000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC032', name: 'Numérotation Carnet', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Procédé d\'impression permettant de numéroter carnets.', stock: 50, price: 2000, sellingPrice: 2000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC033', name: 'Façonnage', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Opérations de finition : pliage, coupe, reliure.', stock: 50, price: 3000, sellingPrice: 3000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC034', name: 'Transport lié à un service', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Frais de livraison ou transport spécifique lié à production.', stock: 50, price: 10000, sellingPrice: 10000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC035', name: 'Rouleau vinyle', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Rouleau de vinyle adhésif imprimable grand format.', stock: 50, price: 35000, sellingPrice: 35000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC036', name: 'Achat d\'huile vrac', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Huile industrielle en vrac pour entretien machines.', stock: 50, price: 12000, sellingPrice: 12000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC037', name: 'Transport', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Frais de transport généraux.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC038', name: 'Sous-Traitance', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux confiés à des prestataires externes.', stock: 50, price: 50000, sellingPrice: 50000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC039', name: 'Façonnage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux de finition réalisés par un sous-traitant.', stock: 50, price: 15000, sellingPrice: 15000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC040', name: 'Numérotage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Numérotation de carnets confiée à un prestataire.', stock: 50, price: 10000, sellingPrice: 10000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC041', name: 'Flasheuse externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux de flashage réalisés en externe.', stock: 50, price: 20000, sellingPrice: 20000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC042', name: 'Pelliculage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Pelliculage confié à un prestataire externe.', stock: 50, price: 12000, sellingPrice: 12000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC043', name: 'Plastification externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Plastification confiée à un prestataire externe.', stock: 50, price: 10000, sellingPrice: 10000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC044', name: 'Encollage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux d\'encollage effectués par un tiers.', stock: 50, price: 8000, sellingPrice: 8000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC045', name: 'Articles pour BAT', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Épreuves imprimées et fournitures pour Bon à Tirer.', stock: 50, price: 5000, sellingPrice: 5000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC046', name: 'T-Shirt', mainCategory: 'Matières Premières', category: 'Textiles', description: 'Support textile pour impression personnalisée.', stock: 50, price: 3500, sellingPrice: 3500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC047', name: 'Rainage', mainCategory: 'Matières Premières', category: 'Finition & Façonnage', description: 'Procédé de façonnage créant un pli net sur papier/carton.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC048', name: 'Bristol - Couverture', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Carton fort utilisé pour couvertures et supports rigides.', stock: 50, price: 4000, sellingPrice: 4000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC049', name: 'Flocage externe', mainCategory: 'Prestations Externes', category: 'Prestations Externes', description: 'Travaux de flocage réalisés en externe.', stock: 50, price: 7000, sellingPrice: 7000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC050', name: 'Casquette', mainCategory: 'Matières Premières', category: 'Textiles', description: 'Support textile personnalisable.', stock: 50, price: 2500, sellingPrice: 2500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC051', name: 'Bâche', mainCategory: 'Matières Premières', category: 'Supports & Bâches', description: 'Support PVC souple pour affichage extérieur.', stock: 50, price: 3500, sellingPrice: 3500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC052', name: 'Polo', mainCategory: 'Matières Premières', category: 'Textiles', description: 'Textile personnalisable type polo.', stock: 50, price: 4500, sellingPrice: 4500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC053', name: 'Rame de Papier Offset Blanc 350', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Rame de Papier non couché avec surface lisse, haute qualité pour longs tirages.', stock: 50, price: 28500, sellingPrice: 28500, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC054', name: 'Rame de Papier Offset Blanc 300', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier non couché standard, utilisé pour flyers et catalogues.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC055', name: 'Rame de Papier Offset Blanc 200', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier issu de fibres recyclées, écologique et imprimable.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC056', name: 'Rame de Papier Offset Blanc 175', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier couché satiné, rendu des couleurs optimal, utilisé pour magazines.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC057', name: 'Rame de Papier Offset Blanc 145', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier avec face couchée et non couchée, pour catalogues et dos carré collé.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC058', name: 'Rame de Papier Offset Laser', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier blanc éclatant, adapté aux impressions laser et offset.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC059', name: 'Rame de Papier Recyclé Certifié', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier certifié FSC/PEFC issu de fibres renouvelables.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC060', name: 'Rame de Papier Création', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier texturé ou original pour impressions créatives haut de gamme.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC061', name: 'Rame de Papier Offset Naturel', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier crème ou beige clair, esthétique naturelle, éco-responsable.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
    { id: 'CAC062', name: 'Rame de Papier Offset Supra', mainCategory: 'Matières Premières', category: 'Papiers & Cartons', description: 'Papier offset de qualité supérieure pour ouvrages de prestige.', stock: 50, price: 26000, sellingPrice: 26000, warehouse: 'Douala Centre', subsidiaryId: 'sub1', range: 'Standard', imageUrls: ['https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png'], configurableOptions: {} },
];

export const MOCK_EQUIPMENT: Equipment[] = [
    {
        id: 'EQ001',
        name: 'MO-Heldelberg 2 Tetes',
        status: EquipmentStatus.OPERATIONAL,
        lastMaintenanceDate: '2024-05-15',
        nextMaintenanceDate: '2024-11-15',
        maintenanceHistory: [
            { id: 'M001', date: '2024-05-15', technician: 'Service Interne', description: 'Maintenance préventive semestrielle.', cost: 150000 },
            { id: 'M002', date: '2023-11-10', technician: 'Heidelberg Tech', description: 'Changement des rouleaux.', cost: 800000 },
        ],
        subsidiaryId: 'sub1',
        acquisitionDate: '2020-01-15',
        acquisitionValue: 25000000,
    },
    {
        id: 'EQ002',
        name: 'GTO Heidelberg',
        status: EquipmentStatus.OPERATIONAL,
        lastMaintenanceDate: '2024-06-01',
        nextMaintenanceDate: '2024-12-01',
        maintenanceHistory: [
            { id: 'M003', date: '2024-06-01', technician: 'Service Interne', description: 'Graissage et nettoyage.', cost: 50000 },
        ],
        subsidiaryId: 'sub1',
        acquisitionDate: '2018-03-20',
        acquisitionValue: 15000000,
    },
    {
        id: 'EQ003',
        name: 'Mastico',
        status: EquipmentStatus.NEEDS_MAINTENANCE,
        lastMaintenanceDate: '2023-12-20',
        nextMaintenanceDate: '2024-06-20',
        maintenanceHistory: [],
        subsidiaryId: 'sub1',
        acquisitionDate: '2019-07-01',
        acquisitionValue: 5000000,
    },
    {
        id: 'EQ004',
        name: 'Insoleuse',
        status: EquipmentStatus.OPERATIONAL,
        lastMaintenanceDate: '2024-07-01',
        nextMaintenanceDate: '2025-01-01',
        maintenanceHistory: [
             { id: 'M004', date: '2024-07-01', technician: 'Service Interne', description: 'Changement de la lampe UV.', cost: 75000 },
        ],
        subsidiaryId: 'sub1',
        acquisitionDate: '2021-02-10',
        acquisitionValue: 1200000,
    },
    {
        id: 'EQ005',
        name: 'Rolande RX 640',
        status: EquipmentStatus.OPERATIONAL,
        lastMaintenanceDate: '2024-04-10',
        nextMaintenanceDate: '2024-10-10',
        maintenanceHistory: [],
        subsidiaryId: 'sub1',
        acquisitionDate: '2022-08-05',
        acquisitionValue: 8500000,
    },
    {
        id: 'EQ006',
        name: 'DGF-Epson I3200',
        status: EquipmentStatus.OUT_OF_SERVICE,
        lastMaintenanceDate: '2024-02-01',
        nextMaintenanceDate: '2024-08-01',
        maintenanceHistory: [
            { id: 'M005', date: '2024-07-10', technician: 'Externe', description: 'Diagnostique panne tête d\'impression.', cost: 120000 },
        ],
        subsidiaryId: 'sub1',
        acquisitionDate: '2023-01-20',
        acquisitionValue: 4000000,
    },
];


// Empty mocks to avoid crashes
export const MOCK_SALES: Sale[] = [];
export const MOCK_CONTACTS: Contact[] = [
    { id: 'C001', name: 'NANTCHA, Louis Bernard', company: 'Individuel', email: 'louis.nantcha@example.com', phone: '699887766', since: '2023-01-15', subsidiaryId: 'sub1', address: 'Bonapriso, Douala', isVerified: true, status: ContactStatus.ACTIVE, salesRepId: 'U002' },
    { id: 'C002', name: 'NATA, hard', company: 'Caapfar', email: 'hard.nata@example.com', phone: '677665544', since: '2023-03-22', subsidiaryId: 'sub1', address: 'Akwa, Douala', isVerified: true, status: ContactStatus.ACTIVE, salesRepId: 'U002' },
    { id: 'C003', name: 'SOKAMTE, Frank', company: 'Sokamte Sarl', email: 'frank.sokamte@example.com', phone: '655443322', since: '2024-02-10', subsidiaryId: 'sub2', address: 'Bastos, Yaoundé', isVerified: true, status: ContactStatus.ACTIVE },
    { id: 'C004', name: 'KAMDEM, Paul', company: 'Individuel', email: 'paul.kamdem@example.com', phone: '698765432', since: '2024-05-01', subsidiaryId: 'sub1', address: 'Bonaberi, Douala', isVerified: true, status: ContactStatus.PROSPECT, salesRepId: 'U002' },
];

export const MOCK_ORDERS: Order[] = [
    {
        id: 'CMD-001',
        date: '2024-07-20',
        customerId: 'C002',
        customerName: 'NATA, hard (Caapfar)',
        items: [{ product: MOCK_PRODUCTS.find(p => p.id === 'P015')!, quantity: 250, price: 75 }],
        subtotal: 18750,
        taxAmount: 3375,
        taxRateId: 'tax1',
        taxRateValue: 0.1925,
        totalAmount: 22125,
        status: OrderStatus.COMPLETED,
        productionStatus: ProductionStatus.READY_FOR_DELIVERY,
        productionHistory: [],
        paymentStatus: PaymentStatus.PAID,
        amountPaid: 22125,
        subsidiaryId: 'sub1',
        paymentDueDate: '2024-07-20',
        salesRepId: 'U002'
    },
];
export const MOCK_SUPPLIERS: Supplier[] = [];
export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const MOCK_SUPPLIER_DEBTS: SupplierDebt[] = [];
export const MOCK_TRANSACTIONS: FinancialTransaction[] = [];
export const MOCK_EXPENSE_RECORDS: ExpenseRecord[] = [];
export const MOCK_OPPORTUNITIES: Opportunity[] = [];
export const MOCK_INTERACTIONS: Interaction[] = [];
export const MOCK_CRM_TASKS: CrmTask[] = [];
export const MOCK_LEADS: Lead[] = [];
export const MOCK_ACCOUNTS: Account[] = [];
export const MOCK_CONTRACTS: Contract[] = [];
export const MOCK_CREDIT_ACCOUNTS: CreditAccount[] = [];
export const MOCK_TREASURY_ACCOUNTS: TreasuryAccount[] = [];
export const MOCK_EMPLOYEES: Employee[] = [];
export const MOCK_ATTENDANCE: AttendanceRecord[] = [];
export const MOCK_PAYROLL: PayrollRecord[] = [];
export const MOCK_ABSENCES: AbsenceRecord[] = [];
export const MOCK_COMPANY_DOCUMENTS: CompanyDocument[] = [];
export const MOCK_MEETINGS: Meeting[] = [];
export const MOCK_SECRETARIAT_TASKS: SecretariatTask[] = [];

export const categoryToKeyMap: { [key: string]: string } = {
    // Imprimerie
    'Pub': 'stock.categories.pub',
    'Carterie': 'stock.categories.carterie',
    'Packaging': 'stock.categories.packaging',
    'Papeterie': 'stock.categories.papeterie',
    'Resto - Hôtels': 'stock.categories.restoHotels',
    'Impression livre': 'stock.categories.impressionLivre',
    // Signalétique & Display
    'Bâches & Banderoles': 'stock.categories.bachesBanderoles',
    'Roll-up & Kakemono': 'stock.categories.rollupKakemono',
    'Drapeaux & Oriflammes': 'stock.categories.drapeauxOriflammes',
    'Panneaux & Enseignes': 'stock.categories.panneauxEnseignes',
    'Stands & PLV': 'stock.categories.standsPlv',
    // Objets publicitaires
    'Textile': 'stock.categories.textile',
    'Mugs, gobelets et gourdes': 'stock.categories.mugsGobeletsGourdes',
    'Sacs personnalisés': 'stock.categories.sacsPersonnalises',
    'Événementiel': 'stock.categories.evenementiel',
    'Mobilier publicitaire': 'stock.categories.mobilierPublicitaire',
    'Écriture & Bureau': 'stock.categories.ecritureBureau',
    'Maison & Déco': 'stock.categories.maisonDeco',
    // Prestations de services
    'Création & gestion de sites web': 'stock.categories.creationSitesWeb',
    'Marketing digital & publicité': 'stock.categories.marketingDigital',
    'Réseaux sociaux': 'stock.categories.reseauxSociaux',
    'Design & identité visuelle': 'stock.categories.designIdentiteVisuelle',
    // Matières Premières
    'Papiers & Cartons': 'stock.categories.papiersCartons',
    'Encres & Chimiques': 'stock.categories.encresChimiques',
    'Supports & Bâches': 'stock.categories.supportsBaches',
    'Finition & Façonnage': 'stock.categories.finitionFaconnage',
    'Prestations Externes': 'stock.categories.prestationsExternes',
    'Textiles': 'stock.categories.textilesRaw',
};

export const rangeToKeyMap: { [key: string]: string } = {
    'Populaire': 'productRange.popular',
    'Standard': 'productRange.standard',
    'Premium': 'productRange.premium',
};