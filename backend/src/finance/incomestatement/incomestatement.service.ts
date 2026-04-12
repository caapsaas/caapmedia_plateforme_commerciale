import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { IncomeStatementDto } from './dto/income-statement.dto';

@Injectable()
export class IncomestatementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule le compte de résultat (P&L) pour une filiale donnée et une période
   * @param subsidiaryId - ID de la filiale (optionnel, si null retourne le P&L consolidé)
   * @param startDate - Date de début de période
   * @param endDate - Date de fin de période
   * @returns Compte de résultat calculé
   */
  async getIncomeStatement(
    subsidiaryId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<IncomeStatementDto> {
    // Récupération des revenus (ventes)
    const revenue = await this.getRevenue(subsidiaryId, startDate, endDate);
    
    // Récupération du coût des marchandises vendues (COGS)
    const cogs = await this.getCostOfGoodsSold(subsidiaryId, startDate, endDate);
    
    // Calcul du bénéfice brut
    const grossProfit = revenue - cogs;
    
    // Récupération des dépenses d'exploitation
    const operatingExpenses = await this.getOperatingExpenses(subsidiaryId, startDate, endDate);
    
    // Récupération des taxes
    const taxes = await this.getTaxes(subsidiaryId, startDate, endDate);
    
    // Calcul du résultat net
    const netIncome = grossProfit - operatingExpenses - taxes;
    
    return {
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      taxes,
      netIncome,
    };
  }

  /**
   * Calcule le revenu total des ventes sur la période
   */
  private async getRevenue(
    subsidiaryId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<number> {
    const where = this.buildDateFilter(subsidiaryId, startDate, endDate);
    
    const sales = await this.prisma.sale.findMany({
      where,
      select: { totalPrice: true },
    });
    
    return sales.reduce((total, sale) => total + Number(sale.totalPrice), 0);
  }

  /**
   * Calcule le coût des marchandises vendues (COGS)
   * Basé sur le coût d'achat des produits vendus
   */
  private async getCostOfGoodsSold(
    subsidiaryId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<number> {
    const where = this.buildDateFilter(subsidiaryId, startDate, endDate);
    
    // Récupérer les ventes avec les produits associés
    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: {
                  select: { price: true }
                }
              }
            }
          }
        }
      }
    });
    
    let cogs = 0;
    for (const sale of sales) {
      if (sale.order?.orderItems) {
        for (const item of sale.order.orderItems) {
          // COGS = prix d'achat du produit × quantité vendue
          const purchasePrice = Number(item.product?.price) || 0;
          const quantity = Number(item.quantity) || 0;
          cogs += purchasePrice * quantity;
        }
      }
    }
    
    return cogs;
  }

  /**
   * Calcule les dépenses d'exploitation totales
   */
  private async getOperatingExpenses(
    subsidiaryId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<number> {
    const where = this.buildDateFilter(subsidiaryId, startDate, endDate);
    
    // Dépenses générales
    const expenses = await this.prisma.expenseRecord.findMany({
      where,
      select: { amount: true },
    });
    
    const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
    
    // Salaires et charges sociales
    const payrolls = await this.prisma.payrollRecord.findMany({
      where,
      select: { 
        netSalary: true,
        deductions: true,
      },
    });
    
    const totalPayroll = payrolls.reduce((total, payroll) => {
      const netSalary = Number(payroll.netSalary) || 0;
      const deductions = Number(payroll.deductions) || 0;
      return total + netSalary + deductions;
    }, 0);
    
    return totalExpenses + totalPayroll;
  }

  /**
   * Calcule le montant total des taxes
   */
  private async getTaxes(
    subsidiaryId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<number> {
    const where = this.buildDateFilter(subsidiaryId, startDate, endDate);
    
    // Pour simplifier, on considère les taxes comme une dépense spécifique
    // Dans une implémentation réelle, il faudrait une table dédiée pour les taxes
    const taxExpenses = await this.prisma.expenseRecord.findMany({
      where: {
        ...where,
        // Supposons qu'il y a un champ category ou type pour identifier les taxes
        // category: 'TAX'
      },
      select: { amount: true },
    });
    
    // Pour l'instant, retourne 0 ou un pourcentage fixe du revenu
    const revenue = await this.getRevenue(subsidiaryId, startDate, endDate);
    return revenue * 0.15; // 15% de taxes (exemple)
  }

  /**
   * Construit le filtre de date et de filiale pour les requêtes
   */
  private buildDateFilter(
    subsidiaryId?: string, 
    startDate?: string, 
    endDate?: string
  ): any {
    const where: any = {};
    
    if (subsidiaryId) {
      where.subsidiaryId = subsidiaryId;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    
    return where;
  }

  /**
   * Endpoint individuels pour chaque métrique (similaire au balance sheet)
   */
  async getRevenueData(subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number> {
    return this.getRevenue(subsidiaryId, startDate, endDate);
  }

  async getCogsData(subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number> {
    return this.getCostOfGoodsSold(subsidiaryId, startDate, endDate);
  }

  async getOperatingExpensesData(subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number> {
    return this.getOperatingExpenses(subsidiaryId, startDate, endDate);
  }

  async getTaxesData(subsidiaryId?: string, startDate?: string, endDate?: string): Promise<number> {
    return this.getTaxes(subsidiaryId, startDate, endDate);
  }
}
