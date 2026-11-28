import { Injectable } from '@nestjs/common';
import { AccountType, ExpenseCategory } from '@prisma/client';
import { EntriesService } from '../entries/entries.service';
import { PeriodsService } from '../periods/periods.service';
import { MappingsService } from '../accounts/mappings.service';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

export type OperationSource =
  | 'TREASURY_INCOME'
  | 'TREASURY_EXPENSE'
  | 'TREASURY_TRANSFER'
  | 'SALE_PAID'
  | 'EXPENSE_RECORD'
  | 'EXPENSE_RECORD_PAYMENT'
  | 'SUPPLIER_DEBT_PAYMENT'
  | 'SUPPLIER_CREDIT_NOTE'
  | 'CASH_REMITTANCE_WITH_DISCREPANCY'
  | 'PREFINANCEMENT_USAGE'
  | 'EXTERNAL_TRANSACTION'
  | 'TRANSACTION_REVERSAL'
  | 'LONG_TERM_DEBT_RECEIPT'
  | 'FIXED_ASSET_ACQUISITION'
  | 'PAYROLL_ACCRUAL'
  | 'PAYROLL_CHARGE_PAYMENT'
  | 'BONUS_PAYMENT';

export interface JournalizationContext {
  subsidiaryId: string;
  userId: string;
  operationDate: Date;
  amount: number;
  description: string;
  sourceType: OperationSource;
  sourceId: string;
  // Données spécifiques selon l'opération
  accountType?: AccountType; // pour trésorerie : BANQUE ou CASH_REGISTER (source, pour un virement)
  destinationAccountType?: AccountType; // virement inter-comptes (TREASURY_TRANSFER)
  expenseCategory?: ExpenseCategory; // pour dépenses : catégorie SYSCOHADA
  withTva?: boolean; // inclure TVA dans l'écriture
  feesAmount?: number; // frais bancaires / opérateur retenus sur encaissement différé
  declaredAmount?: number; // remise de caisse avec écart : montant déclaré caisse
  receivedAmount?: number; // remise de caisse avec écart : montant compté coffre
  externalType?: string; // INVESTMENT, INVESTMENT_RETURN, LOAN, DONATION
  reversedSourceType?: OperationSource; // pour contre-passation générique
  reversedSourceId?: string;
}

interface BuiltLine {
  accountNumber: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

// Types de compte trésorerie assimilés à de la "caisse" comptable (571000) —
// tout le reste (BANQUE, COMPTE_PREFINANCEMENT) est assimilé banque (521000).
const CASH_FAMILY_ACCOUNT_TYPES: AccountType[] = [
  AccountType.CASH_REGISTER,
  AccountType.SAFE,
  AccountType.EXPENSE_BOX,
];

// Mapping des catégories de dépenses → numéros de comptes SYSCOHADA
const EXPENSE_CATEGORY_ACCOUNT: Record<string, string> = {
  RENT: '613000',
  SALARIES: '641000',
  ADVERTISING: '627000',
  TRANSPORT: '624000',
  SERVICES: '628000',
  INSURANCE: '631000',
  PURCHASE_COST: '601000',
  COMMISSIONS: '628000',
  PACKAGING: '604000',
  TRANSACTION_FEES: '628000',
  OTHER: '659000',
};

/**
 * Point d'entrée pour la génération automatique d'écritures depuis les domaines
 * métier (trésorerie, ventes, achats, dettes, immobilisations). Construit les
 * lignes débit/crédit puis délègue TOUJOURS à `EntriesService.createAutomaticEntry`
 * — jamais d'écriture directe en base ici, pour garder un point d'entrée unique
 * (voir Doc/module-comptabilite-plan-implementation.md §2.2/§2.7).
 */
@Injectable()
export class JournalizationService {
  constructor(
    private readonly entriesService: EntriesService,
    private readonly periodsService: PeriodsService,
    private readonly mappingsService: MappingsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Point d'entrée unique. Construit et crée l'écriture comptable pour une
   * opération financière donnée. Propage toute erreur — l'appelant est
   * `AccountingOutboxProcessor` (retry borné + dead-letter après 5 tentatives,
   * voir Doc/module-comptabilite-plan-implementation.md §2.3), donc rien ne
   * doit être avalé silencieusement ici.
   */
  async journalize(ctx: JournalizationContext): Promise<void> {
    const { subsidiaryId, operationDate, description, sourceType, sourceId } =
      ctx;

    if (sourceType === 'TRANSACTION_REVERSAL') {
      const targetSourceId = ctx.reversedSourceId || sourceId;
      const originals = await this.prisma.journalEntry.findMany({
        where: {
          subsidiaryId,
          sourceId: targetSourceId,
          status: 'POSTED',
        },
        include: { lines: true },
      });
      if (originals.length > 0) {
        await this.prisma.$transaction(async (tx) => {
          for (const entry of originals) {
            await this.entriesService.reversePostedEntry(
              tx,
              entry,
              ctx.userId,
              true,
            );
          }
        });
      }
      return;
    }

    // S'assure qu'un exercice existe pour l'année courante (convenience —
    // n'empêche pas de travailler sur des exercices personnalisés créés à la
    // main ; EntriesService résout de toute façon la bonne période par date).
    await this.periodsService.getOrCreateCurrentFiscalYear(subsidiaryId);

    const mappings = await this.mappingsService.getMap();
    // Le taux de TVA appliqué aux écritures automatiques vient toujours du
    // taux par défaut configuré dans le module taxes — jamais d'une valeur
    // en dur ici, pour rester cohérent avec le taux réellement facturé
    // côté ventes/commandes.
    const tvaRate = this.requiresTvaRate(ctx)
      ? await this.getDefaultTvaRate()
      : 0;
    const { journalCode, lines } = this.buildLines(ctx, mappings, tvaRate);
    if (!lines || lines.length === 0) return;

    await this.entriesService.createAutomaticEntry({
      date: operationDate,
      reference: `${sourceType}-${sourceId}`,
      description,
      journalCode,
      subsidiaryId,
      sourceType,
      sourceId,
      lines,
    });
  }

  private requiresTvaRate(ctx: JournalizationContext): boolean {
    return (
      ctx.sourceType === 'SALE_PAID' ||
      ctx.sourceType === 'EXPENSE_RECORD' ||
      (ctx.sourceType === 'TREASURY_EXPENSE' && !!ctx.withTva)
    );
  }

  private async getDefaultTvaRate(): Promise<number> {
    const taxRate = await this.prisma.taxRate.findFirstOrThrow({
      where: { isDefault: true },
    });
    return Number(taxRate.rate);
  }

  private buildLines(
    ctx: JournalizationContext,
    mappings: Record<string, string>,
    tvaRate: number,
  ): { journalCode: string; lines: BuiltLine[] } {
    const {
      amount,
      sourceType,
      accountType,
      destinationAccountType,
      expenseCategory,
      withTva,
    } = ctx;

    const isCashFamily =
      !!accountType && CASH_FAMILY_ACCOUNT_TYPES.includes(accountType);
    const treasuryAccount =
      accountType === AccountType.EXPENSE_BOX
        ? mappings['EXPENSE_BOX_ACCOUNT'] || '571100'
        : isCashFamily
          ? mappings['CASH_ACCOUNT'] || '571000'
          : mappings['BANK_ACCOUNT'] || '521000';

    switch (sourceType) {
      // ── VIREMENT INTER-COMPTES TRÉSORERIE (décaissement typé) ────────
      // Écriture de bilan pure (aucune charge/produit) — ex. retrait
      // coffre→banque, alimentation coffre→caisse dépense.
      case 'TREASURY_TRANSFER': {
        const isDestCashFamily =
          !!destinationAccountType &&
          CASH_FAMILY_ACCOUNT_TYPES.includes(destinationAccountType);
        const destinationAccount = isDestCashFamily
          ? mappings['CASH_ACCOUNT'] || '571000'
          : mappings['BANK_ACCOUNT'] || '521000';
        return {
          journalCode: 'JOD',
          lines: [
            {
              accountNumber: destinationAccount,
              description: 'Virement interne — destination',
              debitAmount: amount,
              creditAmount: 0,
            },
            {
              accountNumber: treasuryAccount,
              description: 'Virement interne — source',
              debitAmount: 0,
              creditAmount: amount,
            },
          ],
        };
      }

      // ── RECETTE TRÉSORERIE (avec frais opérateur/banque optionnels) ────
      case 'TREASURY_INCOME': {
        const fees = Math.max(0, Number(ctx.feesAmount ?? 0));
        const gross = amount + fees;
        const lines: BuiltLine[] = [
          {
            accountNumber: treasuryAccount,
            description: fees > 0 ? 'Encaissement net reçu' : 'Encaissement',
            debitAmount: amount,
            creditAmount: 0,
          },
          {
            accountNumber: mappings['SALES_CLIENT'] || '411000',
            description: 'Client',
            debitAmount: 0,
            creditAmount: gross,
          },
        ];
        if (fees > 0) {
          lines.splice(1, 0, {
            accountNumber: mappings['BANK_FEES'] || '627000',
            description: 'Frais bancaires / commission opérateur',
            debitAmount: fees,
            creditAmount: 0,
          });
        }
        return {
          journalCode: isCashFamily ? 'JC' : 'JB',
          lines,
        };
      }

      // ── DÉPENSE TRÉSORERIE ──────────────────────────────────────────
      case 'TREASURY_EXPENSE': {
        const chargeNum =
          EXPENSE_CATEGORY_ACCOUNT[expenseCategory ?? 'OTHER'] ?? '659000';
        const amountHT = withTva ? amount / (1 + tvaRate) : amount;
        const tvaAmount = withTva ? amount - amountHT : 0;

        const lines: BuiltLine[] = [
          {
            accountNumber: chargeNum,
            description: 'Charge',
            debitAmount: amountHT,
            creditAmount: 0,
          },
          {
            accountNumber: treasuryAccount,
            description: 'Règlement',
            debitAmount: 0,
            creditAmount: amount,
          },
        ];
        if (withTva) {
          lines.splice(1, 0, {
            accountNumber: mappings['TVA_DEDUCTIBLE_ACHAT'] || '445100',
            description: `TVA déductible ${(tvaRate * 100).toFixed(2)}%`,
            debitAmount: tvaAmount,
            creditAmount: 0,
          });
        }
        return {
          journalCode: isCashFamily ? 'JC' : 'JB',
          lines,
        };
      }

      // ── VENTE CLIENT (PAYÉE) ────────────────────────────────────────
      case 'SALE_PAID': {
        const amountHT = amount / (1 + tvaRate);
        const tvaAmount = amount - amountHT;
        return {
          journalCode: 'JV',
          lines: [
            {
              accountNumber: mappings['SALES_CLIENT'] || '411000',
              description: 'Vente client',
              debitAmount: amount,
              creditAmount: 0,
            },
            {
              accountNumber: mappings['SALES_REVENUE'] || '706000',
              description: 'Produit HT',
              debitAmount: 0,
              creditAmount: amountHT,
            },
            {
              accountNumber: mappings['TVA_COLLECTEE'] || '443100',
              description: `TVA collectée ${(tvaRate * 100).toFixed(2)}%`,
              debitAmount: 0,
              creditAmount: tvaAmount,
            },
          ],
        };
      }

      // ── DÉPENSE OPÉRATIONNELLE (ExpenseRecord) ──────────────────────
      case 'EXPENSE_RECORD': {
        const chargeNum =
          EXPENSE_CATEGORY_ACCOUNT[expenseCategory ?? 'OTHER'] ?? '659000';
        const amountHT = amount / (1 + tvaRate);
        const tvaAmount = amount - amountHT;
        return {
          journalCode: 'JOD',
          lines: [
            {
              accountNumber: chargeNum,
              description: 'Charge enregistrée',
              debitAmount: amountHT,
              creditAmount: 0,
            },
            {
              accountNumber: mappings['TVA_DEDUCTIBLE_ACHAT'] || '445200',
              description: `TVA déductible ${(tvaRate * 100).toFixed(2)}%`,
              debitAmount: tvaAmount,
              creditAmount: 0,
            },
            {
              accountNumber: mappings['PURCHASE_SUPPLIER'] || '401000',
              description: 'Fournisseur ou caisse',
              debitAmount: 0,
              creditAmount: amount,
            },
          ],
        };
      }

      // ── PAIEMENT DETTE FOURNISSEUR ──────────────────────────────────
      case 'EXPENSE_RECORD_PAYMENT':
      case 'SUPPLIER_DEBT_PAYMENT': {
        const paysExpense = sourceType === 'EXPENSE_RECORD_PAYMENT';
        return {
          journalCode: paysExpense ? 'JC' : 'JA',
          lines: [
            {
              accountNumber: mappings['PURCHASE_SUPPLIER'] || '401000',
              description: paysExpense
                ? 'Apurement de la charge'
                : 'Apurement dette fournisseur',
              debitAmount: amount,
              creditAmount: 0,
            },
            {
              accountNumber: paysExpense
                ? mappings['SAFE_ACCOUNT'] || '571200'
                : treasuryAccount,
              description: 'Règlement',
              debitAmount: 0,
              creditAmount: amount,
            },
          ],
        };
      }

      // ── RÉCEPTION EMPRUNT LONG TERME ────────────────────────────────
      case 'LONG_TERM_DEBT_RECEIPT': {
        return {
          journalCode: 'JB',
          lines: [
            {
              accountNumber: mappings['BANK_ACCOUNT'] || '521000',
              description: 'Réception emprunt',
              debitAmount: amount,
              creditAmount: 0,
            },
            {
              accountNumber: mappings['LONG_TERM_DEBT'] || '162000',
              description: 'Emprunt LT',
              debitAmount: 0,
              creditAmount: amount,
            },
          ],
        };
      }

      // ── ACQUISITION IMMOBILISATION ──────────────────────────────────
      case 'FIXED_ASSET_ACQUISITION': {
        return {
          journalCode: 'JOD',
          lines: [
            {
              accountNumber: mappings['FIXED_ASSET'] || '215000',
              description: 'Acquisition immobilisation',
              debitAmount: amount,
              creditAmount: 0,
            },
            {
              accountNumber: mappings['BANK_ACCOUNT'] || '521000',
              description: 'Règlement',
              debitAmount: 0,
              creditAmount: amount,
            },
          ],
        };
      }

      // ── REMISE DE CAISSE AVEC ÉCART RÉEL (Lot 2) ──────────────────────
      case 'CASH_REMITTANCE_WITH_DISCREPANCY': {
        const declared = Number(ctx.declaredAmount ?? amount);
        const received = Number(ctx.receivedAmount ?? amount);
        const diff = received - declared;
        const cashRegisterAcc = mappings['CASH_ACCOUNT'] || '571000';
        const safeAcc = mappings['SAFE_ACCOUNT'] || '571200';
        const lines: BuiltLine[] = [
          {
            accountNumber: safeAcc,
            description: 'Remise de caisse — montant compté au coffre',
            debitAmount: received,
            creditAmount: 0,
          },
          {
            accountNumber: cashRegisterAcc,
            description: 'Remise de caisse — solde déclaré caisse',
            debitAmount: 0,
            creditAmount: declared,
          },
        ];
        if (diff < 0) {
          lines.splice(1, 0, {
            accountNumber: mappings['CASH_DISCREPANCY_LOSS'] || '471000',
            description: 'Manquant de caisse à régulariser',
            debitAmount: Math.abs(diff),
            creditAmount: 0,
          });
        } else if (diff > 0) {
          lines.push({
            accountNumber: mappings['CASH_DISCREPANCY_GAIN'] || '758000',
            description: 'Excédent de caisse constaté',
            debitAmount: 0,
            creditAmount: diff,
          });
        }
        return { journalCode: 'JOD', lines };
      }

      // ── AVOIR FOURNISSEUR (Lot 2) ─────────────────────────────────────
      case 'SUPPLIER_CREDIT_NOTE': {
        return {
          journalCode: 'JA',
          lines: [
            {
              accountNumber: mappings['PURCHASE_SUPPLIER'] || '401000',
              description: 'Avoir fournisseur obtenu',
              debitAmount: amount,
              creditAmount: 0,
            },
            {
              accountNumber: mappings['PURCHASE_COST'] || '601000',
              description: 'Rabais / avoir sur achats',
              debitAmount: 0,
              creditAmount: amount,
            },
          ],
        };
      }

      // ── UTILISATION PRÉFINANCEMENT SUR COMMANDE (Lot 2) ───────────────
      case 'PREFINANCEMENT_USAGE': {
        const chargeNum =
          EXPENSE_CATEGORY_ACCOUNT[expenseCategory ?? 'PURCHASE_COST'] ??
          '601000';
        return {
          journalCode: 'JOD',
          lines: [
            {
              accountNumber: chargeNum,
              description: 'Emploi fonds de préfinancement',
              debitAmount: amount,
              creditAmount: 0,
            },
            {
              accountNumber: mappings['PREFINANCEMENT_ACCOUNT'] || '521100',
              description: 'Compte de préfinancement',
              debitAmount: 0,
              creditAmount: amount,
            },
          ],
        };
      }

      // ── OPÉRATION EXTERNE (Apport PDG / Prêt / Retour) (Lot 2) ────────
      case 'EXTERNAL_TRANSACTION': {
        const extType = ctx.externalType || 'INVESTMENT';
        const isInflow =
          extType === 'INVESTMENT' ||
          extType === 'LOAN' ||
          extType === 'DONATION';
        const counterpartAccount =
          extType === 'LOAN'
            ? mappings['LONG_TERM_DEBT'] || '162000'
            : extType === 'DONATION'
              ? mappings['OTHER_INCOME'] || '758000'
              : mappings['OWNER_EQUITY_CURRENT'] || '455000';
        return {
          journalCode: isCashFamily ? 'JC' : 'JB',
          lines: isInflow
            ? [
                {
                  accountNumber: treasuryAccount,
                  description: 'Entrée de fonds externe',
                  debitAmount: amount,
                  creditAmount: 0,
                },
                {
                  accountNumber: counterpartAccount,
                  description: 'Compte courant associé / prêteur',
                  debitAmount: 0,
                  creditAmount: amount,
                },
              ]
            : [
                {
                  accountNumber: counterpartAccount,
                  description: 'Remboursement apport / prêt',
                  debitAmount: amount,
                  creditAmount: 0,
                },
                {
                  accountNumber: treasuryAccount,
                  description: 'Sortie de trésorerie',
                  debitAmount: 0,
                  creditAmount: amount,
                },
              ],
        };
      }

      default:
        return { journalCode: 'JOD', lines: [] };
    }
  }
}
