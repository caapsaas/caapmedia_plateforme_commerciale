import { Product, ProductOptions } from '../types';
import { getTaxes } from '../services/apiE-commerce/apitaxes';

// Degressive pricing table: [quantity, discount percentage]
// The table should be sorted by threshold in descending order
const degressivePricing = [
    { threshold: 1000, discount: 0.20 },
    { threshold: 500, discount: 0.15 },
    { threshold: 250, discount: 0.10 },
    { threshold: 100, discount: 0.05 },
];

export function calculatePrice(
    product: Product,
    options: Partial<ProductOptions>,
    quantity: number,
    basePrice: number,
    taxRate: number = 0 // Default tax rate is 0 if not provided
): { unitPriceHT: number; totalPriceHT: number; taxAmount: number; totalPriceTTC: number; } {
    if (quantity <= 0) {
        return { unitPriceHT: basePrice, totalPriceHT: 0, taxAmount: 0, totalPriceTTC: 0 };
    }

    let calculatedPrice = basePrice;
    const config = product.configurableOptions;

    if (config) {
        const allOptions = [
            { key: 'format', items: config.FORMATS },
            { key: 'grammage', items: config.GRAMMAGES },
            { key: 'printSide', items: config.PRINTSIDES },
            { key: 'lamination', items: config.LAMINATIONS },
            { key: 'size', items: config.SIZES },
            { key: 'color', items: config.COLORS },
            { key: 'material', items: config.MATERIALS },
            { key: 'dimension', items: config.DIMENSIONS },
            { key: 'binding', items: config.BINDINGS },
            { key: 'folding', items: config.FOLDINGS },
            { key: 'corner', items: config.CORNERS },
            { key: 'eyelet', items: config.EYELETS },
            { key: 'page', items: config.PAGES },
            { key: 'handle', items: config.HANDLES },
            { key: 'stub', items: config.STUB },
            { key: 'numbering', items: config.NUMBERING },
        ];

        for (const opt of allOptions) {
            const selectedValue = (options as any)[opt.key];
            if (selectedValue && opt.items) {
                const multiplier = Number(opt.items.find(i => i.optionName === selectedValue)?.multiplier) || 1;
                calculatedPrice *= multiplier;
            }
        }
    }

    const unitPriceWithOptions = calculatedPrice;

    // Apply degressive pricing
    let discount = 0;
    for (const tier of degressivePricing) {
        if (quantity >= tier.threshold) { // The first match is the correct one because the table is sorted
            discount = tier.discount;
            break;
        }
    }

    const unitPriceHT = unitPriceWithOptions * (1 - discount);
    const totalPriceHT = unitPriceHT * quantity;

    const taxAmount = totalPriceHT * taxRate;
    const totalPriceTTC = totalPriceHT + taxAmount;

    return { unitPriceHT, totalPriceHT, taxAmount, totalPriceTTC };
}

/**
 * Calculates the price including the default tax fetched from the API.
 * This is an async function and should be used in async contexts (e.g., in React components with useEffect/useState).
 */
export async function calculatePriceWithDefaultTax(
    product: Product, 
    options: Partial<ProductOptions>, 
    quantity: number
): Promise<{ unitPriceHT: number; totalPriceHT: number; taxAmount: number; totalPriceTTC: number; }> {
    try {
        const taxes = await getTaxes();
        const defaultTax = taxes.find(tax => tax.isDefault);
        const taxRate = defaultTax ? defaultTax.rate : 0;
        return calculatePrice(product, options, quantity, taxRate);
    } catch (error) {
        console.error("Failed to fetch default tax rate, calculating with 0% tax.", error);
        return calculatePrice(product, options, quantity, 0);
    }
}