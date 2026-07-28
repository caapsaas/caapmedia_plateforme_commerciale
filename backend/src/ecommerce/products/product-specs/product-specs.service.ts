import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { ItemType, Prisma, SpecFieldType } from '@prisma/client';
import {
  CreateSpecGroupDto,
  CreateSpecificationDto,
  ReorderSpecificationsDto,
  UpdateSpecGroupDto,
  UpdateSpecificationDto,
} from './dto/product-spec.dto';

export interface ResolvedOption {
  value: string;
  label: string;
}

export interface FormDefinitionSpec {
  id: string;
  groupId: string | null;
  name: string;
  technicalKey: string;
  type: SpecFieldType;
  required: boolean;
  defaultValue: unknown;
  possibleValues: ResolvedOption[] | null;
  order: number;
  helpText: string | null;
  placeholder: string | null;
  unit: string | null;
  visibleToClient: boolean;
  visibleToProduction: boolean;
  editableAfterValidation: boolean;
  searchable: boolean;
  typeConfig: unknown;
  rules: unknown;
}

export interface FormDefinitionGroup {
  id: string;
  name: string;
  order: number;
  specifications: FormDefinitionSpec[];
}

export interface FormDefinition {
  productId: string;
  groups: FormDefinitionGroup[];
  ungroupedSpecifications: FormDefinitionSpec[];
}

// Moteur de spécifications configurables (Chantier 5) : un produit (Item,
// type=SERVICE) définit son propre modèle de formulaire. getFormDefinition()
// est LA source unique de vérité du schéma — utilisée par le controller (lecture
// admin/commercial) ET par orders.service.ts (validation serveur), jamais dupliquée.
@Injectable()
export class ProductSpecsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertServiceExists(productId: string) {
    const product = await this.prisma.item.findUnique({
      where: { id: productId, type: ItemType.SERVICE },
    });
    if (!product) {
      throw new NotFoundException(
        `Service avec l'ID "${productId}" non trouvé`,
      );
    }
    return product;
  }

  async createGroup(productId: string, dto: CreateSpecGroupDto) {
    await this.assertServiceExists(productId);

    const order =
      dto.order ??
      (await this.prisma.productSpecGroup.count({ where: { productId } })) + 1;

    return this.prisma.productSpecGroup.create({
      data: { productId, name: dto.name, order },
    });
  }

  async updateGroup(groupId: string, dto: UpdateSpecGroupDto) {
    await this.findGroupOrThrow(groupId);
    return this.prisma.productSpecGroup.update({
      where: { id: groupId },
      data: dto,
    });
  }

  async removeGroup(groupId: string) {
    await this.findGroupOrThrow(groupId);
    // Les spécifications du groupe restent (groupId passe à null), voir onDelete: SetNull.
    await this.prisma.productSpecGroup.delete({ where: { id: groupId } });
    return { id: groupId };
  }

  private async findGroupOrThrow(groupId: string) {
    const group = await this.prisma.productSpecGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`Groupe avec l'ID "${groupId}" non trouvé`);
    }
    return group;
  }

  async createSpecification(productId: string, dto: CreateSpecificationDto) {
    await this.assertServiceExists(productId);

    const existing = await this.prisma.productSpecification.findUnique({
      where: {
        productId_technicalKey: { productId, technicalKey: dto.technicalKey },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Une spécification avec la clé technique "${dto.technicalKey}" existe déjà pour ce produit.`,
      );
    }

    const order =
      dto.order ??
      (await this.prisma.productSpecification.count({ where: { productId } })) +
        1;

    return this.prisma.productSpecification.create({
      data: {
        productId,
        groupId: dto.groupId,
        name: dto.name,
        technicalKey: dto.technicalKey,
        type: dto.type,
        required: dto.required ?? false,
        defaultValue: dto.defaultValue as Prisma.InputJsonValue,
        possibleValues: dto.possibleValues as Prisma.InputJsonValue,
        order,
        helpText: dto.helpText,
        placeholder: dto.placeholder,
        unit: dto.unit,
        visibleToClient: dto.visibleToClient ?? true,
        visibleToProduction: dto.visibleToProduction ?? true,
        editableAfterValidation: dto.editableAfterValidation ?? false,
        searchable: dto.searchable ?? false,
        internalDescription: dto.internalDescription,
        typeConfig: dto.typeConfig as Prisma.InputJsonValue,
        rules: dto.rules as Prisma.InputJsonValue,
      },
    });
  }

  async updateSpecification(specId: string, dto: UpdateSpecificationDto) {
    const spec = await this.findSpecOrThrow(specId);

    if (dto.technicalKey && dto.technicalKey !== spec.technicalKey) {
      const existing = await this.prisma.productSpecification.findUnique({
        where: {
          productId_technicalKey: {
            productId: spec.productId,
            technicalKey: dto.technicalKey,
          },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Une spécification avec la clé technique "${dto.technicalKey}" existe déjà pour ce produit.`,
        );
      }
    }

    return this.prisma.productSpecification.update({
      where: { id: specId },
      data: dto as Prisma.ProductSpecificationUpdateInput,
    });
  }

  async removeSpecification(specId: string) {
    await this.findSpecOrThrow(specId);
    await this.prisma.productSpecification.delete({ where: { id: specId } });
    return { id: specId };
  }

  private async findSpecOrThrow(specId: string) {
    const spec = await this.prisma.productSpecification.findUnique({
      where: { id: specId },
    });
    if (!spec) {
      throw new NotFoundException(
        `Spécification avec l'ID "${specId}" non trouvée`,
      );
    }
    return spec;
  }

  async reorderSpecifications(
    productId: string,
    dto: ReorderSpecificationsDto,
  ) {
    await this.assertServiceExists(productId);

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.productSpecification.update({
          where: { id: item.id },
          data: { order: item.order, groupId: item.groupId ?? null },
        }),
      ),
    );

    return this.getFormDefinition(productId);
  }

  /**
   * Structure brute (non résolue) des groupes + spécifications d'un produit,
   * pour l'édition dans le Builder — contrairement à getFormDefinition(), les
   * possibleValues d'un champ basé sur un référentiel restent sous la forme
   * { referenceListKey } plutôt que résolues, pour rester éditables.
   */
  async getBuilderStructure(productId: string) {
    await this.assertServiceExists(productId);

    const [groups, specifications] = await Promise.all([
      this.prisma.productSpecGroup.findMany({
        where: { productId },
        orderBy: { order: 'asc' },
      }),
      this.prisma.productSpecification.findMany({
        where: { productId },
        orderBy: { order: 'asc' },
      }),
    ]);

    const specsByGroup = new Map<string, typeof specifications>();
    const ungrouped: typeof specifications = [];
    for (const spec of specifications) {
      if (spec.groupId) {
        const list = specsByGroup.get(spec.groupId) ?? [];
        list.push(spec);
        specsByGroup.set(spec.groupId, list);
      } else {
        ungrouped.push(spec);
      }
    }

    return {
      groups: groups.map((group) => ({
        ...group,
        specifications: specsByGroup.get(group.id) ?? [],
      })),
      ungroupedSpecifications: ungrouped,
    };
  }

  /**
   * Source unique de vérité du schéma de formulaire d'un produit : assemble
   * groupes + spécifications ordonnés, résout les possibleValues référençant
   * un référentiel partagé (SpecReferenceList). Utilisée par le controller
   * (GET form-definition) ET par orders.service.ts (validation serveur) —
   * ne jamais dupliquer cette résolution ailleurs.
   */
  async getFormDefinition(productId: string): Promise<FormDefinition> {
    await this.assertServiceExists(productId);

    const [groups, specifications] = await Promise.all([
      this.prisma.productSpecGroup.findMany({
        where: { productId },
        orderBy: { order: 'asc' },
      }),
      this.prisma.productSpecification.findMany({
        where: { productId },
        orderBy: { order: 'asc' },
      }),
    ]);

    // Pré-résoudre tous les référentiels utilisés par ce produit en une seule requête.
    const referenceListKeys = specifications
      .map((spec) => this.getReferenceListKey(spec.possibleValues))
      .filter((key): key is string => !!key);

    const referenceLists = referenceListKeys.length
      ? await this.prisma.specReferenceList.findMany({
          where: { key: { in: referenceListKeys } },
          include: { values: { orderBy: { order: 'asc' } } },
        })
      : [];
    const referenceListsByKey = new Map(
      referenceLists.map((list) => [list.key, list]),
    );

    const toFormSpec = (
      spec: (typeof specifications)[number],
    ): FormDefinitionSpec => ({
      id: spec.id,
      groupId: spec.groupId,
      name: spec.name,
      technicalKey: spec.technicalKey,
      type: spec.type,
      required: spec.required,
      defaultValue: spec.defaultValue,
      possibleValues: this.resolvePossibleValues(
        spec.possibleValues,
        referenceListsByKey,
      ),
      order: spec.order,
      helpText: spec.helpText,
      placeholder: spec.placeholder,
      unit: spec.unit,
      visibleToClient: spec.visibleToClient,
      visibleToProduction: spec.visibleToProduction,
      editableAfterValidation: spec.editableAfterValidation,
      searchable: spec.searchable,
      typeConfig: spec.typeConfig,
      rules: spec.rules,
    });

    const specsByGroup = new Map<string, FormDefinitionSpec[]>();
    const ungrouped: FormDefinitionSpec[] = [];

    for (const spec of specifications) {
      const formSpec = toFormSpec(spec);
      if (spec.groupId) {
        const list = specsByGroup.get(spec.groupId) ?? [];
        list.push(formSpec);
        specsByGroup.set(spec.groupId, list);
      } else {
        ungrouped.push(formSpec);
      }
    }

    return {
      productId,
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        order: group.order,
        specifications: specsByGroup.get(group.id) ?? [],
      })),
      ungroupedSpecifications: ungrouped,
    };
  }

  private getReferenceListKey(possibleValues: unknown): string | null {
    if (
      possibleValues &&
      typeof possibleValues === 'object' &&
      !Array.isArray(possibleValues) &&
      'referenceListKey' in (possibleValues as Record<string, unknown>)
    ) {
      const key = (possibleValues as Record<string, unknown>).referenceListKey;
      return typeof key === 'string' ? key : null;
    }
    return null;
  }

  private resolvePossibleValues(
    possibleValues: unknown,
    referenceListsByKey: Map<
      string,
      { values: { value: string; label: string }[] }
    >,
  ): ResolvedOption[] | null {
    const referenceListKey = this.getReferenceListKey(possibleValues);
    if (referenceListKey) {
      const list = referenceListsByKey.get(referenceListKey);
      return list
        ? list.values.map((v) => ({ value: v.value, label: v.label }))
        : [];
    }

    if (Array.isArray(possibleValues)) {
      return possibleValues.map((item) =>
        typeof item === 'string'
          ? { value: item, label: item }
          : (item as ResolvedOption),
      );
    }

    return null;
  }

  /**
   * Valide de façon pure (sans accès DB) un jeu de valeurs contre une
   * définition déjà résolue — permet de valider plusieurs lignes de commande
   * pour le même produit sans refaire l'assemblage à chaque fois.
   */
  validateAgainstDefinition(
    definition: FormDefinition,
    specValues: Record<string, unknown> | null | undefined,
  ): void {
    const allSpecs = [
      ...definition.ungroupedSpecifications,
      ...definition.groups.flatMap((g) => g.specifications),
    ];

    const values = specValues ?? {};
    const errors: string[] = [];

    for (const spec of allSpecs) {
      const value = values[spec.technicalKey];
      const isEmpty = value === undefined || value === null || value === '';

      if (spec.required && isEmpty) {
        errors.push(`Le champ "${spec.name}" est obligatoire.`);
        continue;
      }

      if (isEmpty) continue;

      if (
        (spec.type === SpecFieldType.SELECT ||
          spec.type === SpecFieldType.RADIO) &&
        spec.possibleValues &&
        !spec.possibleValues.some((opt) => opt.value === value)
      ) {
        const displayValue =
          typeof value === 'string' || typeof value === 'number'
            ? value
            : JSON.stringify(value);
        errors.push(
          `La valeur "${displayValue}" n'est pas valide pour le champ "${spec.name}".`,
        );
      }

      if (spec.type === SpecFieldType.MULTISELECT && spec.possibleValues) {
        const selected = Array.isArray(value) ? value : [value];
        const invalid = selected.filter(
          (v) => !spec.possibleValues.some((opt) => opt.value === v),
        );
        if (invalid.length > 0) {
          errors.push(
            `Valeurs invalides pour le champ "${spec.name}": ${invalid.join(', ')}.`,
          );
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Spécifications invalides.',
        errors,
      });
    }
  }

  /**
   * Valide server-side les valeurs saisies par le commercial pour un produit
   * donné, en s'appuyant sur getFormDefinition() (jamais de règle dupliquée).
   * Ne jamais faire confiance à la validation frontend seule.
   */
  async validateSpecValues(
    productId: string,
    specValues: Record<string, unknown> | null | undefined,
  ): Promise<FormDefinition> {
    const definition = await this.getFormDefinition(productId);
    this.validateAgainstDefinition(definition, specValues);
    return definition;
  }
}
