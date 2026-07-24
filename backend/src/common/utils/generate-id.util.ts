/**
 * Generates semantic IDs with format: PREFIX-TIMESTAMP_BASE36+RANDOM_BASE36
 * Example: EMP-SNCM1AB (Employee), PRD-SNCM1XY2 (Product)
 */
export const generateId = (prefix: string): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 46656)
    .toString(36)
    .padStart(3, '0')
    .toUpperCase();
  return `${prefix.toUpperCase()}-${ts}${rand}`;
};
