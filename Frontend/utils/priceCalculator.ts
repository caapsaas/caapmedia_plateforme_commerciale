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
            { key: 'format', items: config.formats },
            { key: 'grammage', items: config.grammages },
            { key: 'printSide', items: config.printSides },
            { key: 'lamination', items: config.laminations },
            { key: 'size', items: config.sizes },
            { key: 'color', items: config.colors },
            { key: 'material', items: config.materials },
            { key: 'dimension', items: config.dimensions },
            { key: 'binding', items: config.bindings },
            { key: 'folding', items: config.foldings },
            { key: 'corner', items: config.corners },
            { key: 'eyelet', items: config.eyelets },
            { key: 'page', items: config.pages },
            { key: 'handle', items: config.handles },
            { key: 'stub', items: config.stub },
            { key: 'numbering', items: config.numbering },
        ];

        for (const opt of allOptions) {
            const selectedValue = (options as any)[opt.key];
            if (selectedValue && opt.items) {
                const multiplier = opt.items.find(i => i.name === selectedValue)?.multiplier || 1;
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