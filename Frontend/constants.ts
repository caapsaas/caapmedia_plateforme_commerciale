import { Product, Sale, Contact, CreditAccount, TreasuryAccount, FinancialTransaction, SupplierDebt, User, UserRole, Supplier, Subsidiary, SalesChartData, StockChartData, Order, OrderStatus, Employee, AttendanceRecord, PayrollRecord, AttendanceStatus, PayrollStatus, Gender, ContractType, EmployeeStatus, PaymentMethod, AbsenceRecord, AbsenceType, CompanyDocument, DocumentCategory, DocumentStatus, Meeting, SecretariatTask, SecretariatTaskStatus, ExpenseRecord, ExpenseType, PurchaseOrder, PurchaseOrderStatus, PaymentTerms, Opportunity, OpportunityStage, CrmTask, CrmTaskStatus, Interaction, InteractionType, ContactStatus, ConfigurableOptions, Lead, LeadStatus, Account, Contract, ContractStatus, FixedAsset, LongTermDebt, Equipment, EquipmentStatus, ProductionStatus, TaxRate } from './types';



// Empty mocks to avoid crashes
export const MOCK_TAX_RATES: TaxRate[] = [];
export const MOCK_SUBSIDIARIES: Subsidiary[] = []; 
export const MOCK_USERS: User[] = []; 
export const MOCK_PRODUCTS: Product[] = []; 
export const MOCK_EQUIPMENT: Equipment[] = []; 
export const MOCK_SALES: Sale[] = []; 
export const MOCK_CONTACTS: Contact[] = []; 
export const MOCK_ORDERS: Order[] = []; 
export const MOCK_SUPPLIERS: Supplier[] = []; 
export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = []; 
export const MOCK_SUPPLIER_DEBTS: SupplierDebt[] = []; 
export const MOCK_TRANSACTIONS: FinancialTransaction[] = []; 
export const MOCK_EXPENSE_RECORDS: ExpenseRecord[] = []; 
export const MOCK_OPPORTUNITIES: Opportunity[] = []; 
export const MOCK_INTERACTIONS: Interaction[] = []; 
export const MOCK_CRM_TASKS: CrmTask[] = []; 
export const MOCK_LEADS: Lead[] = []; 
export const MOCK_ACCOUNTS: Account[] = []; 
export const MOCK_CONTRACTS: Contract[] = []; 
export const MOCK_CREDIT_ACCOUNTS: CreditAccount[] = []; 
export const MOCK_TREASURY_ACCOUNTS: TreasuryAccount[] = []; 
export const MOCK_EMPLOYEES: Employee[] = []; 
export const MOCK_ATTENDANCE: AttendanceRecord[] = []; 
export const MOCK_PAYROLL: PayrollRecord[] = []; 
export const MOCK_ABSENCES: AbsenceRecord[] = []; 
export const MOCK_COMPANY_DOCUMENTS: CompanyDocument[] = []; 
export const MOCK_MEETINGS: Meeting[] = []; 
export const MOCK_SECRETARIAT_TASKS: SecretariatTask[] = []; 

export const categoryToKeyMap: { [key: string]: string } = {
    // Imprimerie
    'Pub': 'stock.categories.pub',
    'Carterie': 'stock.categories.carterie',
    'Packaging': 'stock.categories.packaging',
    'Papeterie': 'stock.categories.papeterie',
    'Resto - Hôtels': 'stock.categories.restoHotels',
    'Impression livre': 'stock.categories.impressionLivre',
    // Signalétique & Display
    'Bâches & Banderoles': 'stock.categories.bachesBanderoles',
    'Roll-up & Kakemono': 'stock.categories.rollupKakemono',
    'Drapeaux & Oriflammes': 'stock.categories.drapeauxOriflammes',
    'Panneaux & Enseignes': 'stock.categories.panneauxEnseignes',
    'Stands & PLV': 'stock.categories.standsPlv',
    // Objets publicitaires
    'Textile': 'stock.categories.textile',
    'Mugs, gobelets et gourdes': 'stock.categories.mugsGobeletsGourdes',
    'Sacs personnalisés': 'stock.categories.sacsPersonnalises',
    'Événementiel': 'stock.categories.evenementiel',
    'Mobilier publicitaire': 'stock.categories.mobilierPublicitaire',
    'Écriture & Bureau': 'stock.categories.ecritureBureau',
    'Maison & Déco': 'stock.categories.maisonDeco',
    // Prestations de services
    'Création & gestion de sites web': 'stock.categories.creationSitesWeb',
    'Marketing digital & publicité': 'stock.categories.marketingDigital',
    'Réseaux sociaux': 'stock.categories.reseauxSociaux',
    'Design & identité visuelle': 'stock.categories.designIdentiteVisuelle',
    // Matières Premières
    'Papiers & Cartons': 'stock.categories.papiersCartons',
    'Encres & Chimiques': 'stock.categories.encresChimiques',
    'Supports & Bâches': 'stock.categories.supportsBaches',
    'Finition & Façonnage': 'stock.categories.finitionFaconnage',
    'Prestations Externes': 'stock.categories.prestationsExternes',
    'Textiles': 'stock.categories.textilesRaw',
};

export const rangeToKeyMap: { [key: string]: string } = {
    'Populaire': 'productRange.popular',
    'Standard': 'productRange.standard',
    'Premium': 'productRange.premium',
};