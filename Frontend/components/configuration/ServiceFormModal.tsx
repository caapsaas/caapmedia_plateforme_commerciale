import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../../types/models';
import { ProductFormData } from '../../types/forms';
import { useI18n } from '../../i18n';
import { categoryToKeyMap, rangeToKeyMap } from '../../constants';
import { generateProductDescription } from '../../services/geminiService';
import IconSparkles from '../icons/IconSparkles';

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: ProductFormData & { id?: string }) => void;
    item: Product | null;
}

// Formulaire des informations générales d'un service du catalogue (Chantier 1) —
// les spécifications techniques (Chantier 5) se configurent séparément via le
// Builder, accessible depuis la liste des services une fois le service créé.
const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const { t } = useI18n();
    const [isGenerating, setIsGenerating] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);

    const initialFormState = useMemo((): ProductFormData => {
        const firstCategory = Object.keys(categoryToKeyMap)[0] || '';
        return {
            name: '',
            category: firstCategory,
            productRange: '',
            description: '',
            isActive: true,
            isVisibleOnSite: true,
            displayOrder: 0,
        };
    }, []);

    const [formData, setFormData] = useState<ProductFormData & { id?: string }>(initialFormState);

    useEffect(() => {
        if (item) {
            const { id, productImages, ...rest } = item;
            setFormData({ ...rest, id });
        } else {
            setFormData(initialFormState);
        }
        setDescriptionError(null);
    }, [item, isOpen, initialFormState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, productImages: e.target.files ? Array.from(e.target.files) : [] }));
    };

    const handleGenerateDescription = useCallback(async () => {
        if (!formData.name) return;
        setIsGenerating(true);
        setDescriptionError(null);
        try {
            const description = await generateProductDescription(formData.name);
            setFormData(prev => ({ ...prev, description }));
        } catch (error) {
            const errorMessageKey = error instanceof Error ? error.message : 'product.serviceUnavailable';
            setDescriptionError(t(errorMessageKey));
        } finally {
            setIsGenerating(false);
        }
    }, [formData.name, t]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: item?.id });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {item ? t('configuration.modal.editServiceTitle') : t('configuration.modal.addServiceTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('configuration.serviceForm.name')}</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">{t('configuration.serviceForm.category')}</label>
                                    <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.keys(categoryToKeyMap).map(cat => (
                                            <option key={cat} value={cat}>{t(categoryToKeyMap[cat])}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="productRange" className="block text-sm font-medium text-slate-700">{t('configuration.serviceForm.range')}</label>
                                    <select name="productRange" id="productRange" value={formData.productRange || ''} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        <option value="">{t('productRange.none')}</option>
                                        {Object.keys(rangeToKeyMap).map(rangeKey => (
                                            <option key={rangeKey} value={rangeKey}>{t(rangeToKeyMap[rangeKey])}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('configuration.serviceForm.description')}</label>
                                <div className="mt-1 relative">
                                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm pr-10"></textarea>
                                    <button
                                        type="button"
                                        onClick={handleGenerateDescription}
                                        disabled={isGenerating || !formData.name}
                                        className="absolute top-2 right-2 p-1 text-purple-600 hover:text-purple-800 rounded-full hover:bg-purple-100 disabled:opacity-50"
                                        title={t('configuration.serviceForm.generateWithAI')}
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
                            <div>
                                <label htmlFor="productImages" className="block text-sm font-medium text-slate-700">{t('configuration.serviceForm.images')}</label>
                                <input type="file" name="productImages" id="productImages" accept="image/*" multiple onChange={handleImagesChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#c6e911]/20 file:text-[#8a9e0c] hover:file:bg-[#c6e911]/30" />
                            </div>
                            <div>
                                <label htmlFor="displayOrder" className="block text-sm font-medium text-slate-700">{t('configuration.serviceForm.displayOrder')}</label>
                                <input type="number" name="displayOrder" id="displayOrder" value={formData.displayOrder ?? 0} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /> {t('configuration.serviceForm.isActive')}
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" name="isVisibleOnSite" checked={formData.isVisibleOnSite} onChange={handleChange} /> {t('configuration.serviceForm.isVisibleOnSite')}
                                </label>
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

export default ServiceFormModal;
