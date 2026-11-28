/**
 * Formatage unifie des montants en FCFA (XAF) — Lot 1 Precision Workspace.
 */
export function formatFcfa(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  if (Number.isNaN(num)) return '0 FCFA';
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)} FCFA`;
}

export function normalizeCurrencyLabel(currency?: string | null): string {
  if (!currency || currency === 'XOF' || currency === 'XAF') return 'FCFA';
  return currency;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
