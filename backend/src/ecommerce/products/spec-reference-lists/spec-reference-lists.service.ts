import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  CreateReferenceListDto,
  CreateReferenceValueDto,
  UpdateReferenceListDto,
  UpdateReferenceValueDto,
} from './dto/spec-reference-list.dto';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

// Référentiels partagés entre services (Types de papier, Grammages, Couleurs...) —
// administrables sans toucher au code, référencés depuis ProductSpecification.possibleValues
// via { referenceListKey: "..." } (voir ProductSpecsService.getFormDefinition).
@Injectable()
export class SpecReferenceListsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReferenceListDto) {
    const existing = await this.prisma.specReferenceList.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new BadRequestException(
        `Un référentiel avec la clé "${dto.key}" existe déjà.`,
      );
    }
    return this.prisma.specReferenceList.create({
      data: { id: generateId(ID_PREFIXES.SPECREFERENCELIST), ...dto },
    });
  }

  findAll() {
    return this.prisma.specReferenceList.findMany({
      include: { values: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const list = await this.prisma.specReferenceList.findUnique({
      where: { id },
      include: { values: { orderBy: { order: 'asc' } } },
    });
    if (!list) {
      throw new NotFoundException(`Référentiel avec l'ID "${id}" non trouvé`);
    }
    return list;
  }

  async update(id: string, dto: UpdateReferenceListDto) {
    await this.findOne(id);
    return this.prisma.specReferenceList.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.specReferenceList.delete({ where: { id } });
    return { id };
  }

  async addValue(listId: string, dto: CreateReferenceValueDto) {
    await this.findOne(listId);
    const order =
      dto.order ??
      (await this.prisma.specReferenceValue.count({ where: { listId } })) + 1;
    return this.prisma.specReferenceValue.create({
      data: {
        id: generateId(ID_PREFIXES.SPECREFERENCEVALUE),
        listId,
        value: dto.value,
        label: dto.label,
        order,
      },
    });
  }

  async updateValue(valueId: string, dto: UpdateReferenceValueDto) {
    await this.findValueOrThrow(valueId);
    return this.prisma.specReferenceValue.update({
      where: { id: valueId },
      data: dto,
    });
  }

  async removeValue(valueId: string) {
    await this.findValueOrThrow(valueId);
    await this.prisma.specReferenceValue.delete({ where: { id: valueId } });
    return { id: valueId };
  }

  private async findValueOrThrow(valueId: string) {
    const value = await this.prisma.specReferenceValue.findUnique({
      where: { id: valueId },
    });
    if (!value) {
      throw new NotFoundException(
        `Valeur de référentiel avec l'ID "${valueId}" non trouvée`,
      );
    }
    return value;
  }
}
