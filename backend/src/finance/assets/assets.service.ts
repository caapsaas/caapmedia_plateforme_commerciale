import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { FixedAssetStatus, UserRole } from '@prisma/client';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { TreasuryService } from '../treasury/treasury.service';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';
import { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly treasuryService: TreasuryService,
    private readonly accountingOutbox: AccountingOutboxService,
  ) {}

  async create(dto: CreateFixedAssetDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to create fixed assets.',
    );

    const { treasuryAccountId, ...assetData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.fixedAsset.create({
        data: {
          id: generateId(ID_PREFIXES.FIXEDASSET),
          ...assetData,
          acquisitionDate: new Date(dto.acquisitionDate),
          subsidiaryId: user.subsidiaryId,
        },
      });

      // Crée la transaction de dépense trésorerie correspondante SANS
      // journalisation générique — une acquisition d'immobilisation ne doit
      // générer qu'UNE seule écriture comptable (débit 215/crédit banque, pas
      // une charge 659 en plus), sous peine de double-comptabiliser le
      // décaissement (bug corrigé : `createExpenseTransaction` posait déjà
      // un TREASURY_EXPENSE générique en plus de FIXED_ASSET_ACQUISITION).
      await this.treasuryService.createExpenseTransactionWithTx(
        tx,
        {
          transactionDate: new Date(dto.acquisitionDate).toISOString(),
          description: `Achat immobilisation: ${asset.fixedAssetsName}`,
          amount: dto.acquisitionCost,
          treasuryAccountId,
          relatedDocumentId: asset.id,
        },
        user.subsidiaryId,
      );

      // Intention de journalisation posée dans la MÊME transaction (pattern Outbox).
      await this.accountingOutbox.enqueue(tx, {
        eventType: 'FIXED_ASSET_ACQUISITION',
        subsidiaryId: user.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: new Date(dto.acquisitionDate).toISOString(),
          amount: dto.acquisitionCost,
          description: `Acquisition: ${asset.fixedAssetsName}`,
          sourceId: asset.id,
        },
      });

      return asset;
    });
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
    const asset = await this.findOne(id, user);
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to update fixed assets.',
    );
    if (asset.status === FixedAssetStatus.DISPOSED) {
      throw new BadRequestException(
        'Cette immobilisation a été cédée et ne peut plus être modifiée.',
      );
    }

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
    const asset = await this.findOne(id, user);
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to delete fixed assets.',
    );
    if (asset.status === FixedAssetStatus.DISPOSED) {
      throw new BadRequestException(
        'Cette immobilisation a été cédée et ne peut plus être supprimée.',
      );
    }

    return this.prisma.fixedAsset.delete({ where: { id } });
  }
}
