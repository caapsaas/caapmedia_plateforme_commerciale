import { PeriodFilter } from '../services/apiStatistic/apiAnalytics';
import { getPresetPeriodDates } from './datePeriods';

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
  switch (period) {
    case 'custom':
      return { start: customStart, end: customEnd };
    case 'this_month':
    case 'last_month':
    case 'last_7_days':
    case 'last_30_days':
    case 'last_90_days':
    case 'this_year': {
      const range = getPresetPeriodDates(period);
      return { start: range.startDate, end: range.endDate };
    }
    case 'all_time':
    default:
      return {};
  }
}
