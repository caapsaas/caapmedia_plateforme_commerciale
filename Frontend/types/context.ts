
import {
    AppMode,
    Subsidiary,
    View,
    User,
    Contact,
    Product,
    Sale,
    Order,
    PurchaseOrder,
    SupplierDebt,
    FinancialTransaction,
    ExpenseRecord,
    Supplier,
    Opportunity,
    Interaction,
    CrmTask,
    Lead,
    Account,
    Contract,
    UserRole,
    OpportunityStage,
    OrderStatus,
    CrmTaskStatus,
    ProductionStatus,
    Equipment,
    MaintenanceRecord,
    TaxRate,
} from './models';

export interface AppState {
    appMode: AppMode;
    currentSubsidiary: Subsidiary | null;
    currentView: View;
    currentUser: User | null;
    currentCustomer: Contact | null;
    isSidebarOpen: boolean;
    isSidebarCollapsed: boolean;
    showIdleModal: boolean;
    products: Product[];
    sales: Sale[];
    orders: Order[];
    contacts: Contact[];
    suppliers: Supplier[];
    users: User[];
    purchaseOrders: PurchaseOrder[];
    supplierDebts: SupplierDebt[];
    financialTransactions: FinancialTransaction[];
    expenseRecords: ExpenseRecord[];
    opportunities: Opportunity[];
    interactions: Interaction[];
    crmTasks: CrmTask[];
    leads: Lead[];
    accounts: Account[];
    contracts: Contract[];
    equipment: Equipment[];
    taxRates: TaxRate[];
}

export type AppAction =
    | { type: 'SET_APP_MODE'; payload: AppMode }
    | { type: 'SET_VIEW'; payload: View }
    | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
    | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
    | { type: 'SET_IDLE_MODAL'; payload: boolean }
    | { type: 'LOGIN_SUCCESS'; payload: { user: User; subsidiary: Subsidiary } }
    | { type: 'LOGOUT' }
    | { type: 'CHANGE_ROLE'; payload: UserRole }
    | { type: 'CHECKOUT'; payload: { items: { product: Product; quantity: number }[]; paymentMethod: string; contact: Contact | Omit<Contact, 'id'|'subsidiaryId'> } }
    | { type: 'PLACE_ORDER'; payload: Omit<Order, 'id' | 'subsidiaryId' | 'status' | 'salesRepId' | 'paymentStatus' | 'amountPaid' | 'productionStatus' | 'productionHistory' | 'taxRateId' | 'taxRateValue'> }
    | { type: 'MARK_ORDER_PAID'; payload: string }
    | { type: 'CREATE_PURCHASE_ORDER'; payload: Omit<PurchaseOrder, 'id' | 'subsidiaryId'> }
    | { type: 'RECEIVE_PO_ITEMS'; payload: { poId: string; receivedItems: { productId: string, quantityReceived: number }[] } }
    | { type: 'RECORD_PO_PAYMENT'; payload: { poId: string, paymentAmount: number } }
    | { type: 'CUSTOMER_LOGIN_SUCCESS'; payload: Contact }
    | { type: 'CUSTOMER_LOGIN_FAILURE' }
    | { type: 'CUSTOMER_LOGOUT' }
    | { type: 'CUSTOMER_SIGNUP'; payload: Omit<Contact, 'id' | 'subsidiaryId' | 'since' | 'isVerified' | 'salesRepId' | 'accountId' | 'status' | 'password'> & { password?: string } }
    | { type: 'VERIFY_CUSTOMER'; payload: string }
    | { type: 'PLACE_ECOMMERCE_ORDER'; payload: { orderData: { customerInfo: { name: string, email: string, address: string }, items: any[] }, paymentMethod: string } }
    | { type: 'SUBMIT_QUOTE_REQUEST', payload: { name: string; company: string; email: string; phone: string; description: string; } }
    | { type: 'SAVE_PRODUCT'; payload: Omit<Product, 'id' | 'subsidiaryId'> & { id?: string } }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'UPDATE_PRODUCT_IMAGE'; payload: { productId: string; imageUrl: string } }
    | { type: 'SAVE_USER'; payload: Omit<User, 'id'> & { id?: string } }
    | { type: 'DELETE_USER'; payload: string }
    | { type: 'SAVE_SUPPLIER'; payload: Omit<Supplier, 'id' | 'subsidiaryId'> & { id?: string } }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'SAVE_CONTACT'; payload: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string } }
    | { type: 'DELETE_CONTACT'; payload: string }
    | { type: 'SAVE_LEAD'; payload: Omit<Lead, 'id' | 'subsidiaryId'> & { id?: string } }
    | { type: 'DELETE_LEAD'; payload: string }
    | { type: 'CONVERT_LEAD'; payload: string }
    | { type: 'SAVE_ACCOUNT'; payload: Omit<Account, 'id' | 'subsidiaryId'> & { id?: string } }
    | { type: 'DELETE_ACCOUNT'; payload: string }
    | { type: 'SAVE_CONTRACT'; payload: Omit<Contract, 'id' | 'subsidiaryId'> & { id?: string } }
    | { type: 'DELETE_CONTRACT'; payload: string }
    | { type: 'SAVE_OPPORTUNITY'; payload: Partial<Opportunity> }
    | { type: 'UPDATE_OPPORTUNITY_STAGE'; payload: { oppId: string; newStage: OpportunityStage } }
    | { type: 'WIN_OPPORTUNITY'; payload: Opportunity }
    | { type: 'LOG_INTERACTION'; payload: Omit<Interaction, 'id' | 'date' | 'userId'> }
    | { type: 'SAVE_CRM_TASK'; payload: Omit<CrmTask, 'id' | 'userId'> & { id?: string } }
    | { type: 'UPDATE_CRM_TASK_STATUS'; payload: { taskId: string; status: CrmTaskStatus } }
    | { type: 'RECORD_ORDER_PAYMENT'; payload: { orderId: string, amount: number } }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string, newStatus: OrderStatus } }
    | { type: 'VALIDATE_ORDER_FOR_PRODUCTION'; payload: string }
    | { type: 'UPDATE_ORDER_PRODUCTION_STATUS'; payload: { orderId: string; newStatus: ProductionStatus } }
    | { type: 'SAVE_EQUIPMENT'; payload: Omit<Equipment, 'id' | 'subsidiaryId' | 'maintenanceHistory'> & { id?: string } }
    | { type: 'DELETE_EQUIPMENT'; payload: string }
    | { type: 'ADD_MAINTENANCE_RECORD'; payload: { equipmentId: string; record: Omit<MaintenanceRecord, 'id'> } }
    | { type: 'ADD_BULK_PRODUCTS'; payload: Product[] }
    | { type: 'SAVE_TAX_RATE'; payload: Omit<TaxRate, 'id'> & { id?: string } }
    | { type: 'DELETE_TAX_RATE'; payload: string };
