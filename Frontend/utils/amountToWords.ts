// Nombre → toutes lettres (FR), montants en FCFA — pas de gestion des
// décimales : les montants XOF n'en portent jamais. Extrait de
// ProformaTemplateModal.tsx (seul document à l'utiliser jusqu'ici) pour être
// partagé par tous les documents financiers (Facture, Bon de commande, Proforma).
export const numberToWordsFr = (n: number): string => {
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

    const chunk = (num: number): string => {
        if (num === 0) return '';
        if (num < 10) return units[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) {
            const t = Math.floor(num / 10);
            const u = num % 10;
            return tens[t] + (u ? (t === 7 || t === 9 ? '-' + teens[u] : '-' + units[u]) : '') + (u === 1 && (t === 8) ? 's' : '');
        }
        const h = Math.floor(num / 100);
        const rest = num % 100;
        return (h > 1 ? units[h] + ' cent' : 'cent') + (rest ? ' ' + chunk(rest) : h > 1 ? 's' : '');
    };

    if (n === 0) return 'zéro';
    let result = '';
    const millions = Math.floor(n / 1_000_000);
    const thousands = Math.floor((n % 1_000_000) / 1000);
    const rest = n % 1000;

    if (millions) result += (millions > 1 ? chunk(millions) + ' millions' : 'un million') + ' ';
    if (thousands) result += (thousands > 1 ? chunk(thousands) + ' mille' : 'mille') + ' ';
    if (rest) result += chunk(rest);

    return result.trim();
};

/**
 * "Arrêté à la somme de : <montant> francs CFA" — formule standard utilisée
 * sur les documents financiers imprimés (facture, bon de commande, proforma).
 */
export const amountToWordsFcfa = (amount: number): string =>
    `${numberToWordsFr(Math.round(amount))} francs CFA`;
