import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { BalanceSheetDto } from './dto/balance-sheet.dto';

@Injectable()
export class BalancesheetService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule le bilan comptable pour une filiale donnée
   * @param subsidiaryId - ID de la filiale (optionnel, si null retourne le bilan consolidé)
   * @returns Bilan comptable calculé
   */
  async getBalanceSheet(subsidiaryId?: string): Promise<BalanceSheetDto> {
    // Récupération des données de la trésorerie
    const treasuryData = await this.getTreasuryData(subsidiaryId);
    
    // Récupération des créances clients
    const customerReceivables = await this.getCustomerReceivables(subsidiaryId);
    
    // Récupération de la valeur des stocks
    const inventory = await this.getInventoryValue(subsidiaryId);
    
    // Récupération de la valeur des équipements
    const equipments = await this.getEquipmentsValue(subsidiaryId);
    
    // Récupération de la valeur des immobilisations
    const fixedAssets = await this.getFixedAssetsValue(subsidiaryId);
    
    // Calcul du total des actifs
    const totalAssets = treasuryData + customerReceivables + inventory + equipments + fixedAssets;
    
    // Récupération des dettes fournisseurs
    const supplierDebts = await this.getSupplierDebts(subsidiaryId);
    
    // Récupération du capital social
    const shareCapital = await this.getShareCapital(subsidiaryId);
    
    // Récupération du résultat net (cumulé des exercices antérieurs)
    const netIncome = await this.getAccumulatedNetIncome(subsidiaryId);
    
    // Calcul du total des passifs
    const totalLiabilities = supplierDebts + shareCapital + netIncome;
    
    return {
      assets: {
        treasury: treasuryData,
        customerReceivables,
        inventory,
        equipments,
        fixedAssets,
      },
      totalAssets,
      liabilities: {
        supplierDebts,
        shareCapital,
        netIncome,
      },
      totalLiabilities,
    };
  }

  /**
   * Récupère le solde total des comptes de trésorerie
   */
  async getTreasuryData(subsidiaryId?: string): Promise<number> {
    const where = subsidiaryId ? { subsidiaryId } : {};
    
    const treasuryAccounts = await this.prisma.treasuryAccount.findMany({
      where,
      select: { balance: true },
    });
    
    return treasuryAccounts.reduce((total, account) => total + Number(account.balance), 0);
  }

  /**
   * Calcule le montant total des créances clients
   * Inclut les comptes de crédit existants ET les ventes en attente de paiement
   */
  async getCustomerReceivables(subsidiaryId?: string): Promise<number> {
    const where = subsidiaryId ? { subsidiaryId } : {};
    
    // 1. Récupération des comptes de crédit existants
    const creditAccounts = await this.prisma.creditAccount.findMany({
      where,
      select: { balance: true },
    });
    
    const creditAccountTotal = creditAccounts.reduce((total, account) => total + Number(account.balance), 0);
    
    // 2. Récupération des ventes en attente de paiement (non payées)
    const pendingSales = await this.prisma.sale.findMany({
      where: {
        ...where,
        status: 'PENDING', // Ventes non encore payées
      },
      select: { totalPrice: true },
    });
    
    const pendingSalesTotal = pendingSales.reduce((total, sale) => total + Number(sale.totalPrice), 0);
    
    // 3. Total des créances clients = comptes de crédit + ventes en attente
    return creditAccountTotal + pendingSalesTotal;
  }

  /**
   * Calcule la valeur totale des stocks (produits)
   */
  async getInventoryValue(subsidiaryId?: string): Promise<number> {
    const where = subsidiaryId ? { subsidiaryId } : {};
    
    const products = await this.prisma.product.findMany({
      where,
      select: { 
        price: true,
        stock: true,
      },
    });
    
    return products.reduce((total, product) => {
      const purchasePrice = Number(product.price) || 0;
      const stockQuantity = Number(product.stock) || 0;
      return total + (purchasePrice * stockQuantity);
    }, 0);
  }

  /**
   * Calcule la valeur totale des équipements
   */
  async getEquipmentsValue(subsidiaryId?: string): Promise<number> {
    const where = subsidiaryId ? { subsidiaryId } : {};
    
    const equipments = await this.prisma.equipment.findMany({
      where,
      select: { 
        acquisitionValue: true,
      },
    });
    
    return equipments.reduce((total, equipment) => {
      // Utiliser la valeur d'acquisition
      const value = Number(equipment.acquisitionValue) || 0;
      return total + value;
    }, 0);
  }

  /**
   * Calcule la valeur totale des immobilisations
   */
  async getFixedAssetsValue(subsidiaryId?: string): Promise<number> {
    const where = subsidiaryId ? { subsidiaryId } : {};
    
    const fixedAssets = await this.prisma.fixedAsset.findMany({
      where,
      select: { 
        acquisitionCost: true,
        depreciationRate: true,
      },
    });
    
    return fixedAssets.reduce((total, asset) => {
      const acquisitionCost = Number(asset.acquisitionCost) || 0;
      const depreciationRate = Number(asset.depreciationRate) || 0;
      const depreciationAmount = acquisitionCost * (depreciationRate / 100);
      return total + (acquisitionCost - depreciationAmount);
    }, 0);
  }

  /**
   * Calcule le montant total des dettes fournisseurs
   */
  async getSupplierDebts(subsidiaryId?: string): Promise<number> {
    const where = subsidiaryId ? { subsidiaryId } : {};
    
    const supplierDebts = await this.prisma.supplierDebt.findMany({
      where,
      select: { amount: true },
    });
    
    return supplierDebts.reduce((total, debt) => total + Number(debt.amount), 0);
  }

  /**
   * Récupère le capital social de la filiale
   */
  async getShareCapital(subsidiaryId?: string): Promise<number> {
    if (subsidiaryId) {
      const subsidiary = await this.prisma.subsidiary.findUnique({
        where: { id: subsidiaryId },
        select: { shareCapital: true },
      });
      
      return Number(subsidiary?.shareCapital) || 0;
    }
    
    // Si consolidation, somme des capitaux sociaux de toutes les filiales
    const subsidiaries = await this.prisma.subsidiary.findMany({
      select: { shareCapital: true },
    });
    
    return subsidiaries.reduce((total, subsidiary) => total + Number(subsidiary.shareCapital), 0);
  }

  /**
   * Calcule le résultat net cumulé (résultats des exercices antérieurs)
   * Pour simplifier, on utilise les données des ventes moins les dépenses
   */
  async getAccumulatedNetIncome(subsidiaryId?: string): Promise<number> {
    const where = subsidiaryId ? { subsidiaryId } : {};
    
    // Récupération des ventes
    const sales = await this.prisma.sale.findMany({
      where,
      select: { totalPrice: true },
    });
    
    const totalRevenue = sales.reduce((total, sale) => total + Number(sale.totalPrice), 0);
    
    // Récupération des dépenses
    const expenses = await this.prisma.expenseRecord.findMany({
      where,
      select: { amount: true },
    });
    
    const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
    
    // Récupération des salaires
    const payrolls = await this.prisma.payrollRecord.findMany({
      where,
      select: { netSalary: true },
    });
    
    const totalPayroll = payrolls.reduce((total, payroll) => total + Number(payroll.netSalary), 0);
    
    return totalRevenue - totalExpenses - totalPayroll;
  }
}
