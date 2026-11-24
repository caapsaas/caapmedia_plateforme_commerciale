// prisma/seeders/product-specs.seeder.ts
// Chantier 5 : configure des exemples de spécifications techniques sur
// quelques services représentatifs, pour que le Builder et le flux de
// commande soient directement visualisables avec des données réelles.
import { PrismaClient, Prisma, SpecFieldType, ItemType } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';

interface SpecSeedData {
  technicalKey: string;
  name: string;
  type: SpecFieldType;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  unit?: string;
  defaultValue?: unknown;
  possibleValues?: unknown;
  typeConfig?: Record<string, unknown>;
  visibleToClient?: boolean;
  visibleToProduction?: boolean;
}

interface GroupSeedData {
  name: string;
  specs: SpecSeedData[];
}

interface ProductSpecsSeedData {
  productName: string;
  groups: GroupSeedData[];
}

async function ensureReferenceList(
  prisma: PrismaClient,
  key: string,
  name: string,
  values: { value: string; label: string }[],
) {
  const list = await prisma.specReferenceList.upsert({
    where: { key },
    update: {},
    create: { id: generateId(ID_PREFIXES.SPECREFERENCELIST), key, name },
  });

  for (const [index, v] of values.entries()) {
    const existing = await prisma.specReferenceValue.findFirst({
      where: { listId: list.id, value: v.value },
    });
    if (!existing) {
      await prisma.specReferenceValue.create({
        data: {
          id: generateId(ID_PREFIXES.SPECREFERENCEVALUE),
          listId: list.id,
          value: v.value,
          label: v.label,
          order: index + 1,
        },
      });
    }
  }
  return list;
}

async function ensureGroup(
  prisma: PrismaClient,
  productId: string,
  name: string,
  order: number,
) {
  const existing = await prisma.productSpecGroup.findFirst({
    where: { productId, name },
  });
  if (existing) return existing;
  return prisma.productSpecGroup.create({
    data: { id: generateId(ID_PREFIXES.PRODUCTSPECGROUP), productId, name, order },
  });
}

const REFERENCE_PAPER_TYPES = [
  { value: 'couche_brillant', label: 'Couché brillant' },
  { value: 'couche_mat', label: 'Couché mat' },
  { value: 'offset', label: 'Offset' },
  { value: 'bristol', label: 'Bristol / Carton' },
  { value: 'kraft', label: 'Kraft' },
];

const REFERENCE_PAPER_WEIGHTS = [
  { value: '90g', label: '90g' },
  { value: '135g', label: '135g' },
  { value: '170g', label: '170g' },
  { value: '250g', label: '250g' },
  { value: '300g', label: '300g' },
  { value: '350g', label: '350g' },
];

const PRODUCTS_SPECS: ProductSpecsSeedData[] = [
  {
    productName: 'Flyers & Dépliants',
    groups: [
      {
        name: 'Papeterie',
        specs: [
          {
            technicalKey: 'format',
            name: 'Format',
            type: SpecFieldType.SELECT,
            required: true,
            possibleValues: [
              { value: 'A6', label: 'A6' },
              { value: 'A5', label: 'A5' },
              { value: 'DL', label: 'DL' },
            ],
          },
          {
            technicalKey: 'paper_type',
            name: 'Type de papier',
            type: SpecFieldType.SELECT,
            required: true,
            possibleValues: { referenceListKey: 'paper_types' },
          },
          {
            technicalKey: 'grammage',
            name: 'Grammage',
            type: SpecFieldType.SELECT,
            required: true,
            unit: 'g',
            possibleValues: { referenceListKey: 'paper_weights' },
          },
        ],
      },
      {
        name: 'Impression & Finition',
        specs: [
          {
            technicalKey: 'print_side',
            name: 'Impression',
            type: SpecFieldType.RADIO,
            required: true,
            possibleValues: [
              { value: 'recto', label: 'Recto' },
              { value: 'recto_verso', label: 'Recto/Verso' },
            ],
          },
          {
            technicalKey: 'lamination',
            name: 'Pelliculage',
            type: SpecFieldType.SELECT,
            possibleValues: [
              { value: 'aucun', label: 'Aucun' },
              { value: 'mat', label: 'Mat' },
              { value: 'brillant', label: 'Brillant' },
            ],
            defaultValue: 'aucun',
          },
        ],
      },
      {
        name: 'Livraison',
        specs: [
          {
            technicalKey: 'artwork_file',
            name: 'Fichier de visuel',
            type: SpecFieldType.UPLOAD,
            required: true,
            helpText: 'Format PDF ou AI, haute résolution (300 dpi minimum).',
            typeConfig: {
              extensions: ['PDF', 'AI'],
              maxSizeMb: 30,
              maxFiles: 2,
            },
          },
          {
            technicalKey: 'delivery_notes',
            name: 'Observations',
            type: SpecFieldType.TEXTAREA,
            placeholder: 'Instructions particulières de livraison...',
            visibleToClient: true,
            visibleToProduction: true,
          },
        ],
      },
    ],
  },
  {
    productName: 'Cartes de visite',
    groups: [
      {
        name: 'Papeterie',
        specs: [
          {
            technicalKey: 'grammage',
            name: 'Grammage',
            type: SpecFieldType.SELECT,
            required: true,
            unit: 'g',
            defaultValue: '350g',
            possibleValues: { referenceListKey: 'paper_weights' },
          },
          {
            technicalKey: 'finish',
            name: 'Finition',
            type: SpecFieldType.RADIO,
            required: true,
            possibleValues: [
              { value: 'mat', label: 'Mat' },
              { value: 'brillant', label: 'Brillant' },
            ],
          },
        ],
      },
      {
        name: 'Impression',
        specs: [
          {
            technicalKey: 'print_side',
            name: 'Impression',
            type: SpecFieldType.RADIO,
            required: true,
            possibleValues: [
              { value: 'recto', label: 'Recto' },
              { value: 'recto_verso', label: 'Recto/Verso' },
            ],
          },
          {
            technicalKey: 'quantity_boxes',
            name: 'Nombre de boîtes de 100',
            type: SpecFieldType.NUMBER,
            helpText:
              'Laisser vide si la quantité de la ligne de commande suffit.',
          },
        ],
      },
      {
        name: 'Livraison',
        specs: [
          {
            technicalKey: 'artwork_file',
            name: 'Fichier de visuel',
            type: SpecFieldType.UPLOAD,
            required: true,
            typeConfig: {
              extensions: ['PDF', 'AI'],
              maxSizeMb: 20,
              maxFiles: 2,
            },
          },
        ],
      },
    ],
  },
  {
    productName: 'T-Shirt Imprimé',
    groups: [
      {
        name: 'Produit',
        specs: [
          {
            technicalKey: 'size',
            name: 'Taille',
            type: SpecFieldType.SELECT,
            required: true,
            possibleValues: [
              { value: 'S', label: 'S' },
              { value: 'M', label: 'M' },
              { value: 'L', label: 'L' },
              { value: 'XL', label: 'XL' },
              { value: 'XXL', label: 'XXL' },
            ],
          },
          {
            technicalKey: 'color',
            name: 'Couleur',
            type: SpecFieldType.SELECT,
            required: true,
            possibleValues: [
              { value: 'blanc', label: 'Blanc' },
              { value: 'noir', label: 'Noir' },
              { value: 'couleur', label: 'Couleur (préciser en note)' },
            ],
          },
          {
            technicalKey: 'print_zone',
            name: "Zone d'impression",
            type: SpecFieldType.RADIO,
            required: true,
            possibleValues: [
              { value: 'devant', label: 'Devant' },
              { value: 'dos', label: 'Dos' },
              { value: 'devant_dos', label: 'Devant + Dos' },
            ],
          },
        ],
      },
      {
        name: 'Livraison',
        specs: [
          {
            technicalKey: 'design_file',
            name: 'Fichier du design',
            type: SpecFieldType.UPLOAD,
            required: true,
            typeConfig: {
              extensions: ['PDF', 'AI', 'PNG'],
              maxSizeMb: 20,
              maxFiles: 2,
            },
          },
          {
            technicalKey: 'notes',
            name: 'Observations',
            type: SpecFieldType.TEXTAREA,
          },
        ],
      },
    ],
  },
  {
    productName: 'Bâche publicitaire',
    groups: [
      {
        name: 'Dimensions',
        specs: [
          {
            technicalKey: 'dimensions',
            name: 'Dimensions',
            type: SpecFieldType.DIMENSIONS,
            required: true,
            unit: 'm',
            typeConfig: {
              minWidth: 0.5,
              maxWidth: 10,
              minHeight: 0.5,
              maxHeight: 5,
            },
          },
        ],
      },
      {
        name: 'Finition',
        specs: [
          {
            technicalKey: 'eyelets',
            name: 'Œillets de fixation',
            type: SpecFieldType.CHECKBOX,
            placeholder: 'Ajouter des œillets tous les 50 cm',
          },
          {
            technicalKey: 'finish',
            name: 'Finition des bords',
            type: SpecFieldType.SELECT,
            possibleValues: [
              { value: 'aucune', label: 'Aucune' },
              { value: 'ourlet', label: 'Ourlet' },
              { value: 'fourreau', label: 'Fourreau' },
            ],
            defaultValue: 'aucune',
          },
        ],
      },
      {
        name: 'Livraison',
        specs: [
          {
            technicalKey: 'artwork_file',
            name: 'Fichier de visuel',
            type: SpecFieldType.UPLOAD,
            required: true,
            typeConfig: {
              extensions: ['PDF', 'AI', 'JPG'],
              maxSizeMb: 50,
              maxFiles: 2,
            },
          },
        ],
      },
    ],
  },
  {
    productName: 'Roll-up Classique 85x200cm',
    groups: [
      {
        name: 'Configuration',
        specs: [
          {
            technicalKey: 'carry_bag',
            name: 'Sac de transport inclus',
            type: SpecFieldType.BOOLEAN,
            defaultValue: true,
          },
          {
            technicalKey: 'artwork_file',
            name: 'Fichier de visuel',
            type: SpecFieldType.UPLOAD,
            required: true,
            typeConfig: {
              extensions: ['PDF', 'AI'],
              maxSizeMb: 30,
              maxFiles: 1,
            },
          },
          {
            technicalKey: 'notes',
            name: 'Observations',
            type: SpecFieldType.TEXTAREA,
          },
        ],
      },
    ],
  },
];

export async function runProductSpecsSeeder(prisma: PrismaClient) {
  await ensureReferenceList(
    prisma,
    'paper_types',
    'Types de papier',
    REFERENCE_PAPER_TYPES,
  );
  await ensureReferenceList(
    prisma,
    'paper_weights',
    'Grammages',
    REFERENCE_PAPER_WEIGHTS,
  );

  for (const productSpecs of PRODUCTS_SPECS) {
    const product = await prisma.item.findFirst({
      where: { name: productSpecs.productName, type: ItemType.SERVICE },
    });
    if (!product) {
      console.warn(
        `Service "${productSpecs.productName}" introuvable, specs ignorées.`,
      );
      continue;
    }

    let groupOrder = 1;
    let specOrder = 1;
    for (const group of productSpecs.groups) {
      const groupRecord = await ensureGroup(
        prisma,
        product.id,
        group.name,
        groupOrder++,
      );
      for (const spec of group.specs) {
        await prisma.productSpecification.upsert({
          where: {
            productId_technicalKey: {
              productId: product.id,
              technicalKey: spec.technicalKey,
            },
          },
          update: {},
          create: {
            id: generateId(ID_PREFIXES.PRODUCTSPECIFICATION),
            productId: product.id,
            groupId: groupRecord.id,
            order: specOrder++,
            technicalKey: spec.technicalKey,
            name: spec.name,
            type: spec.type,
            required: spec.required ?? false,
            helpText: spec.helpText,
            placeholder: spec.placeholder,
            unit: spec.unit,
            defaultValue: spec.defaultValue as Prisma.InputJsonValue,
            possibleValues: spec.possibleValues as Prisma.InputJsonValue,
            typeConfig: spec.typeConfig as Prisma.InputJsonValue,
            visibleToClient: spec.visibleToClient ?? true,
            visibleToProduction: spec.visibleToProduction ?? true,
          },
        });
      }
    }
    console.log(
      `Spécifications configurées pour "${productSpecs.productName}"`,
    );
  }
}
