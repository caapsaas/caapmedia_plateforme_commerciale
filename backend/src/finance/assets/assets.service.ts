import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { User, UserRole, TransactionType, Prisma } from '@prisma/client';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { TreasuryService } from '../treasury/treasury.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TreasuryService))
    private readonly treasuryService: TreasuryService,
  ) {}

  async create(dto: CreateFixedAssetDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to create fixed assets.');
    }

    const { treasuryAccountId, ...assetData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Créer l'immobilisation
      const asset = await tx.fixedAsset.create({
        data: {
          ...assetData,
          acquisitionDate: new Date(dto.acquisitionDate),
          subsidiaryId: user.subsidiaryId,
        },
      });

      // 2. Créer la transaction de dépense correspondante
      await this.treasuryService.createExpenseTransaction({
        transactionDate: new Date(dto.acquisitionDate).toISOString(),
        description: `Achat immobilisation: ${asset.fixedAssetsName}`,
        amount: dto.acquisitionCost,
        treasuryAccountId: treasuryAccountId,
        relatedDocumentId: asset.id,
        // status est optionnel et sera géré par TreasuryService
      }, user);

      return asset;
    });
  }

  async findAll(user: User) {
    return this.prisma.fixedAsset.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { acquisitionDate: 'desc' },
    });
  }

  async findOne(id: string, user: User) {
    const asset = await this.prisma.fixedAsset.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!asset) {
      throw new NotFoundException(`Fixed asset with ID "${id}" not found.`);
    }
    return asset;
  }

  async update(id: string, dto: UpdateFixedAssetDto, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to update fixed assets.');
    }

    return this.prisma.fixedAsset.update({
      where: { id },
      data: {
        ...dto,
        acquisitionDate: dto.acquisitionDate ? new Date(dto.acquisitionDate) : undefined,
      },
    });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to delete fixed assets.');
    }
    
    // Note: La suppression d'une immobilisation devrait idéalement être une "cession"
    // qui génère des écritures comptables. Ici, nous faisons une suppression simple.
    return this.prisma.fixedAsset.delete({
      where: { id },
    });
  }
}
