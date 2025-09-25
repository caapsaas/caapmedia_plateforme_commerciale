

import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Analytics from './components/Analytics';
// FIX: Update import path for Sales component to resolve ambiguity and fix build error.
import Sales from './components/sales/Sales';
import Stock from './components/Stock';
import AiMarketing from './components/AiMarketing';
import Caisse from './components/Caisse';
import MesCommandes from './components/MesCommandes';
import Finance from './components/Finance';
import Configuration from './components/Configuration';
import HrManagement from './components/HrManagement';
import { View, AppMode, Order, Product, Contact, User, Supplier, PurchaseOrder, SupplierDebt, FinancialTransaction, ExpenseRecord, Opportunity, Interaction, CrmTask, Lead, Account, Contract, OpportunityStage, InteractionType, OrderItem, OrderStatus, CrmTaskStatus, TaxRate } from './types';
import LoginPage from './LoginPage';
import Secretariat from './components/Secretariat';
import Purchasing from './components/Purchasing';
import ECommercePage from './components/ecommerce/ECommercePage';
import CustomerAccountPage from './components/customer/CustomerAccountPage';
import Crm from './components/Crm';
import useIdleTimer from './hooks/useIdleTimer';
import IdleTimeoutModal from './components/common/IdleTimeoutModal';
import RealisationsPage from './components/ecommerce/RealisationsPage';
import Production from './components/Production';
import Maintenance from './components/Maintenance';
import { useAppContext } from './context/AppContext';
import Equipements from './components/Equipements';

const App: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { 
    appMode, currentSubsidiary, currentUser, currentCustomer, currentView, showIdleModal
  } = state;

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleIdle = () => {
    if (appMode === AppMode.DASHBOARD && currentSubsidiary) {
      dispatch({ type: 'SET_IDLE_MODAL', payload: true });
    }
  };

  const { reset: resetIdleTimer } = useIdleTimer({ onIdle: handleIdle, timeout: 1000 * 60 * 15 }); // 15 minutes timeout

  const handleStayLoggedIn = () => {
    dispatch({ type: 'SET_IDLE_MODAL', payload: false });
    resetIdleTimer();
  };

  const ecommerceProducts = React.useMemo(() =>
    state.products.filter(p => p.mainCategory !== 'Matières Premières'),
    [state.products]
  );

  const renderDashboard = () => {
    if (!currentSubsidiary || !currentUser) {
      return <LoginPage />;
    }

    const renderView = () => {
      switch (currentView) {
        case View.ANALYTICS:
          return <Analytics />;
        case View.SALES:
          return <Sales 
                    subsidiary={currentSubsidiary}
                    currentUserRole={currentUser.role}
                    orders={state.orders}
                    products={state.products}
                    contacts={state.contacts}
                    onRecordPayment={(orderId: string, amount: number) => dispatch({ type: 'RECORD_ORDER_PAYMENT', payload: { orderId, amount } })}
                    onUpdateOrderStatus={(orderId: string, newStatus: OrderStatus) => dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, newStatus } })}
                    onValidateForProduction={(orderId: string) => dispatch({ type: 'VALIDATE_ORDER_FOR_PRODUCTION', payload: orderId })}
                  />;
        case View.PRODUCTION:
            return <Production />;
        case View.MAINTENANCE:
            return <Maintenance />;
        case View.EQUIPEMENT:
            return <Equipements />;
        case View.CRM:
          return <Crm 
                    subsidiary={currentSubsidiary}
                    currentUser={currentUser}
                    users={state.users}
                    contacts={state.contacts}
                    opportunities={state.opportunities}
                    interactions={state.interactions}
                    crmTasks={state.crmTasks}
                    leads={state.leads}
                    accounts={state.accounts}
                    contracts={state.contracts}
                    onSaveOpportunity={(data: Partial<Opportunity>) => dispatch({ type: 'SAVE_OPPORTUNITY', payload: data })}
                    onUpdateOpportunityStage={(oppId: string, newStage: OpportunityStage) => dispatch({ type: 'UPDATE_OPPORTUNITY_STAGE', payload: { oppId, newStage } })}
                    onWinOpportunity={(opportunity: Opportunity) => dispatch({ type: 'WIN_OPPORTUNITY', payload: opportunity })}
                    onLogInteraction={(data: Omit<Interaction, 'id' | 'date' | 'userId'>) => dispatch({ type: 'LOG_INTERACTION', payload: data })}
                    onConvertLead={(leadId: string) => dispatch({ type: 'CONVERT_LEAD', payload: leadId })}
                    onSaveTask={(data: Omit<CrmTask, 'id' | 'userId'> & { id?: string }) => dispatch({ type: 'SAVE_CRM_TASK', payload: data })}
                    onUpdateTaskStatus={(taskId: string, status: CrmTaskStatus) => dispatch({ type: 'UPDATE_CRM_TASK_STATUS', payload: { taskId, status } })}
                    onSaveContact={(data: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => dispatch({ type: 'SAVE_CONTACT', payload: data })}
                    onDeleteContact={(id: string) => dispatch({ type: 'DELETE_CONTACT', payload: id })}
                    onSaveLead={(data: Omit<Lead, 'id' | 'subsidiaryId'> & { id?: string }) => dispatch({ type: 'SAVE_LEAD', payload: data })}
                    onDeleteLead={(id: string) => dispatch({ type: 'DELETE_LEAD', payload: id })}
                    onSaveAccount={(data: Omit<Account, 'id' | 'subsidiaryId'> & { id?: string }) => dispatch({ type: 'SAVE_ACCOUNT', payload: data })}
                    onDeleteAccount={(id: string) => dispatch({ type: 'DELETE_ACCOUNT', payload: id })}
                    onSaveContract={(data: Omit<Contract, 'id' | 'subsidiaryId'> & { id?: string }) => dispatch({ type: 'SAVE_CONTRACT', payload: data })}
                    onDeleteContract={(id: string) => dispatch({ type: 'DELETE_CONTRACT', payload: id })}
                  />;
        case View.STOCK:
          return <Stock subsidiary={currentSubsidiary} />;
        case View.PURCHASING:
          return <Purchasing 
                    subsidiary={currentSubsidiary}
                    purchaseOrders={state.purchaseOrders}
                    products={state.products}
                    onCreatePurchaseOrder={(po: Omit<PurchaseOrder, 'id' | 'subsidiaryId'>) => dispatch({ type: 'CREATE_PURCHASE_ORDER', payload: po })}
                    onReceiveItems={(poId: string, receivedItems: { productId: string, quantityReceived: number }[]) => dispatch({ type: 'RECEIVE_PO_ITEMS', payload: { poId, receivedItems } })}
                    onRecordPayment={(poId: string, paymentAmount: number) => dispatch({ type: 'RECORD_PO_PAYMENT', payload: { poId, paymentAmount } })}
                  />;
        case View.AI_MARKETING:
          return <AiMarketing />;
        case View.CAISSE:
          return <Caisse 
                    subsidiary={currentSubsidiary}
                    products={state.products}
                    contacts={state.contacts}
                    orders={state.orders}
                    onCheckout={(cartItems, paymentMethod, client) => dispatch({ type: 'CHECKOUT', payload: { items: cartItems, paymentMethod, contact: client } })}
                    onRecordPayment={(orderId: string, amount: number) => dispatch({ type: 'RECORD_ORDER_PAYMENT', payload: { orderId, amount } })}
                  />;
        case View.MES_COMMANDES:
          return <MesCommandes 
                    subsidiary={currentSubsidiary}
                    orders={state.orders}
                    products={state.products}
                    contacts={state.contacts}
                    onPlaceOrder={(order) => dispatch({ type: 'PLACE_ORDER', payload: order })}
                    currentUser={currentUser}
                  />;
        case View.FINANCE:
          return <Finance 
                    subsidiary={currentSubsidiary}
                    supplierDebts={state.supplierDebts}
                    financialTransactions={state.financialTransactions}
                    orders={state.orders}
                    products={state.products}
                    expenseRecords={state.expenseRecords}
                    sales={state.sales}
                    equipment={state.equipment}
                  />;
        case View.CONFIGURATION:
          return <Configuration 
                    subsidiary={currentSubsidiary}
                    products={state.products}
                    users={state.users}
                    suppliers={state.suppliers}
                    onSaveProduct={(productData) => dispatch({ type: 'SAVE_PRODUCT', payload: productData })}
                    onDeleteProduct={(id) => dispatch({ type: 'DELETE_PRODUCT', payload: id })}
                    onGenerateImage={async (productId) => { /* Logic would be in context/reducer */ }}
                    onSaveUser={(userData) => dispatch({ type: 'SAVE_USER', payload: userData })}
                    onDeleteUser={(id) => dispatch({ type: 'DELETE_USER', payload: id })}
                    onSaveSupplier={(supplierData) => dispatch({ type: 'SAVE_SUPPLIER', payload: supplierData })}
                    onDeleteSupplier={(id) => dispatch({ type: 'DELETE_SUPPLIER', payload: id })}
                    onSaveTaxRate={(taxData) => dispatch({ type: 'SAVE_TAX_RATE', payload: taxData })}
                    onDeleteTaxRate={(id) => dispatch({ type: 'DELETE_TAX_RATE', payload: id })}
                  />;
        case View.HR_MANAGEMENT:
          return <HrManagement subsidiary={currentSubsidiary} />;
        case View.SECRETARIAT:
          return <Secretariat subsidiary={currentSubsidiary} />;
        default:
          return <Analytics />;
      }
    };

    return (
      <div className="flex h-screen bg-gray-100 text-slate-800">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
            <div className="printable-area">
              {renderView()}
            </div>
          </main>
        </div>
        <IdleTimeoutModal
          isOpen={showIdleModal}
          onLogout={handleLogout}
          onStayLoggedIn={handleStayLoggedIn}
        />
      </div>
    );
  };
  
  const renderContent = () => {
    switch(appMode) {
      case AppMode.ECOMMERCE:
        return <ECommercePage 
                  products={ecommerceProducts}
                  onPlaceOrder={(orderData, paymentMethod) => dispatch({ type: 'PLACE_ECOMMERCE_ORDER', payload: { orderData, paymentMethod } })}
                  currentCustomer={state.currentCustomer}
                  onLogin={(email, pass) => {
                    const customer = state.contacts.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === pass);
                    if (customer) {
                        if (customer.isVerified) {
                            dispatch({ type: 'CUSTOMER_LOGIN_SUCCESS', payload: customer });
                            return 'SUCCESS';
                        }
                        return 'NOT_VERIFIED';
                    }
                    return 'FAILED';
                  }}
                  onSignup={(data) => dispatch({ type: 'CUSTOMER_SIGNUP', payload: data })}
                  onLogout={() => dispatch({ type: 'CUSTOMER_LOGOUT' })}
                  onVerifyAccount={(email) => dispatch({ type: 'VERIFY_CUSTOMER', payload: email })}
                  onNavigateToAccount={() => dispatch({ type: 'SET_APP_MODE', payload: AppMode.CUSTOMER_ACCOUNT })}
                  onNavigateToDashboard={() => dispatch({ type: 'SET_APP_MODE', payload: AppMode.DASHBOARD })}
                  onNavigateToRealisations={() => dispatch({ type: 'SET_APP_MODE', payload: AppMode.REALISATIONS })}
                  onQuoteRequestSubmit={(data) => dispatch({type: 'SUBMIT_QUOTE_REQUEST', payload: data})}
                />;
      case AppMode.REALISATIONS:
        return <RealisationsPage onBackToShop={() => dispatch({ type: 'SET_APP_MODE', payload: AppMode.ECOMMERCE })} />;
      case AppMode.CUSTOMER_ACCOUNT:
        if (!currentCustomer) {
            dispatch({ type: 'SET_APP_MODE', payload: AppMode.ECOMMERCE }); // Redirect if not logged in
            return null;
        }
        return <CustomerAccountPage 
                  customer={currentCustomer}
                  orders={state.orders.filter(o => o.customerId === currentCustomer.id)}
                  onBackToShop={() => dispatch({ type: 'SET_APP_MODE', payload: AppMode.ECOMMERCE })}
                  onUpdateClient={(clientData) => dispatch({ type: 'SAVE_CONTACT', payload: clientData })}
                  onNavigateToRealisations={() => dispatch({ type: 'SET_APP_MODE', payload: AppMode.REALISATIONS })}
                />;
      case AppMode.DASHBOARD:
        return renderDashboard();
      default:
        dispatch({ type: 'SET_APP_MODE', payload: AppMode.ECOMMERCE });
        return null;
    }
  }

  return (
    <div>{renderContent()}</div>
  );
};

export default App;