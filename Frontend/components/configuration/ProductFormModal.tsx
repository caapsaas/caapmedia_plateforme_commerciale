import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ConfigurableOptionItem, ProductImage } from '../../types/models';
import { ProductFormData, OptionType } from '../../types/forms';
import { useI18n } from '../../i18n';
import { PRODUCT_HIERARCHY, categoryToKeyMap, rangeToKeyMap } from '../../constants';
import { generateProductDescription } from '../../services/geminiService';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';
import IconSparkles from '../icons/IconSparkles';
import { getImageUrl } from '../../utils/imageUtils';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: ProductFormData & { id?: string }) => void;
    product: Product | null;
}

// Type pour l'état local du formulaire, plus facile à manipuler
type FormOptionsState = {
    [key in OptionType]?: { optionName: string; multiplier: string | number }[];
};


const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, product }) => {
    const { t } = useI18n();
    const [isGenerating, setIsGenerating] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<ProductImage[]>([]);

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
            productName: '',
            mainCategory: firstMainCategory,
            category: firstCategory,
            productRange: '',
            description: '',
            stock: 0,
            price: 0,
            sellingPrice: 0,
            warehouse: '',
            // Initialisation pour ProductFormData
            productImages: [],
            configurableOptions: [],
        };
    }, [subCategoryToMainCategoryMap]);

    const [formData, setFormData] = useState<ProductFormData & { id?: string }>(initialFormState);
    const [formOptions, setFormOptions] = useState<FormOptionsState>({});

    useEffect(() => {
        if (product) {
            // Convertir le type Product en ProductFormData pour l'édition
            const { productImages, configurableOptions, ...rest } = product;
            setFormData({ ...rest, productImages: [], configurableOptions: [] });
            setExistingImages(productImages || []);
            // Pré-remplir l'état du formulaire des options à partir de l'objet configurableOptions
            const optionsState = configurableOptions ? Object.entries(configurableOptions).reduce((acc: FormOptionsState, [optionType, items]: [string, ConfigurableOptionItem[]]) => {
                acc[optionType as OptionType] = items.map(item => ({
                    optionName: item.optionName,
                    multiplier: item.multiplier
                }));
                return acc;
            }, {}) : {};
            setFormOptions(optionsState);
            setSelectedFiles([]);
        } else {
            setFormData(initialFormState);
            setFormOptions({});
            setExistingImages([]);
            setSelectedFiles([]);
        }
        setDescriptionError(null);
    }, [product, isOpen, initialFormState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'category') {
            setFormData(prev => ({
                ...prev,
                category: value,
                mainCategory: subCategoryToMainCategoryMap[value] || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        setSelectedFiles(files);
    };

    const handleAddOptionItem = (optionType: OptionType) => {
        setFormOptions(prev => ({
            ...prev,
            [optionType]: [...(prev[optionType] || []), { optionName: '', multiplier: 1 }]
        }));
    };

    const handleOptionItemChange = (optionType: OptionType, index: number, field: 'optionName' | 'multiplier', value: string) => {
        setFormOptions(prev => {
            const items = [...(prev[optionType] || [])];
            items[index] = { ...items[index], [field]: value };
            return { ...prev, [optionType]: items };
        });
    };

    const handleRemoveOptionItem = (optionType: OptionType, index: number) => {
        setFormOptions(prev => ({
            ...prev,
            [optionType]: (prev[optionType] || []).filter((_, i) => i !== index)
        }));
    };

    // Convertir l'état du formulaire des options en structure plate pour l'API
    const flattenOptionsForSave = (options: FormOptionsState): ProductFormData['configurableOptions'] => {
        return Object.entries(options).flatMap(([optionType, items]) =>
            items?.map(item => ({
                optionType: optionType as OptionType,
                item: {
                    optionName: item.optionName,
                    multiplier: Number(item.multiplier) || 1
                }
            })) || []
        );
    };

    const handleGenerateDescription = useCallback(async () => {
        if (!formData.productName) return;
        setIsGenerating(true);
        setDescriptionError(null);
        try {
            const description = await generateProductDescription(formData.productName);
            setFormData(prev => ({ ...prev, description }));
        } catch (error) {
            console.error("Failed to generate description:", error);
            const errorMessageKey = error instanceof Error ? error.message : 'product.serviceUnavailable';
            setDescriptionError(t(errorMessageKey));
        } finally {
            setIsGenerating(false);
        }
    }, [formData.productName, t]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalConfigurableOptions = flattenOptionsForSave(formOptions);
        onSave({
            ...formData,
            id: product?.id,
            configurableOptions: finalConfigurableOptions,
            productImages: selectedFiles,
        });
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
                                <label htmlFor="productName" className="block text-sm font-medium text-slate-700">{t('configuration.form.name')}</label>
                                <input type="text" name="productName" id="productName" value={formData.productName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
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
                                    <label htmlFor="productRange" className="block text-sm font-medium text-slate-700">{t('configuration.form.range')}</label>
                                    <select name="productRange" id="productRange" value={formData.productRange || ''} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
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
                                        disabled={isGenerating || !formData.productName}
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
                            {/* Champ pour les images */}
                            <div>
                                <label htmlFor="productImages" className="block text-sm font-medium text-slate-700">{t('configuration.form.uploadFile')}</label>
                                <input
                                    type="file"
                                    name="productImages"
                                    id="productImages"
                                    multiple
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#c6e911]/20 file:text-[#8a9e0c] hover:file:bg-[#c6e911]/30"
                                />
                                {selectedFiles.length > 0 && <p className="text-xs text-slate-500 mt-1">{selectedFiles.length} fichier(s) sélectionné(s)</p>}
                                
                                {/* Affichage des images existantes */}
                                {existingImages.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-slate-700 mb-2">Images actuelles</p>
                                        <div className="flex flex-wrap gap-2">
                                            {existingImages.map(image => (
                                                <div key={image.id} className="relative">
                                                    <img src={getImageUrl(image.imageUrl)} alt={image.imageName} className="h-20 w-20 object-cover rounded-md border border-slate-200" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Section pour les options configurables */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">Options Configurables</label>
                                {Object.values(OptionType).map(optionType => (
                                    <div key={optionType} className="p-3 border border-slate-200 rounded-md">
                                        <h4 className="font-semibold text-sm text-slate-600 mb-2">{t(`calculator.${optionType.toLowerCase()}`)}</h4>
                                        <div className="space-y-2">
                                            {formOptions[optionType]?.map((item, index) => (
                                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                                    <div className="col-span-6">
                                                        <input type="text" placeholder={t('configuration.form.name')} value={item.optionName} onChange={(e) => handleOptionItemChange(optionType, index, 'optionName', e.target.value)} className="w-full border-slate-300 rounded-md shadow-sm text-sm" />
                                                    </div>
                                                    <div className="col-span-5">
                                                        <input type="number" step="0.01" placeholder="Multiplicateur" value={String(item.multiplier)} onChange={(e) => handleOptionItemChange(optionType, index, 'multiplier', e.target.value)} className="w-full border-slate-300 rounded-md shadow-sm text-sm" />
                                                    </div>
                                                    <div className="col-span-1 text-right">
                                                        <button type="button" onClick={() => handleRemoveOptionItem(optionType, index)} className="p-1 text-red-500 hover:bg-red-100 rounded-full">
                                                            <IconDelete className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => handleAddOptionItem(optionType)}
                                                className="flex items-center space-x-1 px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                                            >
                                                <IconPlus className="h-3 w-3" />
                                                <span>Ajouter</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
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
