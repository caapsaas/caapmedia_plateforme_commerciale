import React from 'react';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import CreditManagement from '../components/finance/CreditManagement';

// Page autonome "Créances Clients" — même composant que l'onglet 'credit' de
// Finance.tsx (réutilisation, comme gmo DebtsHistory), exposée en plus comme
// entrée de sidebar à part entière.
const CreditHistoryPage: React.FC = () => {
    const { t } = useI18n();
    const { subsidiary } = useAuth();

    if (!subsidiary) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-slate-800">{t('sidebar.creditHistory')}</h1>
            <CreditManagement subsidiary={subsidiary} />
        </div>
    );
};

export default CreditHistoryPage;
