import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { AccountingAccountType, Prisma } from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

export interface CreateAccountDto {
  accountNumber: string;
  accountName: string;
  accountType: AccountingAccountType;
  parentAccountId?: string;
}

// Plan comptable SYSCOHADA révisé — comptes clés utilisés par la journalisation automatique
export const SYSCOHADA_SEED_ACCOUNTS = [
  // CLASSE 1 — CAPITAUX
  { num: '101', name: 'Capital social', type: 'EQUITY' },
  { num: '111', name: 'Réserve légale', type: 'EQUITY' },
  { num: '120', name: 'Résultat net de l\'exercice', type: 'EQUITY' },
  { num: '162', name: 'Emprunts auprès des établissements de crédit', type: 'LIABILITY' },
  { num: '163', name: 'Autres emprunts à long terme', type: 'LIABILITY' },
  // CLASSE 2 — IMMOBILISATIONS
  { num: '211', name: 'Terrains', type: 'ASSET' },
  { num: '215', name: 'Matériel et outillage', type: 'ASSET' },
  { num: '218', name: 'Autres immobilisations corporelles', type: 'ASSET' },
  { num: '221', name: 'Brevets, licences, logiciels', type: 'ASSET' },
  { num: '281', name: 'Amortissements des immobilisations', type: 'ASSET' },
  // CLASSE 3 — STOCKS
  { num: '31', name: 'Stocks de marchandises', type: 'ASSET' },
  { num: '32', name: 'Stocks de matières premières', type: 'ASSET' },
  // CLASSE 4 — TIERS
  { num: '401', name: 'Fournisseurs', type: 'LIABILITY' },
  { num: '408', name: 'Fournisseurs — Factures non parvenues', type: 'LIABILITY' },
  { num: '411', name: 'Clients', type: 'ASSET' },
  { num: '418', name: 'Clients — Produits à recevoir', type: 'ASSET' },
  { num: '421', name: 'Personnel — Rémunérations dues', type: 'LIABILITY' },
  { num: '431', name: 'Sécurité sociale — Cotisations', type: 'LIABILITY' },
  { num: '4431', name: 'TVA collectée (18%)', type: 'LIABILITY' },
  { num: '4451', name: 'TVA déductible sur achats', type: 'ASSET' },
  { num: '4452', name: 'TVA déductible sur services', type: 'ASSET' },
  { num: '447', name: 'Impôt sur les sociétés (IS)', type: 'LIABILITY' },
  { num: '471', name: 'Produits constatés d\'avance', type: 'LIABILITY' },
  { num: '481', name: 'Charges constatées d\'avance', type: 'ASSET' },
  // CLASSE 5 — TRÉSORERIE
  { num: '521', name: 'Banques comptes courants', type: 'ASSET' },
  { num: '522', name: 'Banques — Découverts', type: 'LIABILITY' },
  { num: '571', name: 'Caisse', type: 'ASSET' },
  { num: '581', name: 'Virements internes', type: 'ASSET' },
  // CLASSE 6 — CHARGES
  { num: '601', name: 'Achats de marchandises', type: 'EXPENSE' },
  { num: '602', name: 'Achats de matières premières', type: 'EXPENSE' },
  { num: '604', name: 'Achats d\'emballages', type: 'EXPENSE' },
  { num: '606', name: 'Achats de fournitures de bureau', type: 'EXPENSE' },
  { num: '613', name: 'Locations et charges locatives', type: 'EXPENSE' },
  { num: '614', name: 'Charges locatives et de copropriété', type: 'EXPENSE' },
  { num: '621', name: 'Personnel extérieur', type: 'EXPENSE' },
  { num: '624', name: 'Transport de marchandises et déplacements', type: 'EXPENSE' },
  { num: '625', name: 'Déplacements, missions et réceptions', type: 'EXPENSE' },
  { num: '627', name: 'Publicité, publication, relations publiques', type: 'EXPENSE' },
  { num: '628', name: 'Divers frais et charges', type: 'EXPENSE' },
  { num: '631', name: 'Impôts et taxes (hors IS)', type: 'EXPENSE' },
  { num: '641', name: 'Appointements et salaires', type: 'EXPENSE' },
  { num: '644', name: 'Primes et gratifications', type: 'EXPENSE' },
  { num: '645', name: 'Indemnités et avantages divers', type: 'EXPENSE' },
  { num: '646', name: 'Cotisations aux organismes sociaux', type: 'EXPENSE' },
  { num: '651', name: 'Pertes sur créances irrécouvrables', type: 'EXPENSE' },
  { num: '659', name: 'Charges diverses', type: 'EXPENSE' },
  { num: '661', name: 'Intérêts sur emprunts', type: 'EXPENSE' },
  { num: '671', name: 'Valeurs comptables des cessions d\'actif', type: 'EXPENSE' },
  { num: '681', name: 'Dotations aux amortissements', type: 'EXPENSE' },
  { num: '691', name: 'Impôt sur les bénéfices (IS — 30%)', type: 'EXPENSE' },
  // CLASSE 7 — PRODUITS
  { num: '701', name: 'Ventes de marchandises', type: 'REVENUE' },
  { num: '706', name: 'Prestations de services', type: 'REVENUE' },
  { num: '707', name: 'Produits des activités annexes', type: 'REVENUE' },
  { num: '721', name: 'Production immobilisée', type: 'REVENUE' },
  { num: '741', name: 'Subventions d\'exploitation', type: 'REVENUE' },
  { num: '754', name: 'Revenus des créances financières', type: 'REVENUE' },
  { num: '771', name: 'Produits de cession d\'actif', type: 'REVENUE' },
  { num: '781', name: 'Reprises sur provisions et dépréciations', type: 'REVENUE' },
];

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialise le plan comptable SYSCOHADA pour une filiale.
   * Idempotent : ignore les comptes déjà existants.
   */
  async seedSyscohada(subsidiaryId: string): Promise<void> {
    for (const acc of SYSCOHADA_SEED_ACCOUNTS) {
      await this.prisma.accountingAccount.upsert({
        where: { accountNumber: acc.num },
        create: {
          accountNumber: acc.num,
          accountName: acc.name,
          accountType: acc.type as AccountingAccountType,
          isActive: true,
          subsidiaryId,
        },
        update: {},
      });
    }
  }

  async create(dto: CreateAccountDto, user: JwtUser) {
    const exists = await this.prisma.accountingAccount.findFirst({
      where: { accountNumber: dto.accountNumber, subsidiaryId: user.subsidiaryId },
    });
    if (exists) throw new ConflictException(`Le compte ${dto.accountNumber} existe déjà.`);

    return this.prisma.accountingAccount.create({
      data: { ...dto, subsidiaryId: user.subsidiaryId },
    });
  }

  async findAll(user: JwtUser, type?: AccountingAccountType) {
    return this.prisma.accountingAccount.findMany({
      where: {
        subsidiaryId: user.subsidiaryId,
        isActive: true,
        ...(type ? { accountType: type } : {}),
      },
      orderBy: { accountNumber: 'asc' },
    });
  }

  async findOne(id: string, user: JwtUser) {
    const account = await this.prisma.accountingAccount.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    if (!account) throw new NotFoundException(`Compte ${id} introuvable.`);
    return account;
  }

  async findByNumber(accountNumber: string, subsidiaryId: string) {
    return this.prisma.accountingAccount.findFirst({
      where: { accountNumber, subsidiaryId, isActive: true },
    });
  }

  async update(id: string, dto: Partial<CreateAccountDto>, user: JwtUser) {
    await this.findOne(id, user);
    return this.prisma.accountingAccount.update({ where: { id }, data: dto });
  }

  async deactivate(id: string, user: JwtUser) {
    await this.findOne(id, user);
    return this.prisma.accountingAccount.update({ where: { id }, data: { isActive: false } });
  }
}
