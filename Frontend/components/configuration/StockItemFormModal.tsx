import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StockItem } from '../../types/models';
import { StockItemFormData } from '../../types/forms';
import { useI18n } from '../../i18n';
import { PRODUCT_HIERARCHY, categoryToKeyMap, rangeToKeyMap } from '../../constants';
import { generateProductDescription } from '../../services/geminiService';
import { getUnits } from '../../services/apiPurchasing/apiUnits';
import { getPackagingUnits, addPackagingUnit, removePackagingUnit } from '../../services/apiPurchasing/apiStockItems';
import IconSparkles from '../icons/IconSparkles';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';

interface StockItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: StockItemFormData & { id?: string }) => void;
    item: StockItem | null;
}

// Unités d'emballage/achat (Chantier 2) — ne peuvent se gérer qu'une fois le
// produit créé (elles référencent son ID), donc affichées uniquement en édition.
const PackagingUnitsEditor: React.FC<{ itemId: string; baseUnitId?: string }> = ({ itemId, baseUnitId }) => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [unitId, setUnitId] = useState('');
    const [conversionFactor, setConversionFactor] = useState('');

    const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: getUnits });
    const { data: packagingUnits = [] } = useQuery({
        queryKey: ['packaging-units', itemId],
        queryFn: () => getPackagingUnits(itemId),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['packaging-units', itemId] });

    const addMutation = useMutation({
        mutationFn: () => addPackagingUnit(itemId, { unitId, conversionFactor: Number(conversionFactor) }),
        onSuccess: () => { invalidate(); setUnitId(''); setConversionFactor(''); },
    });
    const removeMutation = useMutation({ mutationFn: removePackagingUnit, onSuccess: invalidate });

    // Une unité déjà utilisée comme unité de base ou déjà configurée en emballage n'a pas à réapparaître.
    const usedUnitIds = new Set([baseUnitId, ...packagingUnits.map(pu => pu.unitId)]);
    const availableUnits = units.filter(u => !usedUnitIds.has(u.id));

    return (
        <div className="pt-3 border-t space-y-3">
            <h5 className="font-semibold text-sm text-slate-700">{t('configuration.form.packagingUnits')}</h5>
            <p className="text-xs text-slate-500">{t('configuration.form.packagingUnitsHelp')}</p>
            <div className="space-y-2">
                {packagingUnits.map(pu => (
                    <div key={pu.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-md px-3 py-2">
                        <span>1 {pu.unit.name} = {pu.conversionFactor} {units.find(u => u.id === baseUnitId)?.name ?? t('configuration.form.baseUnit')}</span>
                        <button type="button" onClick={() => removeMutation.mutate(pu.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full">
                            <IconDelete className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-12 gap-2 items-center">
                <select value={unitId} onChange={e => setUnitId(e.target.value)} className="col-span-5 border-slate-300 rounded-md shadow-sm py-1.5 px-2 border text-sm">
                    <option value="">{t('configuration.form.selectUnit')}</option>
                    {availableUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={conversionFactor}
                    onChange={e => setConversionFactor(e.target.value)}
                    placeholder={t('configuration.form.conversionFactor')}
                    className="col-span-5 border-slate-300 rounded-md shadow-sm py-1.5 px-2 border text-sm"
                />
                <button
                    type="button"
                    onClick={() => addMutation.mutate()}
                    disabled={!unitId || !conversionFactor}
                    className="col-span-2 flex items-center justify-center p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 disabled:opacity-50"
                >
                    <IconPlus className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

// Formulaire d'un produit de stock (matière première/consommable) — scopé filiale,
// distinct du catalogue de services (Chantier 1). Pas d'images ni d'options
// configurables : ces notions ne concernent que les services vendus au catalogue.
const StockItemFormModal: React.FC<StockItemFormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const { t } = useI18n();
    const [isGenerating, setIsGenerating] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: getUnits, enabled: isOpen });

    const subCategoryToMainCategoryMap = useMemo(() => {
        const map: Record<string, string> = {};
        PRODUCT_HIERARCHY.forEach(mainCat => {
            mainCat.subcategories.forEach(subCat => {
                map[subCat.name] = mainCat.category;
            });
        });
        return map;
    }, []);

    const initialFormState = useMemo((): StockItemFormData => {
        const firstCategory = Object.keys(categoryToKeyMap)[0] || '';
        return {
            name: '',
            category: firstCategory,
            productRange: '',
            description: '',
            stock: 0,
            warehouse: '',
            sku: '',
            minThreshold: undefined,
            stockManaged: true,
            mainSupplierId: undefined,
            baseUnitId: undefined,
        };
    }, []);

    const [formData, setFormData] = useState<StockItemFormData & { id?: string }>(initialFormState);

    useEffect(() => {
        if (item) {
            const { id, ...rest } = item;
            setFormData({ ...rest, id });
        } else {
            setFormData(initialFormState);
        }
        setDescriptionError(null);
    }, [item, isOpen, initialFormState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                            {item ? t('configuration.modal.editProductTitle') : t('configuration.modal.addProductTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('configuration.form.name')}</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">{t('configuration.form.category')}</label>
                                    <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.keys(categoryToKeyMap).map(cat => (
                                            <option key={cat} value={cat}>{t(categoryToKeyMap[cat])}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="productRange" className="block text-sm font-medium text-slate-700">{t('configuration.form.range')}</label>
                                    <select name="productRange" id="productRange" value={formData.productRange || ''} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
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
                                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm pr-10"></textarea>
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
                                    <label htmlFor="stock" className="block text-sm font-medium text-slate-700">{t('configuration.form.stock')}</label>
                                    <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="warehouse" className="block text-sm font-medium text-slate-700">{t('configuration.form.warehouse')}</label>
                                    <input type="text" name="warehouse" id="warehouse" value={formData.warehouse} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="sku" className="block text-sm font-medium text-slate-700">SKU</label>
                                <input type="text" name="sku" id="sku" value={formData.sku || ''} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="minThreshold" className="block text-sm font-medium text-slate-700">{t('configuration.form.minThreshold')}</label>
                                <input type="number" name="minThreshold" id="minThreshold" value={formData.minThreshold ?? ''} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="baseUnitId" className="block text-sm font-medium text-slate-700">{t('configuration.form.baseUnit')}</label>
                                <select name="baseUnitId" id="baseUnitId" value={formData.baseUnitId || ''} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    <option value="">{t('configuration.form.selectUnit')}</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            {item && (
                                <PackagingUnitsEditor itemId={item.id} baseUnitId={formData.baseUnitId} />
                            )}
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

export default StockItemFormModal;
