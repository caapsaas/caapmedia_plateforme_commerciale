import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

// Table de correspondance clé fonctionnelle -> compte comptable, consultée par la
// génération automatique d'écritures pour rester reconfigurable sans déploiement.
// Référentiel global (pas par filiale).
// Parité de clés avec la référence gmo (mappings.service.ts côté gmo) : toutes
// les clés gmo sont présentes ici, même celles pas encore consommées par une
// logique de journalisation côté caapmedia (ex : PAYROLL_*, qui préparent le
// terrain pour une future journalisation RH → comptabilité).
const DEFAULT_MAPPINGS: Record<string, string> = {
  // --- VENTES ---
  SALES_CLIENT: '411000',
  SALES_CLIENT_DIVERSE: '411300',
  SALES_REVENUE: '706000',
  VENDOR_ACCOUNT: '411000',
  VENDOR_MARGIN_REVENUE: '707000',
  TVA_COLLECTEE: '443100',

  // --- ACHATS ---
  PURCHASE_SUPPLIER: '401000',
  PURCHASE_EXPENSE: '601000',
  PURCHASE_COST: '601000',
  TVA_DEDUCTIBLE_ACHAT: '445100',
  STOCK_VARIATION: '603000',

  // --- TRÉSORERIE ---
  CASH_ACCOUNT: '571000',
  SAFE_ACCOUNT: '571200',
  EXPENSE_BOX_ACCOUNT: '571100',
  BANK_ACCOUNT: '521000',
  OPENING_BALANCE: '110000',
  BANK_WITHDRAWAL: '581000',
  CASH_REFILL: '581000',

  // --- TAXES & FISCALITÉ ---
  TVA_RETENUE_ACHAT: '447500',
  BIC_COLLECTEE: '446000',

  // --- PAIE (préparation — pas encore consommé par une journalisation RH) ---
  PAYROLL_EXPENSE: '641000',
  PAYROLL_BONUS_EXPENSE: '644000',
  PAYROLL_CHARGES_EXPENSE: '646000',
  PAYROLL_TPA_EXPENSE: '641400',
  PAYROLL_NET_PAYABLE: '421000',
  PAYROLL_CNSS_LIABILITY: '431000',
  PAYROLL_IUTS_LIABILITY: '447100',
  PAYROLL_TPA_LIABILITY: '447300',
  PAYROLL_ROSALAIRE_LIABILITY: '447800',
  PAYROLL_ADVANCES: '425000',

  // --- DÉPENSES & PAIEMENTS ---
  SUPPLIER_PAYMENT: '401000',
  TAX_PAYMENT: '446000',
  TAXES_EXPENSE: '631000',
  HAO_EXPENSE: '658000',
  RENT_EXPENSE: '613000',
  UTILITIES_EXPENSE: '605200',
  MARKETING_EXPENSE: '627200',
  SUPPLIES_EXPENSE: '606000',
  NEED_EXPRESSION_EXPENSE: '659000',
  SALARIES_EXPENSE: '641000',
  TRANSPORT_EXPENSE: '624000',
  TRANSPORT_CLIENT_DELIVERY_EXPENSE: '612000',
  TRANSPORT_SUPPLIER_PICKUP_EXPENSE: '611000',
  OTHER_EXPENSE: '659000',

  // --- IMMOBILISATIONS ---
  FIXED_ASSET: '215000',
  AMORTIZATION_EXPENSE: '681000',
  AMORTIZATION_ACCOUNT: '281000',
  DISPOSAL_RECEIVABLE: '462000',
  DISPOSAL_PROCEEDS: '771000',
  DISPOSAL_NBV_CHARGE: '671000',

  // --- DETTES LONG TERME ---
  LONG_TERM_DEBT: '162000',
};

@Injectable()
export class MappingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.accountMapping.findMany({ orderBy: { key: 'asc' } });
  }

  /** Retourne le registre sous forme de map clé -> code de compte, prête à consulter. */
  async getMap(): Promise<Record<string, string>> {
    const rows = await this.findAll();
    return rows.reduce(
      (acc, row) => ({ ...acc, [row.key]: row.accountCode }),
      {} as Record<string, string>,
    );
  }

  /**
   * Un mapping pointant vers un compte inexistant ou inactif casse silencieusement
   * la journalisation automatique en aval (BadRequestException levée seulement au
   * moment où l'opération métier tente de journaliser — trop tard pour l'utilisateur
   * qui a modifié le mapping). On valide donc ici, au moment de l'écriture du mapping.
   */
  async update(key: string, accountCode: string) {
    const account = await this.prisma.accountingAccount.findUnique({
      where: { accountNumber: accountCode },
    });
    if (!account) {
      throw new BadRequestException(
        `Le compte "${accountCode}" n'existe pas dans le plan comptable.`,
      );
    }
    if (!account.isActive) {
      throw new BadRequestException(
        `Le compte "${accountCode}" est désactivé — activez-le avant de l'utiliser dans un mapping.`,
      );
    }

    return this.prisma.accountMapping.upsert({
      where: { key },
      update: { accountCode },
      create: { id: generateId(ID_PREFIXES.ACCOUNTMAPPING), key, accountCode },
    });
  }

  /**
   * Seed en masse : contrairement à `update()`, ignore silencieusement (avec un
   * avertissement) les clés dont le compte cible n'est pas encore seedé, plutôt
   * que d'interrompre l'import au premier compte manquant. Rejouable une fois le
   * plan comptable initialisé (idempotent, comme le reste du seed).
   */
  async seedDefaultMappings() {
    const codes = [...new Set(Object.values(DEFAULT_MAPPINGS))];
    const existing = await this.prisma.accountingAccount.findMany({
      where: { accountNumber: { in: codes } },
      select: { accountNumber: true },
    });
    const existingCodes = new Set(existing.map((a) => a.accountNumber));

    const skipped: string[] = [];
    for (const [key, accountCode] of Object.entries(DEFAULT_MAPPINGS)) {
      if (!existingCodes.has(accountCode)) {
        skipped.push(`${key} → ${accountCode}`);
        continue;
      }
      await this.prisma.accountMapping.upsert({
        where: { key },
        update: { accountCode },
        create: { id: generateId(ID_PREFIXES.ACCOUNTMAPPING), key, accountCode },
      });
    }
    if (skipped.length > 0) {
      console.warn(
        `[MappingsService] Mappings ignorés (compte introuvable — initialisez le plan comptable d'abord) : ${skipped.join(', ')}`,
      );
    }
    return { imported: Object.keys(DEFAULT_MAPPINGS).length - skipped.length, skipped: skipped.length };
  }
}
