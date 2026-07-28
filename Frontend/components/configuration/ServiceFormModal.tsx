import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ProductImage } from '../../types/models';
import { ProductFormData } from '../../types/forms';
import { useI18n } from '../../i18n';
import { categoryToKeyMap, rangeToKeyMap } from '../../constants';
import { generateProductDescription } from '../../services/geminiService';
import { getImageUrl } from '../../utils/imageUtils';
import IconSparkles from '../icons/IconSparkles';
import IconUpload from '../icons/IconUpload';
import IconX from '../icons/IconX';

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: ProductFormData & { id?: string }) => void;
    item: Product | null;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

type ImageSlot =
    | { kind: 'existing'; image: ProductImage }
    | { kind: 'new'; file: File; previewUrl: string }
    | null;

const emptySlots = (): ImageSlot[] => Array(MAX_IMAGES).fill(null);

// Formulaire des informations générales d'un service du catalogue (Chantier 1) —
// les spécifications techniques (Chantier 5) se configurent séparément via le
// Builder, accessible depuis la liste des services une fois le service créé.
const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const { t } = useI18n();
    const [isGenerating, setIsGenerating] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const [imageSlots, setImageSlots] = useState<ImageSlot[]>(emptySlots());
    const [imageError, setImageError] = useState<string | null>(null);
    const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);

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
            const slots = emptySlots();
            (productImages || []).slice(0, MAX_IMAGES).forEach((image, index) => {
                slots[index] = { kind: 'existing', image };
            });
            setImageSlots(slots);
        } else {
            setFormData(initialFormState);
            setImageSlots(emptySlots());
        }
        setDescriptionError(null);
        setImageError(null);
    }, [item, isOpen, initialFormState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageSlotChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_IMAGE_SIZE) {
            setImageError(t('configuration.serviceForm.imageTooLarge'));
            return;
        }
        setImageError(null);

        setImageSlots(prev => {
            const next = [...prev];
            const previousSlot = next[index];
            if (previousSlot?.kind === 'new') URL.revokeObjectURL(previousSlot.previewUrl);
            next[index] = { kind: 'new', file, previewUrl: URL.createObjectURL(file) };
            return next;
        });
    };

    const handleRemoveImageSlot = (index: number) => {
        setImageSlots(prev => {
            const next = [...prev];
            const slot = next[index];
            if (slot?.kind === 'new') URL.revokeObjectURL(slot.previewUrl);
            next[index] = null;
            return next;
        });
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
        const existingImages = imageSlots
            .filter((slot): slot is Extract<ImageSlot, { kind: 'existing' }> => slot?.kind === 'existing')
            .map(slot => slot.image.imageUrl);
        const productImages = imageSlots
            .filter((slot): slot is Extract<ImageSlot, { kind: 'new' }> => slot?.kind === 'new')
            .map(slot => slot.file);

        onSave({ ...formData, id: item?.id, productImages, existingImages });
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
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    {t('configuration.serviceForm.images')} <span className="text-xs text-slate-500 ml-1">({t('configuration.serviceForm.maxImages', { count: MAX_IMAGES })})</span>
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                    {imageSlots.map((slot, index) => (
                                        <div
                                            key={index}
                                            className="relative group"
                                            onMouseEnter={() => setHoveredImageIndex(index)}
                                            onMouseLeave={() => setHoveredImageIndex(null)}
                                        >
                                            {slot ? (
                                                <div className="relative">
                                                    <img
                                                        src={slot.kind === 'existing' ? getImageUrl(slot.image.imageUrl) : slot.previewUrl}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full aspect-square object-cover rounded-xl border-2 border-slate-200 group-hover:border-[#c6e911] transition-all duration-200 shadow-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImageSlot(index)}
                                                        className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg transition-all duration-200 ${hoveredImageIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                                                        title={t('configuration.serviceForm.removeImage')}
                                                    >
                                                        <IconX className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label
                                                    htmlFor={`image-slot-${index}`}
                                                    className="cursor-pointer w-full aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-[#c6e911] hover:bg-[#c6e911]/10 transition-all duration-200 group"
                                                >
                                                    <IconUpload className="h-5 w-5 text-slate-400 group-hover:text-[#8a9e0c] transition-colors" />
                                                    <span className="text-[11px] text-slate-400 group-hover:text-[#8a9e0c] transition-colors">{index + 1}/{MAX_IMAGES}</span>
                                                    <input
                                                        id={`image-slot-${index}`}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={e => handleImageSlotChange(index, e)}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {imageError && <p className="mt-2 text-sm text-red-600">{imageError}</p>}
                                <p className="text-xs text-slate-400 mt-2">{t('configuration.serviceForm.acceptedFormats')}</p>
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
