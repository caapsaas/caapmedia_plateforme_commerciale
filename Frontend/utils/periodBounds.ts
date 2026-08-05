import { PeriodFilter } from '../services/apiStatistic/apiAnalytics';

/**
 * Traduit le vocabulaire de période partagé par tous les onglets Analytics
 * (cf. PeriodFilter d'apiAnalytics.ts) en bornes de dates concrètes — utilisé
 * partout où un filtrage de transactions se fait côté client (pas d'endpoint
 * dédié acceptant `period` directement).
 */
export function resolvePeriodBounds(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string,
): { start?: string; end?: string } {
  const now = new Date();
  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

  switch (period) {
    case 'custom':
      return { start: customStart, end: customEnd };
    case 'this_month':
      return { start: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), end: toIsoDate(now) };
    case 'last_month': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toIsoDate(lastMonth), end: toIsoDate(lastMonthEnd) };
    }
    case 'last_7_days': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { start: toIsoDate(d), end: toIsoDate(now) };
    }
    case 'last_30_days': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { start: toIsoDate(d), end: toIsoDate(now) };
    }
    case 'last_90_days': {
      const d = new Date(now);
      d.setDate(d.getDate() - 89);
      return { start: toIsoDate(d), end: toIsoDate(now) };
    }
    case 'this_year':
      return { start: toIsoDate(new Date(now.getFullYear(), 0, 1)), end: toIsoDate(now) };
    case 'all_time':
    default:
      return {};
  }
}
