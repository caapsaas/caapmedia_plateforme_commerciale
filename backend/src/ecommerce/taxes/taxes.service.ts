import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/create-taxe.dto';
import { Prisma } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une taxe
   * @param createTaxDto Dto contenant les donnees de la taxe a creer
   * @returns Taxe creee
   */
  async create(createTaxDto: CreateTaxDto) {
    return this.prisma.$transaction(async (tx) => {
      // Si la nouvelle taxe est définie par défaut, on désactive les autres.
      if (createTaxDto.isDefault) {
        await tx.taxRate.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.taxRate.create({
        data: {
          id: generateId(ID_PREFIXES.TAXRATE),
          ...createTaxDto,
          rate: new Prisma.Decimal(createTaxDto.rate),
        },
      });
    });
  }

  /**
   * Recuperer toutes les taxes
   * @returns Liste des taxes
   */
  findAll() {
    return this.prisma.taxRate.findMany({
      orderBy: { taxRatesName: 'asc' },
    });
  }

  /**
   * Recuperer une taxe par son id
   * @param id Id de la taxe a recuperer
   * @returns Taxe trouvee
   */
  findOne(id: string) {
    return this.prisma.taxRate.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Mettre a jour une taxe
   * @param id Id de la taxe a mettre a jour
   * @param updateTaxDto Dto contenant les donnees de la taxe a mettre a jour
   * @returns Taxe mise a jour
   */
  async update(id: string, updateTaxDto: UpdateTaxDto) {
    // Règle : On ne peut pas désactiver manuellement une taxe par défaut.
    // La seule façon de le faire est de définir une autre taxe comme étant par défaut.
    if (updateTaxDto.isDefault === false) {
      const currentTax = await this.prisma.taxRate.findUnique({
        where: { id },
      });
      if (currentTax?.isDefault) {
        throw new BadRequestException(
          'Impossible de désactiver la taxe par défaut. Veuillez définir une autre taxe comme étant par défaut pour la remplacer.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Si on définit cette taxe comme étant la nouvelle par défaut, on désactive les autres.
      if (updateTaxDto.isDefault) {
        await tx.taxRate.updateMany({
          where: { isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.taxRate.update({
        where: { id },
        data: {
          ...updateTaxDto,
          ...(updateTaxDto.rate && {
            rate: new Prisma.Decimal(updateTaxDto.rate),
          }),
        },
      });
    });
  }

  /**
   * Supprimer une taxe
   * @param id Id de la taxe a supprimer
   * @returns Taxe supprimee
   */
  async remove(id: string) {
    const tax = await this.findOne(id);
    if (tax.isDefault) {
      throw new BadRequestException(
        'Impossible de supprimer la taxe par défaut.',
      );
    }
    return this.prisma.taxRate.delete({ where: { id } });
  }
}
