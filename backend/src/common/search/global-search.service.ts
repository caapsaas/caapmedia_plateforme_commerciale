import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../utils/prisma/prisma.service';
import { JwtUser } from '../auth/jwt/jwt-user.interface';
import { getActiveRole, isSuperAdmin } from '../auth/role/role-identity';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from '../utils/subsidiary-scope';

export interface GlobalSearchResultItem {
  id: string;
  category:
    | 'ORDER'
    | 'PROFORMA'
    | 'CONTACT'
    | 'LEAD'
    | 'SUPPLIER'
    | 'EMPLOYEE'
    | 'ITEM'
    | 'EQUIPMENT';
  title: string;
  subtitle: string;
  status?: string;
  route: string;
}

const MAX_PER_CATEGORY = 5;

@Injectable()
export class GlobalSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    query: string,
    user: JwtUser,
  ): Promise<GlobalSearchResultItem[]> {
    const q = query?.trim();
    if (!q || q.length < 2) return [];

    const activeRole = getActiveRole(user);
    if (!activeRole) return [];
    const superAdmin = isSuperAdmin(user);
    const scopeCtx = resolveScopeContext(user);
    const isCommercial = activeRole === UserRole.COMMERCIAL && !superAdmin;

    const hasRole = (roles: readonly UserRole[]) =>
      superAdmin || roles.includes(activeRole);

    const canOrders = hasRole([
      UserRole.ADMIN,
      UserRole.COMMERCIAL,
      UserRole.CAISSIER,
      UserRole.FINANCIAL_DIRECTOR,
      UserRole.PRODUCTION_DIRECTOR,
    ]);
    const canProformas = hasRole([
      UserRole.ADMIN,
      UserRole.COMMERCIAL,
      UserRole.FINANCIAL_DIRECTOR,
    ]);
    const canContacts = hasRole([
      UserRole.ADMIN,
      UserRole.COMMERCIAL,
      UserRole.CAISSIER,
      UserRole.FINANCIAL_DIRECTOR,
      UserRole.SECRETARY,
    ]);
    const canLeads = hasRole([
      UserRole.ADMIN,
      UserRole.COMMERCIAL,
      UserRole.FINANCIAL_DIRECTOR,
      UserRole.SECRETARY,
    ]);
    const canSuppliers = hasRole([
      UserRole.ADMIN,
      UserRole.PURCHASING_MANAGER,
      UserRole.FINANCIAL_DIRECTOR,
    ]);
    const canEmployees = hasRole([
      UserRole.ADMIN,
      UserRole.HR_MANAGER,
      UserRole.SECRETARY,
    ]);
    const canItems = hasRole([
      UserRole.ADMIN,
      UserRole.COMMERCIAL,
      UserRole.CAISSIER,
      UserRole.PURCHASING_MANAGER,
      UserRole.FINANCIAL_DIRECTOR,
      UserRole.PRODUCTION_DIRECTOR,
    ]);
    const canEquipment = hasRole([
      UserRole.ADMIN,
      UserRole.PRODUCTION_DIRECTOR,
      UserRole.FINANCIAL_DIRECTOR,
    ]);

    const emptyGroup = (): Promise<GlobalSearchResultItem[]> =>
      Promise.resolve<GlobalSearchResultItem[]>([]);
    const groups: Promise<GlobalSearchResultItem[]>[] = [
      canOrders
        ? this.prisma.order
            .findMany({
              where: withSubsidiaryScope(
                {
                  ...(isCommercial ? { salesRepId: user.id } : {}),
                  OR: [
                    { id: { contains: q, mode: 'insensitive' } },
                    { customerName: { contains: q, mode: 'insensitive' } },
                  ],
                },
                scopeCtx,
              ),
              select: {
                id: true,
                customerName: true,
                totalAmount: true,
                status: true,
              },
              orderBy: { orderDate: 'desc' },
              take: MAX_PER_CATEGORY,
            })
            .then((rows) =>
              rows.map((o) => ({
                id: o.id,
                category: 'ORDER' as const,
                title: `${o.id} — ${o.customerName}`,
                subtitle: `${Number(o.totalAmount).toLocaleString('fr-FR')} FCFA`,
                status: o.status,
                route: '/dashboard/sales',
              })),
            )
        : emptyGroup(),
      canProformas
        ? this.prisma.proforma
            .findMany({
              where: withSubsidiaryScope(
                {
                  ...(isCommercial ? { createdBy: user.id } : {}),
                  OR: [
                    { proformaNumber: { contains: q, mode: 'insensitive' } },
                    { clientName: { contains: q, mode: 'insensitive' } },
                    { clientCompany: { contains: q, mode: 'insensitive' } },
                  ],
                },
                scopeCtx,
              ),
              select: {
                id: true,
                proformaNumber: true,
                clientName: true,
                clientCompany: true,
                totalAmount: true,
                status: true,
              },
              orderBy: { createdAt: 'desc' },
              take: MAX_PER_CATEGORY,
            })
            .then((rows) =>
              rows.map((p) => ({
                id: p.id,
                category: 'PROFORMA' as const,
                title: `${p.proformaNumber} — ${p.clientName}`,
                subtitle: `${p.clientCompany || 'Client'} · ${Number(p.totalAmount).toLocaleString('fr-FR')} FCFA`,
                status: p.status,
                route: '/dashboard/proforma',
              })),
            )
        : emptyGroup(),
      canContacts
        ? this.prisma.contact
            .findMany({
              where: withSubsidiaryScope(
                {
                  isActive: true,
                  ...(isCommercial ? { salesRepId: user.id } : {}),
                  OR: [
                    { contactName: { contains: q, mode: 'insensitive' } },
                    { company: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q, mode: 'insensitive' } },
                  ],
                },
                scopeCtx,
              ),
              select: {
                id: true,
                contactName: true,
                company: true,
                phone: true,
                status: true,
              },
              orderBy: { contactName: 'asc' },
              take: MAX_PER_CATEGORY,
            })
            .then((rows) =>
              rows.map((c) => ({
                id: c.id,
                category: 'CONTACT' as const,
                title: c.contactName,
                subtitle: `${c.company} · ${c.phone}`,
                status: c.status ?? undefined,
                route: '/dashboard/crm',
              })),
            )
        : emptyGroup(),
      canLeads
        ? this.prisma.lead
            .findMany({
              where: withSubsidiaryScope(
                {
                  ...(isCommercial && user.employeeId
                    ? { salesRepId: user.employeeId }
                    : {}),
                  OR: [
                    { leadName: { contains: q, mode: 'insensitive' } },
                    { company: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                  ],
                },
                scopeCtx,
              ),
              select: {
                id: true,
                leadName: true,
                company: true,
                status: true,
              },
              orderBy: { leadName: 'asc' },
              take: MAX_PER_CATEGORY,
            })
            .then((rows) =>
              rows.map((l) => ({
                id: l.id,
                category: 'LEAD' as const,
                title: l.leadName,
                subtitle: l.company,
                status: l.status,
                route: '/dashboard/crm',
              })),
            )
        : emptyGroup(),
      canSuppliers
        ? this.prisma.supplier
            .findMany({
              where: withSubsidiaryScope(
                {
                  isActive: true,
                  OR: [
                    { supplierName: { contains: q, mode: 'insensitive' } },
                    { company: { contains: q, mode: 'insensitive' } },
                  ],
                },
                scopeCtx,
              ),
              select: {
                id: true,
                supplierName: true,
                company: true,
                phone: true,
              },
              orderBy: { supplierName: 'asc' },
              take: MAX_PER_CATEGORY,
            })
            .then((rows) =>
              rows.map((s) => ({
                id: s.id,
                category: 'SUPPLIER' as const,
                title: s.supplierName,
                subtitle: `${s.company} · ${s.phone}`,
                route: '/dashboard/purchasing',
              })),
            )
        : emptyGroup(),
      canEmployees
        ? this.prisma.employee
            .findMany({
              where: withSubsidiaryScope(
                {
                  OR: [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { positions: { contains: q, mode: 'insensitive' } },
                  ],
                },
                scopeCtx,
              ),
              select: {
                id: true,
                firstName: true,
                lastName: true,
                positions: true,
                status: true,
              },
              orderBy: { lastName: 'asc' },
              take: MAX_PER_CATEGORY,
            })
            .then((rows) =>
              rows.map((e) => ({
                id: e.id,
                category: 'EMPLOYEE' as const,
                title: `${e.firstName} ${e.lastName}`,
                subtitle: e.positions,
                status: e.status,
                route: '/dashboard/hr',
              })),
            )
        : emptyGroup(),
      canItems
        ? this.prisma.item
            .findMany({
              where: {
                isActive: true,
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { category: { contains: q, mode: 'insensitive' } },
                  { sku: { contains: q, mode: 'insensitive' } },
                ],
              },
              select: {
                id: true,
                name: true,
                category: true,
                type: true,
              },
              orderBy: { name: 'asc' },
              take: MAX_PER_CATEGORY,
            })
            .then((rows) =>
              rows.map((i) => ({
                id: i.id,
                category: 'ITEM' as const,
                title: i.name,
                subtitle: `${i.category} (${i.type})`,
                route:
                  i.type === 'STOCK_PRODUCT'
                    ? '/dashboard/stock'
                    : '/dashboard/configuration',
              })),
            )
        : emptyGroup(),
      canEquipment
        ? this.prisma.equipment
            .findMany({
              where: withSubsidiaryScope(
                {
                  equipmentName: { contains: q, mode: 'insensitive' },
                },
                scopeCtx,
              ),
              select: {
                id: true,
                equipmentName: true,
                status: true,
              },
              orderBy: { equipmentName: 'asc' },
              take: MAX_PER_CATEGORY,
            })
            .then((rows) =>
              rows.map((eq) => ({
                id: eq.id,
                category: 'EQUIPMENT' as const,
                title: eq.equipmentName,
                subtitle: 'Équipement atelier',
                status: eq.status,
                route: '/dashboard/equipements',
              })),
            )
        : emptyGroup(),
    ];

    const resolved = await Promise.all(groups);
    return resolved.flat();
  }
}
