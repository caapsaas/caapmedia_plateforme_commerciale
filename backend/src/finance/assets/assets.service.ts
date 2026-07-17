import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { TreasuryService } from '../treasury/treasury.service';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';
import { JournalizationService } from 'src/accounting/journalization/journalization.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly treasuryService: TreasuryService,
    private readonly journalization: JournalizationService,
  ) {}

  async create(dto: CreateFixedAssetDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to create fixed assets.',
    );

    const { treasuryAccountId, ...assetData } = dto;

    const asset = await this.prisma.fixedAsset.create({
      data: {
        ...assetData,
        acquisitionDate: new Date(dto.acquisitionDate),
        subsidiaryId: user.subsidiaryId,
      },
    });

    // Crée la transaction de dépense trésorerie correspondante
    await this.treasuryService.createExpenseTransaction(
      {
        transactionDate: new Date(dto.acquisitionDate).toISOString(),
        description: `Achat immobilisation: ${asset.fixedAssetsName}`,
        amount: dto.acquisitionCost,
        treasuryAccountId,
        relatedDocumentId: asset.id,
      },
      user,
    );

    // Journalisation SYSCOHADA spécifique immobilisation
    await this.journalization.journalize({
      subsidiaryId: user.subsidiaryId,
      userId: user.id,
      operationDate: new Date(dto.acquisitionDate),
      amount: dto.acquisitionCost,
      description: `Acquisition: ${asset.fixedAssetsName}`,
      sourceType: 'FIXED_ASSET_ACQUISITION',
      sourceId: asset.id,
    });

    return asset;
  }

  async findAll(user: JwtUser) {
    return this.prisma.fixedAsset.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { acquisitionDate: 'desc' },
    });
  }

  async findOne(id: string, user: JwtUser) {
    const asset = await this.prisma.fixedAsset.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    if (!asset)
      throw new NotFoundException(`Fixed asset with ID "${id}" not found.`);
    return asset;
  }

  async update(id: string, dto: UpdateFixedAssetDto, user: JwtUser) {
    await this.findOne(id, user);
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to update fixed assets.',
    );

    return this.prisma.fixedAsset.update({
      where: { id },
      data: {
        ...dto,
        acquisitionDate: dto.acquisitionDate
          ? new Date(dto.acquisitionDate)
          : undefined,
      },
    });
  }

  async remove(id: string, user: JwtUser) {
    await this.findOne(id, user);
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to delete fixed assets.',
    );

    return this.prisma.fixedAsset.delete({ where: { id } });
  }
}
