import React, { useState } from 'react';
import ProductManagement from '../components/configuration/ProductManagement';
import UnitsManagement from '../components/configuration/UnitsManagement';
import ServicesCatalogManagement from '../components/configuration/ServicesCatalogManagement';
import SpecReferenceListsManagement from '../components/configuration/SpecReferenceListsManagement';
import UserManagement from '../components/configuration/UserManagement';
import SupplierManagement from '../components/configuration/SupplierManagement';
import ClientManagement from '../components/configuration/ClientManagement';
import TaxManagement from '../components/configuration/TaxManagement';
import TreasuryAccountManagement from '../components/configuration/TreasuryAccountManagement';
import EquipmentCostManagement from '../components/configuration/EquipmentCostManagement';
import CommercialParamsManagement from '../components/configuration/CommercialParamsManagement';
import ProductionWorkflowManagement from '../components/configuration/ProductionWorkflowManagement';
import PayrollScaleManagement from '../components/configuration/PayrollScaleManagement';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

type ConfigGroup = 'catalogue' | 'users' | 'suppliers' | 'clients' | 'taxes' | 'treasury' | 'production' | 'payroll';
type CatalogueSub = 'products' | 'units' | 'services' | 'referenceLists';
type ProductionSub = 'equipmentCosts' | 'commercialParams' | 'productionWorkflows';

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none whitespace-nowrap flex-shrink-0 ${
            isActive ? 'bg-[#c6e911] text-slate-800 shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
        }`}
    >
        {label}
    </button>
);

const SubTabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors duration-150 focus:outline-none whitespace-nowrap flex-shrink-0 ${
            isActive ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
        }`}
    >
        {label}
    </button>
);

const Configuration: React.FC = () => {
    const { t } = useI18n();
    const { subsidiary, user } = useAuth();
    const [activeGroup, setActiveGroup] = useState<ConfigGroup>('catalogue');
    const [catalogueSub, setCatalogueSub] = useState<CatalogueSub>('products');
    const [productionSub, setProductionSub] = useState<ProductionSub>('equipmentCosts');

    const activeRole = user?.activeRole ?? user?.userRole;
    const isSuperAdmin = activeRole === UserRole.SUPER_ADMIN;

    const renderActiveView = () => {
        if (!subsidiary) return <div>{t('common.loading')}</div>;

        switch (activeGroup) {
            case 'catalogue':
                switch (catalogueSub) {
                    case 'products':      return <ProductManagement />;
                    case 'units':         return <UnitsManagement />;
                    case 'services':      return <ServicesCatalogManagement />;
                    case 'referenceLists':return <SpecReferenceListsManagement />;
                }
                break;
            case 'users':     return <UserManagement />;
            case 'suppliers': return <SupplierManagement />;
            case 'clients':   return <ClientManagement />;
            case 'taxes':     return <TaxManagement />;
            case 'treasury':  return <TreasuryAccountManagement subsidiary={subsidiary} />;
            case 'payroll':   return <PayrollScaleManagement />;
            case 'production':
                switch (productionSub) {
                    case 'equipmentCosts':      return <EquipmentCostManagement />;
                    case 'commercialParams':    return <CommercialParamsManagement />;
                    case 'productionWorkflows': return <ProductionWorkflowManagement />;
                }
                break;
        }
    };

    const group = (g: ConfigGroup) => ({
        isActive: activeGroup === g,
        onClick: () => setActiveGroup(g),
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 flex-shrink-0">
                    {t('configuration.title')}
                </h2>

                {/* Barre principale */}
                <div className="w-full sm:w-auto max-w-full overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 p-1.5 bg-slate-100 rounded-lg">
                        <div className="flex gap-1 min-w-max">
                            <TabButton label={t('configuration.catalogue')}      {...group('catalogue')} />
                            <TabButton label={t('configuration.users')}          {...group('users')} />
                            <TabButton label={t('configuration.suppliers')}      {...group('suppliers')} />
                            <TabButton label={t('configuration.clientManagement')}{...group('clients')} />
                            <TabButton label={t('configuration.taxes')}          {...group('taxes')} />
                            <TabButton label={t('configuration.treasury')}       {...group('treasury')} />
                            <TabButton label={t('hr.payroll.title')}             {...group('payroll')} />
                            {isSuperAdmin && (
                                <>
                                    <div className="w-px bg-slate-300 mx-1 self-stretch" />
                                    <TabButton label={t('configuration.production')} {...group('production')} />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Barre de sous-onglets Catalogue */}
            {activeGroup === 'catalogue' && (
                <div className="overflow-x-auto scrollbar-thin p-1 bg-slate-50 rounded-lg border border-slate-200 no-print">
                    <div className="flex gap-1 min-w-max">
                        <SubTabButton label={t('configuration.products')}      isActive={catalogueSub === 'products'}      onClick={() => setCatalogueSub('products')} />
                        <SubTabButton label={t('configuration.units')}         isActive={catalogueSub === 'units'}          onClick={() => setCatalogueSub('units')} />
                        <SubTabButton label={t('configuration.services')}      isActive={catalogueSub === 'services'}       onClick={() => setCatalogueSub('services')} />
                        <SubTabButton label={t('configuration.referenceLists')} isActive={catalogueSub === 'referenceLists'} onClick={() => setCatalogueSub('referenceLists')} />
                    </div>
                </div>
            )}

            {/* Barre de sous-onglets Production */}
            {activeGroup === 'production' && isSuperAdmin && (
                <div className="overflow-x-auto scrollbar-thin p-1 bg-slate-50 rounded-lg border border-slate-200 no-print">
                    <div className="flex gap-1 min-w-max">
                        <SubTabButton label={t('configuration.equipmentCosts')}      isActive={productionSub === 'equipmentCosts'}      onClick={() => setProductionSub('equipmentCosts')} />
                        <SubTabButton label={t('configuration.commercialParams')}    isActive={productionSub === 'commercialParams'}    onClick={() => setProductionSub('commercialParams')} />
                        <SubTabButton label={t('configuration.productionWorkflows')} isActive={productionSub === 'productionWorkflows'} onClick={() => setProductionSub('productionWorkflows')} />
                    </div>
                </div>
            )}

            <div className="printable-area">
                {renderActiveView()}
            </div>
        </div>
    );
};

export default Configuration;
