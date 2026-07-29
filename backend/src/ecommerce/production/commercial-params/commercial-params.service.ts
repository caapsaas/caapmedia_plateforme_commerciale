import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { UpsertCommercialParamsDto } from './dto/upsert-commercial-params.dto';
import { Prisma } from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

@Injectable()
export class CommercialParamsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: UpsertCommercialParamsDto, user: JwtUser) {
    if (dto.minMarginPercent >= dto.maxMarginPercent) {
      throw new BadRequestException(
        'La marge minimale doit être strictement inférieure à la marge maximale.',
      );
    }

    const existing = await this.prisma.commercialParams.findFirst();

    if (existing) {
      return this.prisma.commercialParams.update({
        where: { id: existing.id },
        data: {
          minMarginPercent: new Prisma.Decimal(dto.minMarginPercent),
          maxMarginPercent: new Prisma.Decimal(dto.maxMarginPercent),
          updatedById: user.id,
        },
      });
    }

    return this.prisma.commercialParams.create({
      data: {
        id: generateId(ID_PREFIXES.COMMERCIALPARAMS),
        minMarginPercent: new Prisma.Decimal(dto.minMarginPercent),
        maxMarginPercent: new Prisma.Decimal(dto.maxMarginPercent),
        updatedById: user.id,
      },
    });
  }

  async findGlobal() {
    const params = await this.prisma.commercialParams.findFirst();
    if (!params) {
      throw new NotFoundException(
        'Les paramètres commerciaux ne sont pas encore configurés.',
      );
    }
    return params;
  }
}
