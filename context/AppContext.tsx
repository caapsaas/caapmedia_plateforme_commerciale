

import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { AppState, AppAction } from '../types';
import { 
    AppMode, View, UserRole, OrderStatus, Product, Sale, FinancialTransaction, PurchaseOrderStatus, PaymentTerms, SupplierDebt, PaymentStatus, Lead, LeadStatus, Contact, ContactStatus, Opportunity, OpportunityStage, Interaction, InteractionType, CrmTask,
    User, Supplier, Order, PurchaseOrder, Account, Contract, CrmTaskStatus, ProductionStatus, Equipment, MaintenanceRecord, TaxRate
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_SALES, MOCK_ORDERS, MOCK_CONTACTS, MOCK_SUPPLIERS, MOCK_USERS, MOCK_PURCHASE_ORDERS, MOCK_SUPPLIER_DEBTS, MOCK_TRANSACTIONS, MOCK_EXPENSE_RECORDS, MOCK_OPPORTUNITIES, MOCK_INTERACTIONS, MOCK_CRM_TASKS, MOCK_LEADS, MOCK_ACCOUNTS, MOCK_CONTRACTS, MOCK_EQUIPMENT,
// FIX: Import MOCK_TAX_RATES to use in initial state.
MOCK_TAX_RATES
} from '../constants';

const initialState: AppState = {
    appMode: AppMode.ECOMMERCE,
    currentSubsidiary: null,
    currentView: View.ANALYTICS,
    currentUser: null,
    currentCustomer: null,
    isSidebarOpen: false,
    isSidebarCollapsed: window.innerWidth < 768,
    showIdleModal: false,
    products: MOCK_PRODUCTS,
    sales: MOCK_SALES,
    orders: MOCK_ORDERS,
    contacts: MOCK_CONTACTS,
    suppliers: MOCK_SUPPLIERS,
    users: MOCK_USERS,
    purchaseOrders: MOCK_PURCHASE_ORDERS,
    supplierDebts: MOCK_SUPPLIER_DEBTS,
    financialTransactions: MOCK_TRANSACTIONS,
    expenseRecords: MOCK_EXPENSE_RECORDS,
    opportunities: MOCK_OPPORTUNITIES,
    interactions: MOCK_INTERACTIONS,
    crmTasks: MOCK_CRM_TASKS,
    leads: MOCK_LEADS,
    accounts: MOCK_ACCOUNTS,
    contracts: MOCK_CONTRACTS,
    equipment: MOCK_EQUIPMENT,
    // FIX: Add missing 'taxRates' property to initial state.
    taxRates: MOCK_TAX_RATES,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_APP_MODE':
            return { ...state, appMode: action.payload };
        case 'SET_VIEW':
            return { ...state, currentView: action.payload };
        case 'SET_SIDEBAR_OPEN':
            return { ...state, isSidebarOpen: action.payload };
        case 'SET_SIDEBAR_COLLAPSED':
            return { ...state, isSidebarCollapsed: action.payload };
        case 'SET_IDLE_MODAL':
            return { ...state, showIdleModal: action.payload };
        case 'LOGIN_SUCCESS': {
            let defaultView = View.ANALYTICS;
            const userRole = action.payload.user.role;
             if (userRole === UserRole.CAISSIER) defaultView = View.CAISSE;
             else if (userRole === UserRole.COMMERCIAL) defaultView = View.CRM;
             else if (userRole === UserRole.PURCHASING_MANAGER) defaultView = View.PURCHASING;
             else if (userRole === UserRole.SECRETARY) defaultView = View.SECRETARIAT;
             else if (userRole === UserRole.HR_MANAGER) defaultView = View.HR_MANAGEMENT;
             else if (userRole === UserRole.PRODUCTION_DIRECTOR) defaultView = View.PRODUCTION;

            return {
                ...state,
                appMode: AppMode.DASHBOARD,
                currentUser: action.payload.user,
                currentSubsidiary: action.payload.subsidiary,
                currentView: defaultView,
            };
        }
        case 'LOGOUT':
            return {
                ...initialState,
                appMode: AppMode.ECOMMERCE,
            };
        case 'CHANGE_ROLE':
            if (state.currentUser) {
                const updatedUser = { ...state.currentUser, role: action.payload };
                 let defaultView = View.ANALYTICS;
                const userRole = action.payload;
                if (userRole === UserRole.CAISSIER) defaultView = View.CAISSE;
                else if (userRole === UserRole.COMMERCIAL) defaultView = View.CRM;
                else if (userRole === UserRole.PURCHASING_MANAGER) defaultView = View.PURCHASING;
                else if (userRole === UserRole.SECRETARY) defaultView = View.SECRETARIAT;
                else if (userRole === UserRole.HR_MANAGER) defaultView = View.HR_MANAGEMENT;
                else if (userRole === UserRole.PRODUCTION_DIRECTOR) defaultView = View.PRODUCTION;
                return { ...state, currentUser: updatedUser, currentView: defaultView };
            }
            return state;
        
        case 'CUSTOMER_LOGIN_SUCCESS':
            return { ...state, currentCustomer: action.payload, appMode: AppMode.CUSTOMER_ACCOUNT };

        case 'CUSTOMER_LOGOUT':
            return { ...state, currentCustomer: null, appMode: AppMode.ECOMMERCE };
            
        case 'CUSTOMER_SIGNUP': {
            const newContact: Contact = {
                ...action.payload,
                id: `CUST-${Date.now()}`,
                subsidiaryId: state.currentSubsidiary?.id || 'sub1',
                since: new Date().toISOString().split('T')[0],
                isVerified: false, 
                status: ContactStatus.ACTIVE,
            };
            return {
                ...state,
                contacts: [...state.contacts, newContact],
            };
        }

        case 'VERIFY_CUSTOMER': {
            return {
                ...state,
                contacts: state.contacts.map(c => c.email === action.payload ? { ...c, isVerified: true } : c)
            };
        }
        
        case 'PLACE_ECOMMERCE_ORDER': {
            const { orderData } = action.payload;
            const { customerInfo, items } = orderData;
    
            // Find or create customer
            let customer = state.contacts.find(c => c.email.toLowerCase() === customerInfo.email.toLowerCase());
            let newContacts = state.contacts;
            if (!customer) {
                const newCustomer: Contact = {
                    id: `CUST-${Date.now()}`,
                    name: customerInfo.name,
                    email: customerInfo.email,
                    address: customerInfo.address,
                    company: '',
                    phone: '',
                    since: new Date().toISOString().split('T')[0],
                    isVerified: true, // Auto-verified from shop purchase
                    subsidiaryId: state.currentSubsidiary?.id || 'sub1', // Default to sub1 for shop
                    status: ContactStatus.ACTIVE,
                };
                newContacts = [...state.contacts, newCustomer];
                customer = newCustomer;
            }
    
            // FIX: Correctly calculate subtotal from OrderItem array.
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const defaultTaxRate = state.taxRates.find(t => t.isDefault) || { id: 'tax1', rate: 0.1925 };
            const taxAmount = subtotal * defaultTaxRate.rate;
            const totalAmount = subtotal + taxAmount;
    
            const newOrder: Order = {
                id: `CMD-WEB-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                customerId: customer.id,
                customerName: customer.name,
                items: orderData.items,
                subtotal,
                taxAmount,
                totalAmount,
                taxRateId: defaultTaxRate.id,
                taxRateValue: defaultTaxRate.rate,
                status: OrderStatus.PENDING_VALIDATION,
                paymentStatus: PaymentStatus.UNPAID,
                amountPaid: 0,
                subsidiaryId: 'sub1', // E-commerce orders always go to the main subsidiary
                paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                productionStatus: ProductionStatus.PREPRESS,
                productionHistory: [],
                source: 'web_order',
            };
    
            return {
                ...state,
                orders: [newOrder, ...state.orders],
                contacts: newContacts,
            };
        }
        case 'SAVE_PRODUCT': {
            const { id, ...productData } = action.payload;
            if (id) {
                return { ...state, products: state.products.map(p => p.id === id ? { ...p, ...productData } : p) };
            } else {
                const newProduct: Product = {
                    ...(productData as Omit<Product, 'id' | 'subsidiaryId'>),
                    id: `P-${Date.now()}`,
                    subsidiaryId: state.currentSubsidiary!.id,
                    imageUrls: ['https://via.placeholder.com/400x300'],
                };
                return { ...state, products: [newProduct, ...state.products] };
            }
        }

        case 'DELETE_PRODUCT':
            return { ...state, products: state.products.filter(p => p.id !== action.payload) };

        case 'ADD_BULK_PRODUCTS': {
            return { ...state, products: [...state.products, ...action.payload] };
        }
        
        case 'UPDATE_PRODUCT_IMAGE': {
            return {
                ...state,
                products: state.products.map(p => {
                    if (p.id === action.payload.productId) {
                        return { ...p, imageUrls: [action.payload.imageUrl, ...(p.imageUrls || []).filter(url => url !== action.payload.imageUrl)] };
                    }
                    return p;
                })
            }
        }

        case 'SAVE_USER': {
            const { id, ...userData } = action.payload;
            if (id) {
                // Update existing user
                return {
                    ...state,
                    users: state.users.map(u => {
                        if (u.id === id) {
                            const { password, ...otherData } = userData;
                            const updatedUser = { ...u, ...otherData };
                            // Only update password if a new one is provided
                            if (password) {
                                updatedUser.password = password;
                            }
                            return updatedUser;
                        }
                        return u;
                    })
                };
            } else {
                // Create new user, subsidiaryId is now in userData
                const newUser: User = {
                    ...(userData as Omit<User, 'id'>),
                    id: `U-${Date.now()}`,
                    password: userData.password || Math.random().toString(36).slice(-8)
                };
                return { ...state, users: [newUser, ...state.users] };
            }
        }
        
        case 'DELETE_USER':
            return { ...state, users: state.users.filter(u => u.id !== action.payload) };

        case 'SAVE_SUPPLIER': {
             const { id, ...supplierData } = action.payload;
            if (id) {
                return { ...state, suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...supplierData } : s) };
            } else {
                const newSupplier: Supplier = {
                    ...(supplierData as Omit<Supplier, 'id' | 'subsidiaryId'>),
                    id: `S-${Date.now()}`,
                    subsidiaryId: state.currentSubsidiary!.id,
                };
                return { ...state, suppliers: [newSupplier, ...state.suppliers] };
            }
        }
        case 'DELETE_SUPPLIER':
            return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
            
        case 'RECORD_ORDER_PAYMENT': {
            const { orderId, amount } = action.payload;
            return {
                ...state,
                orders: state.orders.map(order => {
                    if (order.id === orderId) {
                        const newAmountPaid = order.amountPaid + amount;
                        const newPaymentStatus = newAmountPaid >= order.totalAmount ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;
                        return { ...order, amountPaid: newAmountPaid, paymentStatus: newPaymentStatus };
                    }
                    return order;
                })
            };
        }
        case 'UPDATE_ORDER_STATUS': {
            const { orderId, newStatus } = action.payload;
            return {
                ...state,
                orders: state.orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order)
            };
        }
        case 'UPDATE_ORDER_PRODUCTION_STATUS': {
            const { orderId, newStatus } = action.payload;
            return {
                ...state,
                orders: state.orders.map(order => {
                    if (order.id === orderId) {
                        const newHistory = [...order.productionHistory, { status: newStatus, date: new Date().toISOString() }];
                        let finalStatus = order.status;
                        if(newStatus === ProductionStatus.READY_FOR_DELIVERY) {
                            finalStatus = OrderStatus.PENDING_DELIVERY;
                        }
                        return { ...order, productionStatus: newStatus, productionHistory: newHistory, status: finalStatus };
                    }
                    return order;
                })
            };
        }
        case 'SAVE_EQUIPMENT': {
            const { id, ...equipData } = action.payload;
            if (id) {
                return { ...state, equipment: state.equipment.map(e => e.id === id ? { ...e, ...equipData } : e) };
            } else {
                 const newEquipment: Equipment = {
                    ...(equipData as Omit<Equipment, 'id'|'subsidiaryId'|'maintenanceHistory'>),
                    id: `EQ-${Date.now()}`,
                    subsidiaryId: state.currentSubsidiary!.id,
                    maintenanceHistory: []
                };
                return { ...state, equipment: [...state.equipment, newEquipment] };
            }
        }
        case 'DELETE_EQUIPMENT':
            return { ...state, equipment: state.equipment.filter(e => e.id !== action.payload) };

        case 'ADD_MAINTENANCE_RECORD': {
            const { equipmentId, record } = action.payload;
            return {
                ...state,
                equipment: state.equipment.map(e => {
                    if (e.id === equipmentId) {
                        const newRecord: MaintenanceRecord = { ...record, id: `MNT-${Date.now()}` };
                        return { ...e, maintenanceHistory: [newRecord, ...e.maintenanceHistory], lastMaintenanceDate: newRecord.date };
                    }
                    return e;
                })
            }
        }
        case 'SAVE_TAX_RATE': {
            const { id, ...taxData } = action.payload;
             // If setting a new default, unset the old one
            let newTaxRates = state.taxRates;
            if (taxData.isDefault) {
                newTaxRates = newTaxRates.map(tr => ({ ...tr, isDefault: false }));
            }

            if (id) {
                return { ...state, taxRates: newTaxRates.map(t => t.id === id ? { ...t, ...taxData } : t) };
            } else {
                const newTaxRate: TaxRate = {
                    ...(taxData as Omit<TaxRate, 'id'>),
                    id: `TAX-${Date.now()}`,
                };
                return { ...state, taxRates: [newTaxRate, ...newTaxRates] };
            }
        }
         case 'DELETE_TAX_RATE': {
            const taxToDelete = state.taxRates.find(t => t.id === action.payload);
            if (taxToDelete && taxToDelete.isDefault) {
                // Cannot delete default tax rate
                // Optionally, show an error message to the user
                return state;
            }
            return { ...state, taxRates: state.taxRates.filter(t => t.id !== action.payload) };
        }
        
        // Add other cases here based on AppAction
        default:
            return state;
    }
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};