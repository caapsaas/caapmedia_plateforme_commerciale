import React from 'react';

// The interface is kept for type-checking purposes where the component is imported.
interface CategoryShowcaseProps {
    productHierarchy: { category: string; slug: string; subcategories: { name: string; slug: string }[] }[];
    onSelectMainCategory: (category: string) => void;
    onSelectSubcategory: (mainCategory: string, subcategory: string) => void;
}

const CategoryShowcase: React.FC<CategoryShowcaseProps> = () => {
    // This component is intentionally left blank to remove the category cards
    // from the UI, as requested by the user to create more space for products.
    // Category navigation is still available via the main header menu.
    return null;
};

export default CategoryShowcase;
