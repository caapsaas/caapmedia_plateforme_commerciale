import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../../types';
import { useI18n } from '../../i18n';
import { PRODUCT_HIERARCHY, categoryToKeyMap, rangeToKeyMap } from '../../constants';
import { generateProductDescription } from '../../services/geminiService';
import IconSparkles from '../icons/IconSparkles';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Omit<Product, 'id' | 'subsidiaryId' | 'imageUrls'> & { id?: string }) => void;
    product: Product | null;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, product }) => {
    const { t } = useI18n();
    const [isGenerating, setIsGenerating] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);

    const subCategoryToMainCategoryMap = useMemo(() => {
        const map: Record<string, string> = {};
        PRODUCT_HIERARCHY.forEach(mainCat => {
            mainCat.subcategories.forEach(subCat => {
                map[subCat.name] = mainCat.category;
            });
        });
        return map;
    }, []);

    const initialFormState = useMemo(() => {
        const firstCategory = Object.keys(categoryToKeyMap)[0] || '';
        const firstMainCategory = subCategoryToMainCategoryMap[firstCategory] || '';
        return {
            name: '',
            mainCategory: firstMainCategory,
            category: firstCategory,
            range: '',
            description: '',
            stock: 0,
            price: 0,
            sellingPrice: 0,
            warehouse: ''
        };
    }, [subCategoryToMainCategoryMap]);
    
    const [formData, setFormData] = useState<Omit<Product, 'id' | 'subsidiaryId' | 'imageUrls' | 'configurableOptions'>>(initialFormState);

    useEffect(() => {
        if (product) {
            const { id, subsidiaryId, imageUrls, configurableOptions, ...editableData } = product;
            setFormData(editableData);
        } else {
            setFormData(initialFormState);
        }
        setDescriptionError(null);
    }, [product, isOpen, initialFormState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numValue = (name === 'stock' || name === 'price' || name === 'sellingPrice') ? (parseFloat(value) || 0) : value;

        if (name === 'category') {
             setFormData(prev => ({ 
                 ...prev, 
                 category: value, 
                 mainCategory: subCategoryToMainCategoryMap[value] || '' 
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: numValue }));
        }
    };

    const handleGenerateDescription = useCallback(async () => {
        if (!formData.name) return;
        setIsGenerating(true);
        setDescriptionError(null);
        try {
            const description = await generateProductDescription(formData.name);
            setFormData(prev => ({ ...prev, description }));
        } catch (error) {
            console.error("Failed to generate description:", error);
            const errorMessageKey = error instanceof Error ? error.message : 'product.serviceUnavailable';
            setDescriptionError(t(errorMessageKey));
        } finally {
            setIsGenerating(false);
        }
    }, [formData.name, t]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: product?.id, ...formData });
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {product ? t('configuration.modal.editProductTitle') : t('configuration.modal.addProductTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Form fields */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('configuration.form.name')}</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">{t('configuration.form.category')}</label>
                                    <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.keys(categoryToKeyMap).map(cat => (
                                            <option key={cat} value={cat}>{t(categoryToKeyMap[cat])}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="range" className="block text-sm font-medium text-slate-700">{t('configuration.form.range')}</label>
                                    <select name="range" id="range" value={formData.range || ''} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        <option value="">{t('productRange.none')}</option>
                                        {Object.keys(rangeToKeyMap).map(rangeKey => (
                                            <option key={rangeKey} value={rangeKey}>{t(rangeToKeyMap[rangeKey])}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('configuration.form.description')}</label>
                                <div className="mt-1 relative">
                                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm pr-10"></textarea>
                                    <button 
                                      type="button" 
                                      onClick={handleGenerateDescription}
                                      disabled={isGenerating || !formData.name}
                                      className="absolute top-2 right-2 p-1 text-purple-600 hover:text-purple-800 rounded-full hover:bg-purple-100 disabled:opacity-50"
                                      title={t('configuration.form.generateWithAI')}
                                    >
                                      {isGenerating ? (
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                      ) : (
                                        <IconSparkles className="h-5 w-5" />
                                      )}
                                    </button>
                                </div>
                                {descriptionError && <p className="mt-1 text-sm text-red-600">{descriptionError}</p>}
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-slate-700">{t('configuration.form.costPrice')}</label>
                                    <input type="number" step="0.01" name="price" id="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="sellingPrice" className="block text-sm font-medium text-slate-700">{t('configuration.form.sellingPrice')}</label>
                                    <input type="number" step="0.01" name="sellingPrice" id="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="stock" className="block text-sm font-medium text-slate-700">{t('configuration.form.stock')}</label>
                                    <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="warehouse" className="block text-sm font-medium text-slate-700">{t('configuration.form.warehouse')}</label>
                                    <input type="text" name="warehouse" id="warehouse" value={formData.warehouse} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormModal;
