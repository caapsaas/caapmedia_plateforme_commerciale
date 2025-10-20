import { Product, ProductOptions } from '../types';

// Degressive pricing table: [quantity, discount percentage]
const degressivePricing = [
    { threshold: 100, discount: 0.05 },
    { threshold: 250, discount: 0.10 },
    { threshold: 500, discount: 0.15 },
    { threshold: 1000, discount: 0.20 },
];

export function calculatePrice(
    product: Product, 
    options: Partial<ProductOptions>, 
    quantity: number
): { unitPrice: number; totalPrice: number } {
    if (quantity <= 0) {
        return { unitPrice: product.sellingPrice, totalPrice: 0 };
    }

    let basePrice = product.sellingPrice;
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
                const multiplier = opt.items.find(i => i.optionName === selectedValue)?.multiplier || 1;
                basePrice *= multiplier;
            }
        }
    }
    
    const unitPriceWithOptions = basePrice;

    // Apply degressive pricing
    let discount = 0;
    for (const tier of degressivePricing) {
        if (quantity >= tier.threshold) {
            discount = tier.discount;
        }
    }

    const degressiveUnitPrice = unitPriceWithOptions * (1 - discount);
    const totalPrice = degressiveUnitPrice * quantity;

    return { unitPrice: degressiveUnitPrice, totalPrice };
}