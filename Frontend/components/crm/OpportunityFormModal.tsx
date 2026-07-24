import React, { useState, useEffect } from 'react';
import { Opportunity, Contact, Product, OpportunityStage } from '../../types';
import { useI18n } from '../../i18n';

interface OpportunityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Opportunity, 'id' | 'subsidiaryId' | 'userId' | 'products'> & {
        opportunityName: string;
        contactId: string;
        accountId: string;
        opportunityValue: number;
        stage: OpportunityStage;
        closeDate: string;
        productIds: string[];
    }) => void;
    opportunity: Opportunity | null;
    clients: Contact[];
    products: Product[];
}

const OpportunityFormModal: React.FC<OpportunityFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    opportunity,
    clients,
    products
}) => {
    const { t } = useI18n();

    const initialFormState = {
        opportunityName: '',
        contactId: '',
        accountId: '',
        opportunityValue: 0,
        stage: OpportunityStage.QUALIFICATION,
        closeDate: new Date().toISOString().split('T')[0],
        productIds: [] as string[],
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (opportunity) {
            const { opportunityName, contactId, accountId, opportunityValue, stage, closeDate, products: oppProducts } = opportunity;
            setFormData({
                opportunityName,
                contactId,
                accountId,
                opportunityValue,
                stage,
                closeDate: closeDate ? closeDate.split('T')[0] : new Date().toISOString().split('T')[0],
                productIds: oppProducts?.map(p => p.id) || [],
            });
        } else {
            setFormData(initialFormState);
        }
    }, [opportunity, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'contactId') {
            const selectedClient = clients.find(c => c.id === value);
            const accountId = selectedClient?.accountId || '';
            
            // Afficher un avertissement si le contact n'a pas de compte associé
            if (value && !accountId) {
                console.warn('Le contact sélectionné n\'a pas de compte associé. Veuillez manuellement entrer un ID de compte.');
            }
            
            setFormData(prev => ({
                ...prev,
                contactId: value,
                accountId: accountId,
            }));
        } else {
            const numValue = name === 'opportunityValue' ? parseFloat(value) : value;
            setFormData(prev => ({ ...prev, [name]: numValue }));
        }
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, productIds: selectedIds }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation des champs requis
        if (!formData.contactId) {
            alert('Veuillez sélectionner un contact');
            return;
        }
        
        if (!formData.opportunityName.trim()) {
            alert('Veuillez saisir un nom pour l\'opportunité');
            return;
        }
        
        if (formData.opportunityValue <= 0) {
            alert('Veuillez saisir une valeur d\'opportunité supérieure à 0');
            return;
        }
        
        // L'accountId est automatiquement récupéré depuis le contact sélectionné
        // La filtration des contacts garantit qu'un accountId existe
        
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {opportunity
                                ? t('crm.opportunity.modal.editTitle')
                                : t('crm.opportunity.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="opportunityName" className="block text-sm font-medium text-slate-700">
                                    {t('crm.opportunity.form.name')}
                                </label>
                                <input
                                    type="text"
                                    name="opportunityName"
                                    id="opportunityName"
                                    value={formData.opportunityName}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                                />
                            </div>

                            <div>
                                <label htmlFor="contactId" className="block text-sm font-medium text-slate-700">
                                    {t('crm.opportunity.form.client')}
                                </label>
                                <select
                                    name="contactId"
                                    id="contactId"
                                    value={formData.contactId}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                                >
                                    <option value="" disabled>
                                        {t('crm.opportunity.form.selectClient')}
                                    </option>
                                    {clients.filter(c => c.accountId).map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.contactName} - {c.company}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    Seuls les contacts avec un compte associé sont affichés
                                </p>
                            </div>

                            <div>
                                <label htmlFor="opportunityValue" className="block text-sm font-medium text-slate-700">
                                    {t('crm.opportunity.form.value')}
                                </label>
                                <input
                                    type="number"
                                    name="opportunityValue"
                                    id="opportunityValue"
                                     value={formData.opportunityValue}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                                />
                            </div>

                            <div>
                                <label htmlFor="stage" className="block text-sm font-medium text-slate-700">
                                    {t('crm.opportunity.form.stage')}
                                </label>
                                <select
                                    name="stage"
                                    id="stage"
                                    value={formData.stage}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                                >
                                    {Object.values(OpportunityStage).map(s => (
                                        <option key={s} value={s}>
                                            {t(`crm.opportunity.stages.${s}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="products" className="block text-sm font-medium text-slate-700">
                                    {t('crm.opportunity.form.products')}
                                </label>
                                <select
                                    name="products"
                                    id="products"
                                    multiple
                                    value={formData.productIds}
                                    onChange={handleProductChange}
                                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border h-24 focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                                >
                                    <option value="" disabled>
                                        {t('crm.opportunity.form.selectProducts')}
                                    </option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="closeDate" className="block text-sm font-medium text-slate-700">
                                    {t('crm.opportunity.form.closeDate')}
                                </label>
                                <input
                                    type="date"
                                    name="closeDate"
                                    id="closeDate"
                                    value={formData.closeDate}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OpportunityFormModal;
