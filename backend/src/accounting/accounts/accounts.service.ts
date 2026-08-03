import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { AccountingAccountType, Prisma } from '@prisma/client';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate, PaginatedResult } from 'src/common/pagination/pagination';
import type { AccountingAccount } from '@prisma/client';
export interface CreateAccountDto {
  accountNumber: string;
  accountName: string;
  accountType: AccountingAccountType;
  class?: number;
  parentAccountId?: string;
}

// Plan comptable SYSCOHADA révisé — codes à 6 chiffres (parité de nomenclature
// avec la référence gmo), comptes clés utilisés par la journalisation automatique.
// Référentiel GLOBAL (pas par filiale) : une seule entité légale à succursales.
// NB : les rapports (reports.service.ts, balancesheet.service.ts) agrègent par
// PRÉFIXE de compte (startsWith) — chaque code ci-dessous conserve le même
// préfixe que son ancien équivalent court pour ne rien casser (ex : 101 → 101000,
// 4431 → 443100, 601 → 601000). Ne pas changer un préfixe sans vérifier
// getAccountBalanceByPrefix() dans accounting-balance.service.ts et ses appelants.
export const SYSCOHADA_SEED_ACCOUNTS = [
  // CLASSE 1 — CAPITAUX
  { num: '101000', name: 'Capital social', type: 'EQUITY', class: 1 },
  { num: '110000', name: 'Report à nouveau', type: 'EQUITY', class: 1 },
  { num: '111000', name: 'Réserve légale', type: 'EQUITY', class: 1 },
  {
    num: '120000',
    name: "Résultat net de l'exercice",
    type: 'EQUITY',
    class: 1,
  },
  {
    num: '162000',
    name: 'Emprunts auprès des établissements de crédit',
    type: 'LIABILITY',
    class: 1,
  },
  {
    num: '163000',
    name: 'Autres emprunts à long terme',
    type: 'LIABILITY',
    class: 1,
  },
  // CLASSE 2 — IMMOBILISATIONS
  { num: '211000', name: 'Terrains', type: 'ASSET', class: 2 },
  { num: '215000', name: 'Matériel et outillage', type: 'ASSET', class: 2 },
  {
    num: '218000',
    name: 'Autres immobilisations corporelles',
    type: 'ASSET',
    class: 2,
  },
  {
    num: '221000',
    name: 'Brevets, licences, logiciels',
    type: 'ASSET',
    class: 2,
  },
  {
    num: '281000',
    name: 'Amortissements des immobilisations',
    type: 'ASSET',
    class: 2,
  },
  // CLASSE 3 — STOCKS
  { num: '310000', name: 'Stocks de marchandises', type: 'ASSET', class: 3 },
  {
    num: '320000',
    name: 'Stocks de matières premières',
    type: 'ASSET',
    class: 3,
  },
  // CLASSE 4 — TIERS
  { num: '401000', name: 'Fournisseurs', type: 'LIABILITY', class: 4 },
  {
    num: '408000',
    name: 'Fournisseurs — Factures non parvenues',
    type: 'LIABILITY',
    class: 4,
  },
  { num: '411000', name: 'Clients', type: 'ASSET', class: 4 },
  { num: '411300', name: 'Clients divers', type: 'ASSET', class: 4 },
  {
    num: '418000',
    name: 'Clients — Produits à recevoir',
    type: 'ASSET',
    class: 4,
  },
  {
    num: '421000',
    name: 'Personnel — Rémunérations dues',
    type: 'LIABILITY',
    class: 4,
  },
  {
    num: '425000',
    name: 'Personnel — Avances et acomptes',
    type: 'ASSET',
    class: 4,
  },
  {
    num: '431000',
    name: 'Sécurité sociale — Cotisations (CNSS)',
    type: 'LIABILITY',
    class: 4,
  },
  {
    num: '462000',
    name: "Créances sur cessions d'immobilisations",
    type: 'ASSET',
    class: 4,
  },
  { num: '443100', name: 'TVA collectée (18%)', type: 'LIABILITY', class: 4 },
  { num: '445100', name: 'TVA déductible sur achats', type: 'ASSET', class: 4 },
  {
    num: '445200',
    name: 'TVA déductible sur services',
    type: 'ASSET',
    class: 4,
  },
  {
    num: '446000',
    name: "État — Autres impôts sur chiffre d'affaires (BIC)",
    type: 'LIABILITY',
    class: 4,
  },
  {
    num: '447000',
    name: 'Impôt sur les sociétés (IS)',
    type: 'LIABILITY',
    class: 4,
  },
  {
    num: '447100',
    name: 'État — IUTS (impôt sur salaires) à verser',
    type: 'LIABILITY',
    class: 4,
  },
  {
    num: '447300',
    name: 'État — TPA à verser',
    type: 'LIABILITY',
    class: 4,
  },
  {
    num: '447500',
    name: 'État — TVA retenue à la source',
    type: 'LIABILITY',
    class: 4,
  },
  {
    num: '447800',
    name: 'État — Autres retenues sur salaires à verser',
    type: 'LIABILITY',
    class: 4,
  },
  {
    num: '471000',
    name: "Produits constatés d'avance",
    type: 'LIABILITY',
    class: 4,
  },
  {
    num: '481000',
    name: "Charges constatées d'avance",
    type: 'ASSET',
    class: 4,
  },
  // CLASSE 5 — TRÉSORERIE
  { num: '521000', name: 'Banques comptes courants', type: 'ASSET', class: 5 },
  { num: '522000', name: 'Banques — Découverts', type: 'LIABILITY', class: 5 },
  { num: '571000', name: 'Caisse', type: 'ASSET', class: 5 },
  { num: '571100', name: 'Caisse — boîte de dépense', type: 'ASSET', class: 5 },
  { num: '571200', name: 'Caisse — coffre-fort', type: 'ASSET', class: 5 },
  { num: '581000', name: 'Virements internes', type: 'ASSET', class: 5 },
  // CLASSE 6 — CHARGES
  { num: '601000', name: 'Achats de marchandises', type: 'EXPENSE', class: 6 },
  {
    num: '602000',
    name: 'Achats de matières premières',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '603000',
    name: 'Variation de stocks de marchandises',
    type: 'EXPENSE',
    class: 6,
  },
  { num: '604000', name: "Achats d'emballages", type: 'EXPENSE', class: 6 },
  {
    num: '605200',
    name: 'Eau, électricité et factures diverses',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '606000',
    name: 'Achats de fournitures de bureau',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '611000',
    name: 'Transport — collecte fournisseur',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '612000',
    name: 'Transport — livraison client',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '613000',
    name: 'Locations et charges locatives',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '614000',
    name: 'Charges locatives et de copropriété',
    type: 'EXPENSE',
    class: 6,
  },
  { num: '621000', name: 'Personnel extérieur', type: 'EXPENSE', class: 6 },
  {
    num: '624000',
    name: 'Transport de marchandises et déplacements',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '625000',
    name: 'Déplacements, missions et réceptions',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '627000',
    name: 'Publicité, publication, relations publiques',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '627200',
    name: 'Frais de marketing',
    type: 'EXPENSE',
    class: 6,
  },
  { num: '628000', name: 'Divers frais et charges', type: 'EXPENSE', class: 6 },
  {
    num: '631000',
    name: 'Impôts et taxes (hors IS)',
    type: 'EXPENSE',
    class: 6,
  },
  { num: '638000', name: 'Expressions de besoin', type: 'EXPENSE', class: 6 },
  {
    num: '641000',
    name: 'Appointements et salaires',
    type: 'EXPENSE',
    class: 6,
  },
  { num: '641400', name: 'TPA (taxe sur salaires)', type: 'EXPENSE', class: 6 },
  {
    num: '644000',
    name: 'Primes et gratifications',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '645000',
    name: 'Indemnités et avantages divers',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '646000',
    name: 'Cotisations aux organismes sociaux',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '651000',
    name: 'Pertes sur créances irrécouvrables',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '658000',
    name: 'Charges HAO (hors activité ordinaire)',
    type: 'EXPENSE',
    class: 6,
  },
  { num: '659000', name: 'Charges diverses', type: 'EXPENSE', class: 6 },
  { num: '661000', name: 'Intérêts sur emprunts', type: 'EXPENSE', class: 6 },
  {
    num: '671000',
    name: "Valeurs comptables des cessions d'actif",
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '681000',
    name: 'Dotations aux amortissements',
    type: 'EXPENSE',
    class: 6,
  },
  {
    num: '691000',
    name: 'Impôt sur les bénéfices (IS — 30%)',
    type: 'EXPENSE',
    class: 6,
  },
  // CLASSE 7 — PRODUITS
  { num: '701000', name: 'Ventes de marchandises', type: 'REVENUE', class: 7 },
  { num: '706000', name: 'Prestations de services', type: 'REVENUE', class: 7 },
  {
    num: '707000',
    name: 'Produits des activités annexes',
    type: 'REVENUE',
    class: 7,
  },
  { num: '721000', name: 'Production immobilisée', type: 'REVENUE', class: 7 },
  {
    num: '741000',
    name: "Subventions d'exploitation",
    type: 'REVENUE',
    class: 7,
  },
  {
    num: '754000',
    name: 'Revenus des créances financières',
    type: 'REVENUE',
    class: 7,
  },
  {
    num: '771000',
    name: "Produits de cession d'actif",
    type: 'REVENUE',
    class: 7,
  },
  {
    num: '781000',
    name: 'Reprises sur provisions et dépréciations',
    type: 'REVENUE',
    class: 7,
  },
];

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialise le plan comptable SYSCOHADA (référentiel global, partagé par
   * toutes les filiales). Idempotent : upsert par numéro de compte.
   */
  async seedSyscohada(): Promise<void> {
    for (const acc of SYSCOHADA_SEED_ACCOUNTS) {
      await this.prisma.accountingAccount.upsert({
        where: { accountNumber: acc.num },
        create: {
          id: generateId(ID_PREFIXES.ACCOUNTINGACCOUNT),
          accountNumber: acc.num,
          accountName: acc.name,
          accountType: acc.type as AccountingAccountType,
          class: acc.class,
          isActive: true,
        },
        update: {
          accountName: acc.name,
          accountType: acc.type as AccountingAccountType,
          class: acc.class,
        },
      });
    }
  }

  async create(dto: CreateAccountDto) {
    const exists = await this.prisma.accountingAccount.findUnique({
      where: { accountNumber: dto.accountNumber },
    });
    if (exists)
      throw new ConflictException(
        `Le compte ${dto.accountNumber} existe déjà.`,
      );

    return this.prisma.accountingAccount.create({
      data: { id: generateId(ID_PREFIXES.ACCOUNTINGACCOUNT), ...dto },
    });
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
    type?: AccountingAccountType,
    includeInactive = false,
  ): Promise<PaginatedResult<AccountingAccount>> {
    const where: Prisma.AccountingAccountWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(type ? { accountType: type } : {}),
    };

    if (paginationQuery.search) {
      where.OR = [
        {
          accountNumber: {
            contains: paginationQuery.search,
            mode: 'insensitive',
          },
        },
        {
          accountName: {
            contains: paginationQuery.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return paginate<AccountingAccount>(
      this.prisma.accountingAccount,
      { where, orderBy: { accountNumber: 'asc' } },
      paginationQuery,
    );
  }

  async findOne(id: string) {
    const account = await this.prisma.accountingAccount.findUnique({
      where: { id },
    });
    if (!account) throw new NotFoundException(`Compte ${id} introuvable.`);
    return account;
  }

  async findByNumber(accountNumber: string) {
    return this.prisma.accountingAccount.findFirst({
      where: { accountNumber, isActive: true },
    });
  }

  async update(id: string, dto: Partial<CreateAccountDto>) {
    await this.findOne(id);
    return this.prisma.accountingAccount.update({ where: { id }, data: dto });
  }

  /** Désactive un compte — refuse s'il est déjà utilisé dans des écritures. */
  async deactivate(id: string) {
    const account = await this.prisma.accountingAccount.findUnique({
      where: { id },
      include: { journalLines: { take: 1 } },
    });
    if (!account) throw new NotFoundException(`Compte ${id} introuvable.`);
    if (account.journalLines.length > 0) {
      throw new BadRequestException(
        'Ce compte est utilisé dans des écritures comptables et ne peut pas être désactivé.',
      );
    }

    return this.prisma.accountingAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
