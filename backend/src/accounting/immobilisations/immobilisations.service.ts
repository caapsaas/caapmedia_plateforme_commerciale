import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { FixedAsset, FixedAssetStatus, UserRole } from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';
import {
  resolveScopeContext,
  resolveEffectiveSubsidiaryId,
  assertSubsidiaryAccess,
} from 'src/common/utils/subsidiary-scope';
import { EntriesService } from '../entries/entries.service';
import { MappingsService } from '../accounts/mappings.service';
import { DisposeFixedAssetDto } from './dto/dispose-fixed-asset.dto';
import { paginate } from 'src/common/pagination/pagination';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

const ACCOUNTING_GLOBAL_SCOPE_ROLES = [UserRole.FINANCIAL_DIRECTOR];

type DotationInput = Pick<
  FixedAsset,
  | 'acquisitionCost'
  | 'residualValue'
  | 'cumulativeAmortization'
  | 'depreciationRate'
  | 'acquisitionDate'
>;

@Injectable()
export class ImmobilisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entriesService: EntriesService,
    private readonly mappingsService: MappingsService,
  ) {}

  /**
   * Dotation annuelle linéaire : base amortissable = coût d'acquisition −
   * valeur résiduelle. L'année d'acquisition, la dotation est proratisée sur
   * les mois restants (mois d'acquisition inclus). Plafonnée pour ne jamais
   * amortir sous la valeur résiduelle.
   */
  computeAnnualDotation(asset: DotationInput, year: number): number {
    const base = Number(asset.acquisitionCost) - Number(asset.residualValue);
    const remaining = base - Number(asset.cumulativeAmortization);
    if (remaining <= 0) return 0;

    const acquisitionYear = asset.acquisitionDate.getFullYear();
    if (year < acquisitionYear) return 0;

    let dotation = base * (Number(asset.depreciationRate) / 100);
    if (year === acquisitionYear) {
      const monthsRemaining = 12 - asset.acquisitionDate.getMonth();
      dotation = dotation * (monthsRemaining / 12);
    }

    return Math.min(dotation, remaining);
  }

  /**
   * Génère la dotation aux amortissements de l'année pour toutes les
   * immobilisations ACTIVE du périmètre. Idempotent : une immobilisation déjà
   * traitée pour `year` (`lastAmortizationYear >= year`) est ignorée, et la
   * référence déterministe `AMORT-{id}-{year}` empêche tout doublon d'écriture
   * même en cas de rejeu. Appelée directement (pas via l'outbox) : action
   * explicite d'un utilisateur autorisé, les erreurs doivent remonter
   * immédiatement plutôt qu'être retentées en tâche de fond.
   */
  async generateAnnualDepreciation(
    user: JwtUser,
    year: number,
    subsidiaryIdFilter?: string,
  ) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission refusée pour générer les dotations aux amortissements.',
    );
    const ctx = resolveScopeContext(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
    const effectiveSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      subsidiaryIdFilter,
    );

    const assets = await this.prisma.fixedAsset.findMany({
      where: {
        status: FixedAssetStatus.ACTIVE,
        acquisitionDate: { lte: new Date(`${year}-12-31`) },
        ...(effectiveSubsidiaryId
          ? { subsidiaryId: effectiveSubsidiaryId }
          : {}),
      },
    });

    const mappings = await this.mappingsService.getMap();
    const amortExpenseAccount = mappings['AMORTIZATION_EXPENSE'] || '681000';
    const amortAccount = mappings['AMORTIZATION_ACCOUNT'] || '281000';

    const results: Array<{
      assetId: string;
      name: string;
      dotation: number;
      skipped?: string;
    }> = [];

    for (const asset of assets) {
      if (asset.lastAmortizationYear && asset.lastAmortizationYear >= year) {
        results.push({
          assetId: asset.id,
          name: asset.fixedAssetsName,
          dotation: 0,
          skipped: 'déjà traité pour cet exercice',
        });
        continue;
      }

      const dotation = this.computeAnnualDotation(asset, year);
      if (dotation <= 0) {
        results.push({
          assetId: asset.id,
          name: asset.fixedAssetsName,
          dotation: 0,
          skipped: 'entièrement amorti ou hors période',
        });
        continue;
      }

      await this.entriesService.createAutomaticEntry({
        date: new Date(`${year}-12-31`),
        reference: `AMORT-${asset.id}-${year}`,
        description: `Dotation aux amortissements ${year} — ${asset.fixedAssetsName}`,
        journalCode: 'JOD',
        subsidiaryId: asset.subsidiaryId,
        sourceType: 'FIXED_ASSET_AMORTIZATION',
        sourceId: asset.id,
        lines: [
          {
            accountNumber: amortExpenseAccount,
            description: 'Dotation aux amortissements',
            debitAmount: dotation,
            creditAmount: 0,
          },
          {
            accountNumber: amortAccount,
            description: 'Amortissements cumulés',
            debitAmount: 0,
            creditAmount: dotation,
          },
        ],
      });

      await this.prisma.fixedAsset.update({
        where: { id: asset.id },
        data: {
          cumulativeAmortization: { increment: dotation },
          lastAmortizationYear: year,
        },
      });

      results.push({
        assetId: asset.id,
        name: asset.fixedAssetsName,
        dotation,
      });
    }

    return {
      year,
      totalDotation: results.reduce((s, r) => s + r.dotation, 0),
      assets: results,
    };
  }

  /**
   * Cession d'immobilisation — traitement OHADA en deux mouvements :
   * 1. Sortie du bien : solde l'amortissement cumulé (281000), constate la
   *    valeur nette comptable en charge (671000), sort le bien à sa valeur
   *    brute (215000).
   * 2. Produit de cession, si `disposalAmount > 0` : créance (462000) en
   *    contrepartie d'un produit de cession (771000).
   * Le bien passe `DISPOSED` — devient intangible ensuite (voir le guard dans
   * `AssetsService.update`/`remove`).
   */
  async dispose(id: string, dto: DisposeFixedAssetDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission refusée pour céder une immobilisation.',
    );
    const ctx = resolveScopeContext(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);

    const asset = await this.prisma.fixedAsset.findUnique({ where: { id } });
    if (!asset)
      throw new NotFoundException(`Immobilisation "${id}" introuvable.`);
    assertSubsidiaryAccess(asset.subsidiaryId, ctx);
    if (asset.status === FixedAssetStatus.DISPOSED) {
      throw new BadRequestException('Cette immobilisation a déjà été cédée.');
    }

    const mappings = await this.mappingsService.getMap();
    const assetAccount = mappings['FIXED_ASSET'] || '215000';
    const amortAccount = mappings['AMORTIZATION_ACCOUNT'] || '281000';
    const nbvChargeAccount = mappings['DISPOSAL_NBV_CHARGE'] || '671000';
    const receivableAccount = mappings['DISPOSAL_RECEIVABLE'] || '462000';
    const proceedsAccount = mappings['DISPOSAL_PROCEEDS'] || '771000';

    const cumulativeAmortization = Number(asset.cumulativeAmortization);
    const netBookValue = Number(asset.acquisitionCost) - cumulativeAmortization;
    const disposalAmount = dto.disposalAmount;

    const lines = [
      {
        accountNumber: amortAccount,
        description: 'Solde amortissement cumulé',
        debitAmount: cumulativeAmortization,
        creditAmount: 0,
      },
      {
        accountNumber: nbvChargeAccount,
        description: 'Valeur nette comptable de la cession',
        debitAmount: netBookValue,
        creditAmount: 0,
      },
      {
        accountNumber: assetAccount,
        description: 'Sortie du bien (valeur brute)',
        debitAmount: 0,
        creditAmount: Number(asset.acquisitionCost),
      },
    ].filter((l) => l.debitAmount > 0 || l.creditAmount > 0);

    if (disposalAmount > 0) {
      lines.push(
        {
          accountNumber: receivableAccount,
          description: 'Créance sur cession',
          debitAmount: disposalAmount,
          creditAmount: 0,
        },
        {
          accountNumber: proceedsAccount,
          description: 'Produit de cession',
          debitAmount: 0,
          creditAmount: disposalAmount,
        },
      );
    }

    const disposalDate = new Date(dto.disposalDate);

    await this.entriesService.createAutomaticEntry({
      date: disposalDate,
      reference: `DISPOSAL-${asset.id}`,
      description: `Cession — ${asset.fixedAssetsName}`,
      journalCode: 'JOD',
      subsidiaryId: asset.subsidiaryId,
      sourceType: 'FIXED_ASSET_DISPOSAL',
      sourceId: asset.id,
      lines,
    });

    return this.prisma.fixedAsset.update({
      where: { id },
      data: {
        status: FixedAssetStatus.DISPOSED,
        disposalDate,
        disposalAmount,
      },
    });
  }

  async findAll(
    user: JwtUser,
    subsidiaryIdFilter?: string,
    paginationQuery: PaginationQueryDto = {},
  ) {
    const ctx = resolveScopeContext(user, ACCOUNTING_GLOBAL_SCOPE_ROLES);
    const effectiveSubsidiaryId = resolveEffectiveSubsidiaryId(
      ctx,
      subsidiaryIdFilter,
    );
    return paginate(
      this.prisma.fixedAsset,
      {
        where: effectiveSubsidiaryId
          ? { subsidiaryId: effectiveSubsidiaryId }
          : {},
        orderBy: { acquisitionDate: 'desc' },
      },
      paginationQuery,
    );
  }
}
