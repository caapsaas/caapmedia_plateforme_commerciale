const units = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
];
const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

function spellGroup(value: number, beforeThousand = false): string {
  if (value < units.length) return units[value];
  if (value < 20) return `dix-${units[value - 10]}`;
  if (value < 70) {
    const base = tens[Math.floor(value / 10)];
    const rest = value % 10;
    return rest === 0
      ? base
      : `${base}${rest === 1 ? ' et ' : '-'}${units[rest]}`;
  }
  if (value < 80)
    return value === 71
      ? 'soixante et onze'
      : `soixante-${spellGroup(value - 60)}`;
  if (value === 80) return beforeThousand ? 'quatre-vingt' : 'quatre-vingts';
  if (value < 100) return `quatre-vingt-${spellGroup(value - 80)}`;

  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const base = hundreds === 1 ? 'cent' : `${units[hundreds]} cent`;
  if (rest) return `${base} ${spellGroup(rest, beforeThousand)}`;
  return hundreds > 1 && !beforeThousand ? `${base}s` : base;
}

export function amountInWords(amount: number): string {
  let remaining = Math.abs(Math.round(amount));
  const parts: string[] = [];
  for (const scale of [
    '',
    'mille',
    'million',
    'milliard',
    'billion',
    'billiard',
  ]) {
    if (remaining === 0) break;
    const group = remaining % 1000;
    remaining = Math.floor(remaining / 1000);
    if (!group) continue;
    if (scale === 'mille' && group === 1) {
      parts.unshift('mille');
    } else {
      const suffix = scale
        ? ` ${scale}${group > 1 && scale !== 'mille' ? 's' : ''}`
        : '';
      parts.unshift(spellGroup(group, scale === 'mille') + suffix);
    }
  }
  const words = parts.join(' ') || 'zéro';
  const currency =
    Math.abs(Math.round(amount)) === 1 ? 'franc CFA' : 'francs CFA';
  const connector = /(?:million|milliard|billion|billiard)s?$/.test(words)
    ? ' de '
    : ' ';
  return `${Math.round(amount) < 0 ? 'moins ' : ''}${words}${connector}${currency}`;
}
