import { Injectable } from '@nestjs/common';
import {
  AccountType,
  DebtStatus,
  ExpenseStatus,
  OrderStatus,
  PaymentStatus,
  PurchaseOrderStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { AccountingBalanceService } from '../../accounting/shared/accounting-balance.service';
import { endOfDateInput } from '../../common/utils/date-period.util';

@Injectable()
export class FinancialPilotageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly balanceService: AccountingBalanceService,
  ) {}

  private buildDateRange(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined;
    return {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: endOfDateInput(endDate) } : {}),
    };
  }

  async getCashflowReport(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateRange = this.buildDateRange(startDate, endDate);
    const subFilter = subsidiaryId ? { subsidiaryId } : {};

    const [accounts, validatedTxs, pendingTxs, unpaidReceivables, unpaidDebts] =
      await Promise.all([
        this.prisma.treasuryAccount.findMany({
          where: subFilter,
          select: {
            id: true,
            accountName: true,
            accountType: true,
            balance: true,
            subsidiaryId: true,
          },
        }),
        this.prisma.financialTransaction.findMany({
          where: {
            ...subFilter,
            status: TransactionStatus.VALIDE,
            isReversed: false,
            ...(dateRange ? { transactionDate: dateRange } : {}),
          },
          select: {
            id: true,
            amount: true,
            feesAmount: true,
            financialTransactionType: true,
            treasuryType: true,
            destinationAccountId: true,
            transactionDate: true,
          },
        }),
        this.prisma.financialTransaction.findMany({
          where: {
            ...subFilter,
            status: TransactionStatus.EN_ATTENTE,
          },
          select: {
            amount: true,
            financialTransactionType: true,
          },
        }),
        this.getCustomerReceivables(subsidiaryId),
        this.getUnpaidSupplierDebts(subsidiaryId),
      ]);

    const balancesByType: Record<string, number> = {};
    let totalCashPosition = 0;
    for (const acc of accounts) {
      const bal = Number(acc.balance);
      totalCashPosition += bal;
      balancesByType[acc.accountType] =
        (balancesByType[acc.accountType] ?? 0) + bal;
    }

    let totalInflows = 0;
    let totalOutflows = 0;
    let internalTransfers = 0;
    let totalBankFees = 0;
    const monthlyMap = new Map<
      string,
      { month: string; inflows: number; outflows: number }
    >();

    for (const tx of validatedTxs) {
      const amt = Number(tx.amount);
      const fees = Number(tx.feesAmount ?? 0);
      totalBankFees += fees;
      const monthKey = tx.transactionDate.toISOString().slice(0, 7);
      const bucket = monthlyMap.get(monthKey) ?? {
        month: monthKey,
        inflows: 0,
        outflows: 0,
      };

      if (tx.destinationAccountId) {
        internalTransfers += amt;
        continue;
      }

      if (tx.financialTransactionType === TransactionType.RECETTE) {
        totalInflows += amt;
        bucket.inflows += amt;
      } else {
        totalOutflows += amt;
        bucket.outflows += amt;
      }
      monthlyMap.set(monthKey, bucket);
    }

    let pendingInflows = 0;
    let pendingOutflows = 0;
    for (const ptx of pendingTxs) {
      if (ptx.financialTransactionType === TransactionType.RECETTE) {
        pendingInflows += Number(ptx.amount);
      } else {
        pendingOutflows += Number(ptx.amount);
      }
    }

    return {
      totalCashPosition,
      balancesByType: {
        cashRegister: balancesByType[AccountType.CASH_REGISTER] ?? 0,
        safe: balancesByType[AccountType.SAFE] ?? 0,
        bank: balancesByType[AccountType.BANQUE] ?? 0,
        expenseBox: balancesByType[AccountType.EXPENSE_BOX] ?? 0,
        prefinancement: balancesByType[AccountType.COMPTE_PREFINANCEMENT] ?? 0,
      },
      period: {
        inflows: totalInflows,
        outflows: totalOutflows,
        netCashflow: totalInflows - totalOutflows,
        internalTransfers,
        bankFees: totalBankFees,
      },
      pending: {
        pendingInflows,
        pendingOutflows,
        customerReceivables: unpaidReceivables,
        supplierDebts: unpaidDebts,
      },
      monthlySeries: Array.from(monthlyMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month),
      ),
    };
  }

  async getProfitabilityReport(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateRange = this.buildDateRange(startDate, endDate);
    const subFilter = subsidiaryId ? { subsidiaryId } : {};

    const [orders, expenses, payrolls, purchaseOrders, ledgerSales] =
      await Promise.all([
        this.prisma.order.findMany({
          where: {
            ...subFilter,
            status: { not: OrderStatus.CANCELLED },
            ...(dateRange ? { orderDate: dateRange } : {}),
          },
          select: { totalAmount: true, amountPaid: true },
        }),
        this.prisma.expenseRecord.findMany({
          where: {
            ...subFilter,
            status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID] },
            ...(dateRange ? { expenseDate: dateRange } : {}),
          },
          select: { amount: true, category: true },
        }),
        this.prisma.payrollRecord.findMany({
          where: {
            ...subFilter,
            ...(dateRange ? { payPeriodEnd: dateRange } : {}),
          },
          select: { netSalary: true, deductions: true },
        }),
        this.prisma.purchaseOrder.findMany({
          where: {
            ...subFilter,
            status: { not: PurchaseOrderStatus.CANCELLED },
            ...(dateRange ? { createdAt: dateRange } : {}),
          },
          select: { totalAmount: true },
        }),
        this.balanceService.getAccountBalanceByPrefix(
          ['70'],
          startDate ? new Date(startDate) : null,
          endDate ? endOfDateInput(endDate) : new Date(),
          subsidiaryId,
        ),
      ]);

    const invoicedRevenue = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    const collectedRevenue = orders.reduce(
      (sum, o) => sum + Number(o.amountPaid),
      0,
    );
    const purchaseCosts = purchaseOrders.reduce(
      (sum, po) => sum + Number(po.totalAmount),
      0,
    );
    const operatingExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const payrollCosts = payrolls.reduce(
      (sum, p) => sum + Number(p.netSalary) + Number(p.deductions),
      0,
    );

    const breakdownMap = new Map<string, number>();
    for (const exp of expenses) {
      breakdownMap.set(
        exp.category,
        (breakdownMap.get(exp.category) ?? 0) + Number(exp.amount),
      );
    }

    const effectiveRevenue = ledgerSales > 0 ? ledgerSales : invoicedRevenue;
    const grossMargin = effectiveRevenue - purchaseCosts;
    const netOperatingResult = grossMargin - operatingExpenses - payrollCosts;
    const collectionRate =
      invoicedRevenue > 0
        ? Math.round((collectedRevenue / invoicedRevenue) * 1000) / 10
        : 0;
    const marginRate =
      effectiveRevenue > 0
        ? Math.round((netOperatingResult / effectiveRevenue) * 1000) / 10
        : 0;

    return {
      invoicedRevenue,
      collectedRevenue,
      ledgerRevenue: ledgerSales,
      collectionRate,
      purchaseCosts,
      operatingExpenses,
      payrollCosts,
      grossMargin,
      netOperatingResult,
      marginRate,
      expenseBreakdown: Array.from(breakdownMap.entries()).map(
        ([category, amount]) => ({ category, amount }),
      ),
    };
  }

  async getTreasuryData(subsidiaryId?: string): Promise<number> {
    const accounts = await this.prisma.treasuryAccount.findMany({
      where: subsidiaryId ? { subsidiaryId } : {},
      select: { balance: true },
    });
    return accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  }

  async getCustomerReceivables(subsidiaryId?: string): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(subsidiaryId ? { subsidiaryId } : {}),
        paymentStatus: { not: PaymentStatus.PAID },
        status: { not: OrderStatus.CANCELLED },
      },
      select: { totalAmount: true, amountPaid: true },
    });
    return orders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) - Number(o.amountPaid)),
      0,
    );
  }

  async getUnpaidSupplierDebts(subsidiaryId?: string): Promise<number> {
    const debts = await this.prisma.supplierDebt.findMany({
      where: {
        ...(subsidiaryId ? { subsidiaryId } : {}),
        status: { not: DebtStatus.PAYER },
      },
      select: { amount: true },
    });
    return debts.reduce((sum, d) => sum + Number(d.amount), 0);
  }
}
