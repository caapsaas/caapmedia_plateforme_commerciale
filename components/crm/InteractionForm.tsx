

import React, { useState } from 'react';
import { Interaction, InteractionType } from '../../types';
import { useI18n } from '../../i18n';

interface InteractionFormProps {
    onSave: (data: { type: InteractionType; notes: string; }) => void;
}

const InteractionForm: React.FC<InteractionFormProps> = ({ onSave }) => {
    const { t } = useI18n();
    const [type, setType] = useState<InteractionType>(InteractionType.CALL);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes.trim()) return;
        onSave({ type, notes });
        setNotes('');
        setType(InteractionType.CALL);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-100 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">{t('crm.contacts.details.logInteraction')}</h4>
            <div className="space-y-3">
                 <select 
                    value={type} 
                    onChange={e => setType(e.target.value as InteractionType)}
                    className="w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                >
                    {Object.values(InteractionType).map(it => (
                        <option key={it} value={it}>{t(`crm.interactions.types.${it}`)}</option>
                    ))}
                </select>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={t('crm.interactions.form.notesPlaceholder')}
                    rows={3}
                    className="w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                />
                <div className="text-right">
                    <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        {t('crm.interactions.form.log')}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default InteractionForm;