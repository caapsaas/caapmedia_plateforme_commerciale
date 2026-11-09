/** Date-only helpers for period filters. Keep YYYY-MM-DD in local calendar time. */
export const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function getPresetPeriodDates(period: string, now = new Date()): { startDate: string; endDate: string } {
  const endDate = toLocalDateKey(now);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'last_7_days': start.setDate(start.getDate() - 6); break;
    case 'last_30_days': start.setDate(start.getDate() - 29); break;
    case 'last_90_days': start.setDate(start.getDate() - 89); break;
    case 'this_month': start.setDate(1); break;
    case 'last_month':
      start.setMonth(start.getMonth() - 1, 1);
      return { startDate: toLocalDateKey(start), endDate: toLocalDateKey(new Date(now.getFullYear(), now.getMonth(), 0)) };
    case 'this_year': start.setMonth(0, 1); break;
    default: return { startDate: '', endDate: '' };
  }
  return { startDate: toLocalDateKey(start), endDate };
}
