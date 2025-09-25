import React, { useState } from 'react';
import { Contact, Order, OrderStatus } from '../../types';
import { useI18n } from '../../i18n';
import ProfileView from './ProfileView';
import OrderHistoryView from './OrderHistoryView';
import SecurityView from './SecurityView';
import IconArrowLeft from '../icons/IconArrowLeft';
import ECommerceFooter from '../ecommerce/ECommerceFooter';

interface CustomerAccountPageProps {
  customer: Contact;
  orders: Order[];
  onBackToShop: () => void;
  onUpdateClient: (clientData: Contact) => void;
  onNavigateToRealisations: () => void;
}

type AccountView = 'profile' | 'orders' | 'security' | 'payment' | 'reviews';

const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({ customer, orders, onBackToShop, onUpdateClient, onNavigateToRealisations }) => {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState<AccountView>('profile');

  const renderView = () => {
    switch(activeView) {
      case 'profile':
        return <ProfileView customer={customer} onUpdateClient={onUpdateClient} />;
      case 'orders':
        return <OrderHistoryView orders={orders} />;
      case 'security':
        return <SecurityView />;
      default:
        return <p>{t('analytics.comingSoon')}</p>;
    }
  };

  const NavItem: React.FC<{ view: AccountView, labelKey: string }> = ({ view, labelKey }) => (
    <button 
      onClick={() => setActiveView(view)}
      className={`text-left w-full p-3 rounded-md transition-colors ${activeView === view ? 'bg-[#c6e911] text-slate-800' : 'hover:bg-slate-100'}`}
    >
      {t(labelKey)}
    </button>
  );

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBackToShop} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <IconArrowLeft className="h-6 w-6 text-slate-700" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">{t('customerAccount.myAccount')}</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <nav className="space-y-2">
                <NavItem view="profile" labelKey="customerAccount.profile" />
                <NavItem view="orders" labelKey="customerAccount.myOrders" />
                <NavItem view="security" labelKey="customerAccount.security" />
                <NavItem view="payment" labelKey="customerAccount.paymentMethods" />
                <NavItem view="reviews" labelKey="customerAccount.myReviews" />
              </nav>
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="bg-white p-6 rounded-lg shadow-md">
              {renderView()}
            </div>
          </div>
        </div>
      </main>
      <ECommerceFooter onNavigateToRealisations={onNavigateToRealisations} onBackToShop={onBackToShop} />
    </div>
  );
};

export default CustomerAccountPage;