import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JournalEntryStatus, AccountType, ExpenseCategory, Prisma } from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { JournalsService } from '../journals/journals.service';
import { PeriodsService } from '../periods/periods.service';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
// TVA UEMOA standard (18%) et IS (30%)
export const TVA_RATE = 0.18;
export const IS_RATE = 0.30;

export type OperationSource =
  | 'TREASURY_INCOME'
  | 'TREASURY_EXPENSE'
  | 'SALE_PAID'
  | 'EXPENSE_RECORD'
  | 'SUPPLIER_DEBT_PAYMENT'
  | 'LONG_TERM_DEBT_RECEIPT'
  | 'FIXED_ASSET_ACQUISITION';

export interface JournalizationContext {
  subsidiaryId: string;
  userId: string;
  operationDate: Date;
  amount: number;
  description: string;
  sourceType: OperationSource;
  sourceId: string;
  // Données spécifiques selon l'opération
  accountType?: AccountType;         // pour trésorerie : BANQUE ou CAISSE
  expenseCategory?: ExpenseCategory; // pour dépenses : catégorie SYSCOHADA
  withTva?: boolean;                 // inclure TVA dans l'écriture
}

// Mapping des catégories de dépenses → numéros de comptes SYSCOHADA
const EXPENSE_CATEGORY_ACCOUNT: Record<string, string> = {
  RENT: '613',
  SALARIES: '641',
  ADVERTISING: '627',
  TRANSPORT: '624',
  SERVICES: '628',
  INSURANCE: '631',
  PURCHASE_COST: '601',
  COMMISSIONS: '628',
  PACKAGING: '604',
  TRANSACTION_FEES: '628',
  OTHER: '659',
};

@Injectable()
export class JournalizationService {
  private readonly logger = new Logger(JournalizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly journalsService: JournalsService,
    private readonly periodsService: PeriodsService,
  ) {}

  /**
   * Point d'entrée unique. Crée une écriture comptable DRAFT en partie double
   * pour n'importe quelle opération financière.
   * Silencieux en cas d'erreur pour ne pas bloquer l'opération source.
   */
  async journalize(ctx: JournalizationContext): Promise<void> {
    try {
      await this.doJournalize(ctx);
    } catch (err) {
      this.logger.error(
        `Journalisation échouée pour ${ctx.sourceType}/${ctx.sourceId}: ${err.message}`,
        err.stack,
      );
    }
  }

  private async doJournalize(ctx: JournalizationContext): Promise<void> {
    const { subsidiaryId, userId, operationDate, amount, description, sourceType, sourceId } = ctx;

    // 1. Récupérer (ou créer) l'exercice fiscal courant
    const fiscalYear = await this.periodsService.getOrCreateCurrentFiscalYear(subsidiaryId, userId);

    // 2. Construire les lignes débit/crédit selon le type d'opération
    const { journalCode, lines } = await this.buildLines(ctx);

    if (!lines || lines.length === 0) return;

    // 3. Récupérer le journal concerné
    const journal = await this.journalsService.findByCode(journalCode, subsidiaryId);

    // 4. Numéro d'écriture séquentiel
    const entryNumber = await this.generateEntryNumber(subsidiaryId, journalCode);

    const totalDebit = lines.reduce((s, l) => s + l.debitAmount, 0);

    await this.prisma.journalEntry.create({
      data: {
        id: generateId(ID_PREFIXES.JOURNALENTRY),
        entryNumber,
        entryDate: operationDate,
        description,
        status: JournalEntryStatus.DRAFT,
        totalAmount: new Prisma.Decimal(totalDebit),
        fiscalYearId: fiscalYear.id,
        subsidiaryId,
        createdBy: userId,
        journalId: journal.id,
        sourceType,
        sourceId,
        lines: {
          create: lines.map((l) => ({
            id: generateId(ID_PREFIXES.JOURNALENTRYLINE),
            accountId: l.accountId,
            description: l.description,
            debitAmount: new Prisma.Decimal(l.debitAmount),
            creditAmount: new Prisma.Decimal(l.creditAmount),
            balance: new Prisma.Decimal(l.debitAmount - l.creditAmount),
          })),
        },
      },
    });
  }

  private async buildLines(ctx: JournalizationContext) {
    const { subsidiaryId, amount, sourceType, accountType, expenseCategory, withTva } = ctx;

    const acc = (num: string) => this.getAccountId(num, subsidiaryId);
    const treasuryAccount = accountType === AccountType.CAISSE ? '571' : '521';

    switch (sourceType) {
      // ── RECETTE TRÉSORERIE ──────────────────────────────────────────
      case 'TREASURY_INCOME': {
        const [debitId, creditId] = await Promise.all([acc(treasuryAccount), acc('411')]);
        return {
          journalCode: 'JB',
          lines: [
            { accountId: debitId,  description: 'Encaissement', debitAmount: amount, creditAmount: 0 },
            { accountId: creditId, description: 'Client',        debitAmount: 0, creditAmount: amount },
          ],
        };
      }

      // ── DÉPENSE TRÉSORERIE ──────────────────────────────────────────
      case 'TREASURY_EXPENSE': {
        const chargeNum = EXPENSE_CATEGORY_ACCOUNT[expenseCategory ?? 'OTHER'] ?? '659';
        const amountHT = withTva ? amount / (1 + TVA_RATE) : amount;
        const tvaAmount = withTva ? amount - amountHT : 0;

        const linePromises = [acc(chargeNum), acc(treasuryAccount)];
        if (withTva) linePromises.push(acc('4451'));
        const [chargeId, treasuryId, tvaId] = await Promise.all(linePromises);

        const lines: any[] = [
          { accountId: chargeId,   description: 'Charge',    debitAmount: amountHT,  creditAmount: 0 },
          { accountId: treasuryId, description: 'Règlement', debitAmount: 0,         creditAmount: amount },
        ];
        if (withTva && tvaId) {
          lines.splice(1, 0, { accountId: tvaId, description: 'TVA déductible 18%', debitAmount: tvaAmount, creditAmount: 0 });
        }
        return { journalCode: 'JB', lines };
      }

      // ── VENTE CLIENT (PAYÉE) ────────────────────────────────────────
      case 'SALE_PAID': {
        const amountHT = amount / (1 + TVA_RATE);
        const tvaAmount = amount - amountHT;
        const [clientId, venteId, tvaId] = await Promise.all([acc('411'), acc('706'), acc('4431')]);
        return {
          journalCode: 'JV',
          lines: [
            { accountId: clientId, description: 'Vente client',    debitAmount: amount,    creditAmount: 0 },
            { accountId: venteId,  description: 'Produit HT',      debitAmount: 0,         creditAmount: amountHT },
            { accountId: tvaId,    description: 'TVA collectée 18%', debitAmount: 0,       creditAmount: tvaAmount },
          ],
        };
      }

      // ── DÉPENSE OPÉRATIONNELLE (ExpenseRecord) ──────────────────────
      case 'EXPENSE_RECORD': {
        const chargeNum = EXPENSE_CATEGORY_ACCOUNT[expenseCategory ?? 'OTHER'] ?? '659';
        const amountHT = amount / (1 + TVA_RATE);
        const tvaAmount = amount - amountHT;
        const [chargeId, fournId, tvaId] = await Promise.all([acc(chargeNum), acc('401'), acc('4452')]);
        return {
          journalCode: 'JOD',
          lines: [
            { accountId: chargeId, description: 'Charge enregistrée',    debitAmount: amountHT,  creditAmount: 0 },
            { accountId: tvaId,    description: 'TVA déductible 18%',    debitAmount: tvaAmount, creditAmount: 0 },
            { accountId: fournId,  description: 'Fournisseur ou caisse', debitAmount: 0,         creditAmount: amount },
          ],
        };
      }

      // ── PAIEMENT DETTE FOURNISSEUR ──────────────────────────────────
      case 'SUPPLIER_DEBT_PAYMENT': {
        const [fournId, treasuryId] = await Promise.all([acc('401'), acc(treasuryAccount)]);
        return {
          journalCode: 'JA',
          lines: [
            { accountId: fournId,    description: 'Apurement dette fournisseur', debitAmount: amount, creditAmount: 0 },
            { accountId: treasuryId, description: 'Règlement',                   debitAmount: 0,      creditAmount: amount },
          ],
        };
      }

      // ── RÉCEPTION EMPRUNT LONG TERME ────────────────────────────────
      case 'LONG_TERM_DEBT_RECEIPT': {
        const [bankId, empruntId] = await Promise.all([acc('521'), acc('162')]);
        return {
          journalCode: 'JB',
          lines: [
            { accountId: bankId,    description: 'Réception emprunt', debitAmount: amount, creditAmount: 0 },
            { accountId: empruntId, description: 'Emprunt LT',        debitAmount: 0,      creditAmount: amount },
          ],
        };
      }

      // ── ACQUISITION IMMOBILISATION ──────────────────────────────────
      case 'FIXED_ASSET_ACQUISITION': {
        const [immoId, bankId] = await Promise.all([acc('215'), acc('521')]);
        return {
          journalCode: 'JOD',
          lines: [
            { accountId: immoId, description: 'Acquisition immobilisation', debitAmount: amount, creditAmount: 0 },
            { accountId: bankId, description: 'Règlement',                  debitAmount: 0,      creditAmount: amount },
          ],
        };
      }

      default:
        return { journalCode: 'JOD', lines: [] };
    }
  }

  private async getAccountId(accountNumber: string, subsidiaryId: string): Promise<string> {
    const account = await this.accountsService.findByNumber(accountNumber, subsidiaryId);
    if (!account) {
      throw new Error(
        `Compte SYSCOHADA "${accountNumber}" introuvable pour la filiale ${subsidiaryId}. ` +
        `Lancez le seed du plan comptable via POST /accounting/accounts/seed.`,
      );
    }
    return account.id;
  }

  private async generateEntryNumber(subsidiaryId: string, journalCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.journalEntry.count({
      where: { subsidiaryId, sourceType: { not: null } },
    });
    return `${journalCode}-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}
