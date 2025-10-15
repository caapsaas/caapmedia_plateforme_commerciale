
import React, { useState } from 'react';
import ProductManagement from '../components/configuration/ProductManagement';
import UserManagement from '../components/configuration/UserManagement';
import SupplierManagement from '../components/configuration/SupplierManagement';
import ClientManagement from '../components/configuration/ClientManagement'; // Importer ClientManagement
import { Subsidiary } from '../types';
import { useI18n } from '../i18n';
import TaxManagement from '../components/configuration/TaxManagement';

type ConfigView = 'products' | 'users' | 'suppliers' | 'taxes' | 'clients';

interface ConfigurationProps {
    subsidiary: Subsidiary;
}

const Configuration: React.FC<ConfigurationProps> = (props) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<ConfigView>('products');

    const renderActiveView = () => {
        const { subsidiary } = props;
        const commonProps = { subsidiary };
        
        switch (activeTab) {
            case 'products':
                return <ProductManagement />;
            case 'users':
                return <UserManagement />;
            case 'suppliers':
                return <SupplierManagement />;
            case 'clients':
                return <ClientManagement />;
            case 'taxes':
                return <TaxManagement />;
            default:
                return <ProductManagement />;
        }
    };

    const TabButton: React.FC<{ view: ConfigView; label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911] ${
                activeTab === view
                    ? 'bg-[#c6e911] text-slate-800 shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-slate-800">{t('configuration.title')}</h2>
                <div className="flex items-center space-x-2 p-1 bg-slate-200 rounded-lg">
                    <TabButton view="products" label={t('configuration.products')} />
                    <TabButton view="users" label={t('configuration.users')} />
                    <TabButton view="suppliers" label={t('configuration.suppliers')} />
                    <TabButton view="clients" label={t('configuration.clientManagement')} />
                    <TabButton view="taxes" label={t('configuration.taxes')} />
                </div>
            </div>
            
            <div className="printable-area">
                {renderActiveView()}
            </div>
        </div>
    );
};

export default Configuration;
