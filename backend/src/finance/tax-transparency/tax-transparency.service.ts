import { Injectable } from '@nestjs/common';
import { endOfMonth, startOfMonth } from 'date-fns';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { UserRole } from '@prisma/client';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from 'src/common/utils/subsidiary-scope';
import { TaxTransparencyPeriodDto } from './dto/tax-transparency-period.dto';

@Injectable()
export class TaxTransparencyService {
  constructor(private readonly prisma: PrismaService) {}

  private payrollPeriodWhere(dto: TaxTransparencyPeriodDto, user: JwtUser) {
    const scope = resolveScopeContext(user, [UserRole.FINANCIAL_DIRECTOR]);
    const payrollPeriod = `${dto.year}-${String(dto.month).padStart(2, '0')}`;
    return {
      where: withSubsidiaryScope({ payrollPeriod }, scope, dto.subsidiaryId),
      payrollPeriod,
    };
  }

  /**
   * Synthèse des charges sociales/fiscales sur la paie (CNPS, CFC, IRPP,
   * CAC, FNE) pour un mois donné — agrégée depuis PayrollRecord, qui porte
   * déjà le détail calculé par cameroonpayrollcalculator.service.ts.
   */
  async getPayrollSummary(dto: TaxTransparencyPeriodDto, user: JwtUser) {
    const { where, payrollPeriod } = this.payrollPeriodWhere(dto, user);

    const records = await this.prisma.payrollRecord.findMany({
      where,
      select: {
        grossSalary: true,
        netSalary: true,
        cnpsEmployee: true,
        cnpsEmployer: true,
        cfcEmployee: true,
        cfcEmployer: true,
        irpp: true,
        cac: true,
        fne: true,
        totalEmployerCost: true,
      },
    });

    const sum = (field: keyof (typeof records)[number]) =>
      records.reduce((acc, r) => acc + Number(r[field]), 0);

    return {
      period: payrollPeriod,
      employeeCount: records.length,
      grossSalary: sum('grossSalary'),
      netSalary: sum('netSalary'),
      cnpsEmployee: sum('cnpsEmployee'),
      cnpsEmployer: sum('cnpsEmployer'),
      cnpsTotal: sum('cnpsEmployee') + sum('cnpsEmployer'),
      cfcEmployee: sum('cfcEmployee'),
      cfcEmployer: sum('cfcEmployer'),
      cfcTotal: sum('cfcEmployee') + sum('cfcEmployer'),
      irpp: sum('irpp'),
      cac: sum('cac'),
      irppTotal: sum('irpp') + sum('cac'),
      fne: sum('fne'),
      totalEmployerCost: sum('totalEmployerCost'),
    };
  }

  /**
   * Détail IRPP par employé (onglet "Détail IRPP") — matricule = numéro CNPS
   * de l'employé (Employee.socialSecurityNumber), seul identifiant
   * d'immatriculation porté par le modèle RH actuel.
   */
  async getIrppDetail(dto: TaxTransparencyPeriodDto, user: JwtUser) {
    const { where, payrollPeriod } = this.payrollPeriodWhere(dto, user);

    const records = await this.prisma.payrollRecord.findMany({
      where,
      select: {
        employeeName: true,
        grossSalary: true,
        irpp: true,
        cac: true,
        employee: { select: { socialSecurityNumber: true } },
      },
      orderBy: { employeeName: 'asc' },
    });

    const details = records.map((r) => ({
      employeeName: r.employeeName,
      matricule: r.employee?.socialSecurityNumber ?? '—',
      baseAmount: Number(r.grossSalary),
      irppAmount: Number(r.irpp) + Number(r.cac),
    }));

    return {
      period: payrollPeriod,
      details,
      totalAmount: details.reduce((acc, d) => acc + d.irppAmount, 0),
    };
  }

  /**
   * Détail CNPS par employé (onglet "CNPS Détail") — part salariale
   * (cnpsEmployee) vs part patronale (cnpsEmployer).
   */
  async getCnpsDetail(dto: TaxTransparencyPeriodDto, user: JwtUser) {
    const { where, payrollPeriod } = this.payrollPeriodWhere(dto, user);

    const records = await this.prisma.payrollRecord.findMany({
      where,
      select: {
        employeeName: true,
        grossSalary: true,
        cnpsEmployee: true,
        cnpsEmployer: true,
        employee: { select: { socialSecurityNumber: true } },
      },
      orderBy: { employeeName: 'asc' },
    });

    const details = records.map((r) => ({
      employeeName: r.employeeName,
      matricule: r.employee?.socialSecurityNumber ?? '—',
      baseAmount: Number(r.grossSalary),
      employeeShare: Number(r.cnpsEmployee),
      employerShare: Number(r.cnpsEmployer),
      total: Number(r.cnpsEmployee) + Number(r.cnpsEmployer),
    }));

    return {
      period: payrollPeriod,
      details,
      totalEmployee: details.reduce((acc, d) => acc + d.employeeShare, 0),
      totalEmployer: details.reduce((acc, d) => acc + d.employerShare, 0),
      total: details.reduce((acc, d) => acc + d.total, 0),
    };
  }

  /**
   * Détail CFC (Crédit Foncier du Cameroun) et FNE (Fonds National de
   * l'Emploi) par employé (onglet "CFC & FNE") — équivalent camerounais des
   * onglets Rosalaire/TPA de gmo (Burkina Faso).
   */
  async getCfcFneDetail(dto: TaxTransparencyPeriodDto, user: JwtUser) {
    const { where, payrollPeriod } = this.payrollPeriodWhere(dto, user);

    const records = await this.prisma.payrollRecord.findMany({
      where,
      select: {
        employeeName: true,
        grossSalary: true,
        cfcEmployee: true,
        cfcEmployer: true,
        fne: true,
        employee: { select: { socialSecurityNumber: true } },
      },
      orderBy: { employeeName: 'asc' },
    });

    const cfcDetails = records.map((r) => ({
      employeeName: r.employeeName,
      matricule: r.employee?.socialSecurityNumber ?? '—',
      baseAmount: Number(r.grossSalary),
      amount: Number(r.cfcEmployee) + Number(r.cfcEmployer),
    }));
    const fneDetails = records.map((r) => ({
      employeeName: r.employeeName,
      matricule: r.employee?.socialSecurityNumber ?? '—',
      baseAmount: Number(r.grossSalary),
      amount: Number(r.fne),
    }));

    return {
      period: payrollPeriod,
      cfc: {
        details: cfcDetails,
        totalAmount: cfcDetails.reduce((acc, d) => acc + d.amount, 0),
      },
      fne: {
        details: fneDetails,
        totalAmount: fneDetails.reduce((acc, d) => acc + d.amount, 0),
      },
    };
  }

  /**
   * TVA collectée sur les ventes du mois — agrégée depuis Order.taxAmount.
   * NB : pas de suivi de TVA déductible sur achats pour l'instant (le
   * modèle PurchaseOrder ne porte aucun champ de taxe) — cette synthèse ne
   * couvre donc que le volet "collecté", pas le net à verser.
   */
  async getVatSummary(dto: TaxTransparencyPeriodDto, user: JwtUser) {
    const scope = resolveScopeContext(user, [UserRole.FINANCIAL_DIRECTOR]);
    const monthStart = startOfMonth(new Date(dto.year, dto.month - 1, 1));
    const monthEnd = endOfMonth(monthStart);

    const where = withSubsidiaryScope(
      {
        orderDate: { gte: monthStart, lte: monthEnd },
        applyTax: true,
      },
      scope,
      dto.subsidiaryId,
    );

    const aggregate = await this.prisma.order.aggregate({
      where,
      _sum: { taxAmount: true, subtotal: true, totalAmount: true },
      _count: true,
    });

    return {
      period: `${dto.year}-${String(dto.month).padStart(2, '0')}`,
      orderCount: aggregate._count,
      taxableSubtotal: Number(aggregate._sum.subtotal ?? 0),
      vatCollected: Number(aggregate._sum.taxAmount ?? 0),
      totalWithTax: Number(aggregate._sum.totalAmount ?? 0),
    };
  }

  /**
   * Détail TVA collectée (onglet "Détail TVA") — une ligne par commande
   * taxée du mois, pour l'export/impression du relevé.
   */
  async getVatDetail(dto: TaxTransparencyPeriodDto, user: JwtUser) {
    const scope = resolveScopeContext(user, [UserRole.FINANCIAL_DIRECTOR]);
    const monthStart = startOfMonth(new Date(dto.year, dto.month - 1, 1));
    const monthEnd = endOfMonth(monthStart);

    const where = withSubsidiaryScope(
      {
        orderDate: { gte: monthStart, lte: monthEnd },
        applyTax: true,
      },
      scope,
      dto.subsidiaryId,
    );

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        orderDate: true,
        customerName: true,
        subtotal: true,
        taxAmount: true,
        totalAmount: true,
      },
      orderBy: { orderDate: 'desc' },
    });

    return {
      period: `${dto.year}-${String(dto.month).padStart(2, '0')}`,
      details: orders.map((o) => ({
        orderId: o.id,
        date: o.orderDate,
        clientName: o.customerName,
        taxableAmount: Number(o.subtotal),
        vatAmount: Number(o.taxAmount),
        totalAmount: Number(o.totalAmount),
      })),
    };
  }
}
