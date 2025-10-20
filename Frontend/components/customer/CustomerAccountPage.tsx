import React, { useState, useMemo } from 'react';
import { Contact, Order } from '../../types';
import { useI18n } from '../../i18n';
import ProfileView from './ProfileView';
import OrderHistoryView from './OrderHistoryView';
import SecurityView from './SecurityView';
import IconArrowLeft from '../icons/IconArrowLeft';
import ECommerceFooter from '../ecommerce/ECommerceFooter';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, Navigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrdersByCustomer } from '../../services/apiE-commerce/apiOrders';
import { api } from '../../services/api';

type AccountView = 'profile' | 'orders' | 'security' | 'payment' | 'reviews';

const CustomerAccountPage: React.FC = () => {
  const { t } = useI18n();
  const { state } = useAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<AccountView>('profile');

  const { currentCustomer: contact } = state;

  // Récupérer les commandes avec TanStack Query
  const { data: allOrders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => getOrdersByCustomer(contact?.id || ''),
  });

  const orders = useMemo(() => {
    if (!contact || !allOrders) return [];
    return [...allOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allOrders]);

  const { mutate: onUpdateClient } = useMutation({
    mutationFn: (clientData: Contact) => api.patch(`/contacts/${clientData.id}`, clientData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }), // Invalider pour rafraîchir si nécessaire
  });

  if (!contact) {
    // Si aucun client n'est connecté, redirigez vers la page d'accueil.
    // La protection de route dans router.tsx est une meilleure pratique, mais ceci est une sécurité.
    return <Navigate to="/" />;
  }

  if (isLoadingOrders) {
    return <div>Chargement de l'historique des commandes...</div>;
  }

  const renderView = () => {
    switch(activeView) {
      case 'profile':
        return <ProfileView customer={contact} onUpdateClient={onUpdateClient} />;
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">{t('customerAccount.myAccount')}</h1>
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#c6e911] transition-colors">
            <IconArrowLeft className="h-6 w-6 text-slate-700" />
            <span>{t('customerAccount.backToShop')}</span>
          </Link>
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
      <ECommerceFooter realisationsPath="/realisations" onBackToShop={() => navigate({ to: '/' })} />
    </div>
  );
};

export default CustomerAccountPage;