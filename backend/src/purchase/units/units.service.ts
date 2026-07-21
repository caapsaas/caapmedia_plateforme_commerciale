import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

// Référentiel d'unités de mesure (Chantier 2) — administrable, partagé par
// tous les produits de stock (unité de base + unités d'emballage/achat).
@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.unit.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      throw new NotFoundException(`Unité avec l'ID "${id}" non trouvée`);
    }
    return unit;
  }

  create(dto: CreateUnitDto) {
    return this.prisma.unit.create({ data: dto });
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.findOne(id);
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.unit.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cette unité est utilisée par au moins un produit de stock et ne peut pas être supprimée.',
        );
      }
      throw error;
    }
    return { id };
  }
}
