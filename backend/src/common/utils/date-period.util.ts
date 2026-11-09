import { startOfDay, sub } from 'date-fns';

/** Treat date-input end bounds as inclusive for the whole selected calendar day. */
export const startOfDateInput = (value: string): Date =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

export const endOfDateInput = (value: string): Date =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T23:59:59.999Z`)
    : new Date(value);

/** Rolling presets represent whole calendar dates, including today. */
export const lastCalendarDays = (now: Date, days: number) => ({
  gte: startOfDay(sub(now, { days: days - 1 })),
  lte: now,
});
