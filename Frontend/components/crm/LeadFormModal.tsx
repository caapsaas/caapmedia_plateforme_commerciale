import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../../types';
import { useI18n } from '../../i18n';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Lead, 'id' | 'subsidiaryId'>) => void;
    lead: Lead | null;
}

const optionalLeadFields: { key: keyof Lead; label: string; multiline?: boolean }[] = [
    { key: 'externalReference', label: 'ID du prospect' },
    { key: 'zone', label: 'Zone' },
    { key: 'cityArea', label: 'Ville / quartier' },
    { key: 'sector', label: 'Secteur' },
    { key: 'caapOffer', label: 'Offre CaapMedia' },
    { key: 'yearEndNeed', label: 'Besoin de fin d’année (hypothèse)', multiline: true },
    { key: 'requestedService', label: 'Service à demander' },
    { key: 'score', label: 'Score /100' },
    { key: 'commercialPriority', label: 'Priorité' },
    { key: 'verification', label: 'Vérification' },
    { key: 'nextAction', label: 'Prochaine action', multiline: true },
    { key: 'commercialStatus', label: 'Statut commercial' },
    { key: 'responsibleName', label: 'Responsable' },
    { key: 'contactDate', label: 'Date de contact' },
    { key: 'followUpDate', label: 'Date de relance' },
    { key: 'followUpNotes', label: 'Notes de suivi', multiline: true },
    { key: 'whatsappConfirmed', label: 'WhatsApp confirmé' },
    { key: 'observedFact', label: 'Fait public observé', multiline: true },
    { key: 'locationSource', label: 'Source implantation', multiline: true },
    { key: 'contactSource', label: 'Source contact', multiline: true },
    { key: 'signalDate', label: 'Date événement / signal' },
    { key: 'signalSource', label: 'Source signal', multiline: true },
    { key: 'documentaryConfidence', label: 'Confiance documentaire' },
    { key: 'fitScore', label: 'Adéquation /30' },
    { key: 'recentSignalScore', label: 'Signal récent /20' },
    { key: 'recurrenceScore', label: 'Récurrence /20' },
    { key: 'accessibilityScore', label: 'Accessibilité /20' },
    { key: 'feasibilityScore', label: 'Faisabilité /10' },
    { key: 'caapOfferSource', label: 'Source offre CaapMedia', multiline: true },
    { key: 'consultationDate', label: 'Consultation' },
    { key: 'country', label: 'Pays' },
    { key: 'prospectType', label: 'Type de prospect' },
    { key: 'officialWebsite', label: 'Site officiel' },
    { key: 'reservesLogistics', label: 'Réserves et logistique', multiline: true },
    { key: 'linkedinPublic', label: 'LinkedIn public' },
    { key: 'preparedMessage', label: 'Message préparé', multiline: true },
];

const LeadFormModal: React.FC<LeadFormModalProps> = ({ isOpen, onClose, onSave, lead }) => {
    const { t } = useI18n();
    const initialFormState: Omit<Lead, 'id' | 'subsidiaryId'> = {
        leadName: '',
        company: '',
        email: '',
        phone: '',
        status: LeadStatus.NEW,
        description: '',
    };
    
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (lead) {
            const { id, subsidiaryId, ...editableData } = lead;
            setFormData({
                ...initialFormState,
                leadName: editableData.leadName,
                company: editableData.company,
                email: editableData.email ?? '',
                phone: editableData.phone ?? '',
                status: editableData.status,
                description: editableData.description || '',
                ...editableData,
            });
        } else {
            setFormData(initialFormState);
        }
    }, [lead, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            email: formData.email?.trim() || null,
            phone: formData.phone?.trim() || null,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 modal-backdrop z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {lead ? t('crm.leads.modal.editTitle') : t('crm.leads.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="leadName" className="block text-sm font-medium text-slate-700">{t('crm.leads.name')} <span className="text-red-600" aria-label="obligatoire">*</span></label>
                                <input type="text" name="leadName" id="leadName" value={formData.leadName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-slate-700">{t('crm.leads.company')} <span className="text-red-600" aria-label="obligatoire">*</span></label>
                                <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('crm.leads.email')}</label>
                                <input type="email" name="email" id="email" value={formData.email ?? ''} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t('crm.leads.phone')}</label>
                                <input type="tel" name="phone" id="phone" value={formData.phone ?? ''} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                             <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('configuration.form.description')}</label>
                                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"></textarea>
                            </div>
                             <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('crm.leads.status')} <span className="text-red-600" aria-label="obligatoire">*</span></label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{t(`crm.leads.status_${s}`)}</option>)}
                                </select>
                            </div>
                            <div className="border-t border-slate-200 pt-4">
                                <h4 className="text-sm font-semibold text-slate-800 mb-3">Informations complémentaires (facultatives)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {optionalLeadFields.map(field => (
                                        <div key={field.key} className={field.multiline ? 'sm:col-span-2' : ''}>
                                            <label htmlFor={String(field.key)} className="block text-sm font-medium text-slate-700">{field.label}</label>
                                            {field.multiline ? (
                                                <textarea name={String(field.key)} id={String(field.key)} value={String(formData[field.key] || '')} onChange={handleChange} rows={2} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                            ) : (
                                                <input type="text" name={String(field.key)} id={String(field.key)} value={String(formData[field.key] || '')} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                            )}
                                        </div>
                                    ))}
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

export default LeadFormModal;
