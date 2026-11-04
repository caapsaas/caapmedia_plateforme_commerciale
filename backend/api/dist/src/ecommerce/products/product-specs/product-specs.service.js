"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSpecsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../../common/constants/id-prefixes.const");
let ProductSpecsService = class ProductSpecsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertServiceExists(productId) {
        const product = await this.prisma.item.findUnique({
            where: { id: productId, type: client_1.ItemType.SERVICE },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Service avec l'ID "${productId}" non trouvé`);
        }
        return product;
    }
    async createGroup(productId, dto) {
        await this.assertServiceExists(productId);
        const order = dto.order ??
            (await this.prisma.productSpecGroup.count({ where: { productId } })) + 1;
        return this.prisma.productSpecGroup.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTSPECGROUP),
                productId,
                name: dto.name,
                order,
            },
        });
    }
    async updateGroup(groupId, dto) {
        await this.findGroupOrThrow(groupId);
        return this.prisma.productSpecGroup.update({
            where: { id: groupId },
            data: dto,
        });
    }
    async removeGroup(groupId) {
        await this.findGroupOrThrow(groupId);
        await this.prisma.productSpecGroup.delete({ where: { id: groupId } });
        return { id: groupId };
    }
    async findGroupOrThrow(groupId) {
        const group = await this.prisma.productSpecGroup.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new common_1.NotFoundException(`Groupe avec l'ID "${groupId}" non trouvé`);
        }
        return group;
    }
    async createSpecification(productId, dto) {
        await this.assertServiceExists(productId);
        const existing = await this.prisma.productSpecification.findUnique({
            where: {
                productId_technicalKey: { productId, technicalKey: dto.technicalKey },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Une spécification avec la clé technique "${dto.technicalKey}" existe déjà pour ce produit.`);
        }
        const order = dto.order ??
            (await this.prisma.productSpecification.count({ where: { productId } })) +
                1;
        return this.prisma.productSpecification.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTSPECIFICATION),
                productId,
                groupId: dto.groupId,
                name: dto.name,
                technicalKey: dto.technicalKey,
                type: dto.type,
                required: dto.required ?? false,
                defaultValue: dto.defaultValue,
                possibleValues: dto.possibleValues,
                order,
                helpText: dto.helpText,
                placeholder: dto.placeholder,
                unit: dto.unit,
                visibleToClient: dto.visibleToClient ?? true,
                visibleToProduction: dto.visibleToProduction ?? true,
                editableAfterValidation: dto.editableAfterValidation ?? false,
                searchable: dto.searchable ?? false,
                internalDescription: dto.internalDescription,
                typeConfig: dto.typeConfig,
                rules: dto.rules,
            },
        });
    }
    async updateSpecification(specId, dto) {
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
                throw new common_1.BadRequestException(`Une spécification avec la clé technique "${dto.technicalKey}" existe déjà pour ce produit.`);
            }
        }
        return this.prisma.productSpecification.update({
            where: { id: specId },
            data: dto,
        });
    }
    async removeSpecification(specId) {
        await this.findSpecOrThrow(specId);
        await this.prisma.productSpecification.delete({ where: { id: specId } });
        return { id: specId };
    }
    async findSpecOrThrow(specId) {
        const spec = await this.prisma.productSpecification.findUnique({
            where: { id: specId },
        });
        if (!spec) {
            throw new common_1.NotFoundException(`Spécification avec l'ID "${specId}" non trouvée`);
        }
        return spec;
    }
    async reorderSpecifications(productId, dto) {
        await this.assertServiceExists(productId);
        await this.prisma.$transaction(dto.items.map((item) => this.prisma.productSpecification.update({
            where: { id: item.id },
            data: { order: item.order, groupId: item.groupId ?? null },
        })));
        return this.getFormDefinition(productId);
    }
    async getBuilderStructure(productId) {
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
        const specsByGroup = new Map();
        const ungrouped = [];
        for (const spec of specifications) {
            if (spec.groupId) {
                const list = specsByGroup.get(spec.groupId) ?? [];
                list.push(spec);
                specsByGroup.set(spec.groupId, list);
            }
            else {
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
    async getFormDefinition(productId) {
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
        const referenceListKeys = specifications
            .map((spec) => this.getReferenceListKey(spec.possibleValues))
            .filter((key) => !!key);
        const referenceLists = referenceListKeys.length
            ? await this.prisma.specReferenceList.findMany({
                where: { key: { in: referenceListKeys } },
                include: { values: { orderBy: { order: 'asc' } } },
            })
            : [];
        const referenceListsByKey = new Map(referenceLists.map((list) => [list.key, list]));
        const toFormSpec = (spec) => ({
            id: spec.id,
            groupId: spec.groupId,
            name: spec.name,
            technicalKey: spec.technicalKey,
            type: spec.type,
            required: spec.required,
            defaultValue: spec.defaultValue,
            possibleValues: this.resolvePossibleValues(spec.possibleValues, referenceListsByKey),
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
        const specsByGroup = new Map();
        const ungrouped = [];
        for (const spec of specifications) {
            const formSpec = toFormSpec(spec);
            if (spec.groupId) {
                const list = specsByGroup.get(spec.groupId) ?? [];
                list.push(formSpec);
                specsByGroup.set(spec.groupId, list);
            }
            else {
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
    getReferenceListKey(possibleValues) {
        if (possibleValues &&
            typeof possibleValues === 'object' &&
            !Array.isArray(possibleValues) &&
            'referenceListKey' in possibleValues) {
            const key = possibleValues.referenceListKey;
            return typeof key === 'string' ? key : null;
        }
        return null;
    }
    resolvePossibleValues(possibleValues, referenceListsByKey) {
        const referenceListKey = this.getReferenceListKey(possibleValues);
        if (referenceListKey) {
            const list = referenceListsByKey.get(referenceListKey);
            return list
                ? list.values.map((v) => ({ value: v.value, label: v.label }))
                : [];
        }
        if (Array.isArray(possibleValues)) {
            return possibleValues.map((item) => typeof item === 'string'
                ? { value: item, label: item }
                : item);
        }
        return null;
    }
    validateAgainstDefinition(definition, specValues) {
        const allSpecs = [
            ...definition.ungroupedSpecifications,
            ...definition.groups.flatMap((g) => g.specifications),
        ];
        const values = specValues ?? {};
        const errors = [];
        for (const spec of allSpecs) {
            const value = values[spec.technicalKey];
            const isEmpty = value === undefined || value === null || value === '';
            if (spec.required && isEmpty) {
                errors.push(`Le champ "${spec.name}" est obligatoire.`);
                continue;
            }
            if (isEmpty)
                continue;
            if ((spec.type === client_1.SpecFieldType.SELECT ||
                spec.type === client_1.SpecFieldType.RADIO) &&
                spec.possibleValues &&
                !spec.possibleValues.some((opt) => opt.value === value)) {
                const displayValue = typeof value === 'string' || typeof value === 'number'
                    ? value
                    : JSON.stringify(value);
                errors.push(`La valeur "${displayValue}" n'est pas valide pour le champ "${spec.name}".`);
            }
            if (spec.type === client_1.SpecFieldType.MULTISELECT && spec.possibleValues) {
                const selected = Array.isArray(value) ? value : [value];
                const invalid = selected.filter((v) => !spec.possibleValues.some((opt) => opt.value === v));
                if (invalid.length > 0) {
                    errors.push(`Valeurs invalides pour le champ "${spec.name}": ${invalid.join(', ')}.`);
                }
            }
        }
        if (errors.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Spécifications invalides.',
                errors,
            });
        }
    }
    async validateSpecValues(productId, specValues) {
        const definition = await this.getFormDefinition(productId);
        this.validateAgainstDefinition(definition, specValues);
        return definition;
    }
};
exports.ProductSpecsService = ProductSpecsService;
exports.ProductSpecsService = ProductSpecsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductSpecsService);
//# sourceMappingURL=product-specs.service.js.map