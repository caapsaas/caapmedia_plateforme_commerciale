import React from 'react';

export enum AppMode {
  HOME = 'HOME',
  ECOMMERCE = 'ECOMMERCE',
  DASHBOARD = 'DASHBOARD',
  CUSTOMER_ACCOUNT = 'CUSTOMER_ACCOUNT',
  REALISATIONS = 'REALISATIONS',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  COMMERCIAL = 'COMMERCIAL',
  CAISSIER = 'CAISSIER',
  PURCHASING_MANAGER = 'PURCHASING_MANAGER',
  FINANCIAL_DIRECTOR = 'FINANCIAL_DIRECTOR',
  SECRETARY = 'SECRETARY',
  HR_MANAGER = 'HR_MANAGER',
  PRODUCTION_DIRECTOR = 'PRODUCTION_DIRECTOR',
}

export enum View {
  // Common & Admin
  ANALYTICS = 'ANALYTICS',
  SALES = 'SALES',
  STOCK = 'STOCK',
  PURCHASING = 'PURCHASING',
  FINANCE = 'FINANCE',
  CONFIGURATION = 'CONFIGURATION',
  HR_MANAGEMENT = 'HR_MANAGEMENT',
  SECRETARIAT = 'SECRETARIAT',
  CRM = 'CRM',
  PRODUCTION = 'PRODUCTION',
  MAINTENANCE = 'MAINTENANCE',
  EQUIPEMENT = 'EQUIPEMENT',
  
  // Caissier
  CAISSE = 'CAISSE',

  // Client
  MES_COMMANDES = 'MES_COMMANDES',
}

export enum FinanceView {
    CREDIT = 'credit',
    TREASURY = 'treasury',
    SUPPLIERS = 'suppliers',
    EXPENSES = 'expenses',
    PNL = 'pnl',
    BILAN = 'bilan',
    EXTERNAL_TRANSACTIONS = 'external_transactions',
    PREFINANCEMENT = 'prefinancement',
    INVESTMENT = 'investment',
    INVESTMENT_RETURN = 'investment_return',
    LOAN = 'loan',
    DONATION = 'donation',
    PERSONAL_EXPENSE = 'personal_expense',
    PERSONAL_INCOME = 'personal_income',
    TAX_REFUND = 'tax_refund',
    INSURANCE_PAYOUT = 'insurance_payout',
    LEGAL_SETTLEMENT = 'legal_settlement',
    OTHER_FINANCIAL = 'other_financial',
    REAL_ESTATE = 'real_estate',
    VEHICLE = 'vehicle',
}

export enum ExternalTransactionType {
  INVESTMENT = 'INVESTMENT',
  INVESTMENT_RETURN = 'INVESTMENT_RETURN',
  LOAN = 'LOAN',
  DONATION = 'DONATION',
  PERSONAL_EXPENSE = 'PERSONAL_EXPENSE',
  PERSONAL_INCOME = 'PERSONAL_INCOME',
  TAX_REFUND = 'TAX_REFUND',
  INSURANCE_PAYOUT = 'INSURANCE_PAYOUT',
  LEGAL_SETTLEMENT = 'LEGAL_SETTLEMENT',
  TRANSFER_PDG = 'TRANSFER_PDG',
  OTHER_FINANCIAL = 'OTHER_FINANCIAL'
}

export enum ExternalTransactionCategory {
  REAL_ESTATE = 'REAL_ESTATE',
  VEHICLE = 'VEHICLE',
  EQUIPMENT = 'EQUIPMENT',
  EDUCATION = 'EDUCATION',
  HEALTH = 'HEALTH',
  TRAVEL = 'TRAVEL',
  ENTERTAINMENT = 'ENTERTAINMENT',
  PERSONAL_SAVINGS = 'PERSONAL_SAVINGS',
  FAMILY_SUPPORT = 'FAMILY_SUPPORT',
  CHARITY = 'CHARITY',
  INVESTMENT_RETURN = 'INVESTMENT_RETURN',
  TAX_REFUND = 'TAX_REFUND',
  INSURANCE_PAYOUT = 'INSURANCE_PAYOUT',
  LEGAL_SETTLEMENT = 'LEGAL_SETTLEMENT',
  TRANSFER_PDG = 'TRANSFER_PDG',
  OTHER = 'OTHER'
}

export enum ExternalTransactionStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  CANCELLED = 'CANCELLED'
}

export interface ExternalFinancialTransaction {
  id: string;
  transactionDate: string;
  description: string;
  amount: number;
  externalTransactionType: ExternalTransactionType;
  externalTransactionCategory: ExternalTransactionCategory;
  status: ExternalTransactionStatus;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  relatedDocumentUrl?: string;
  createdBy: string;
  subsidiaryId: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    userName: string;
    email: string;
  };
  subsidiary?: {
    id: string;
    subsidiaryName: string;
  };
}

export interface Subsidiary {
  id: string;
  name: string;
  subsidiaryName: string;
  logo: React.FC<React.SVGProps<SVGSVGElement>>;
  address: string;
  phone: string;
  email: string;
  ifu: string; // Identifiant Financier Unique
  rccm: string; // Registre du Commerce et du Crédit Mobilier
  bankDetails?: { // Rendu optionnel pour correspondre au schéma
    bankName: string;
    accountNumber: string;
    swift: string;
  };
  shareCapital: number;
  logoSvg?: string;
}

export interface User {
  id: string;
  userName: string;
  email: string;
  userRole: UserRole;
  subsidiaryId: string;
  password?: string;
}

export interface ConfigurableOptionItem {
    optionName: string;
    multiplier: number; // Price multiplier
}

export interface ConfigurableOptions {
    FORMATS?: ConfigurableOptionItem[];
    GRAMMAGES?: ConfigurableOptionItem[];
    PRINTSIDES?: ConfigurableOptionItem[];
    LAMINATIONS?: ConfigurableOptionItem[];
    SIZES?: ConfigurableOptionItem[];
    COLORS?: ConfigurableOptionItem[];
    MATERIALS?: ConfigurableOptionItem[];
    DIMENSIONS?: ConfigurableOptionItem[];
    BINDINGS?: ConfigurableOptionItem[];
    FOLDINGS?: ConfigurableOptionItem[];
    CORNERS?: ConfigurableOptionItem[];
    EYELETS?: ConfigurableOptionItem[];
    PAGES?: ConfigurableOptionItem[];
    HANDLES?: ConfigurableOptionItem[];
    STUB?: ConfigurableOptionItem[];
    NUMBERING?: ConfigurableOptionItem[];
}

export interface ProductImage {
    id: string;
    imageName: string;
    imageUrl: string;
}

export interface Product {
  id: string;
  productName: string;
  mainCategory: string;
  category: string; // This is the subcategory
  description: string;
  stock: number;
  price: number; // Prix de revient
  sellingPrice: number; // Prix de vente
  warehouse: string;
  subsidiaryId: string;
  range?: string;
  productImages?: ProductImage[];
  configurableOptions?: ConfigurableOptions;
}

export interface Sale {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  date: string;
  customerId: string;
  customerName: string;
  status: 'Payé' | 'En attente' | 'Annulé';
  subsidiaryId: string;
  salesRepId?: string;
  taxRate: number;
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export enum OrderStatus {
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  NEW = 'NEW',
  IN_PRODUCTION = 'IN_PRODUCTION',
  PENDING_DELIVERY = 'PENDING_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ProductionStatus {
  PREPRESS = 'PREPRESS',
  PRINTING = 'PRINTING',
  FINISHING = 'FINISHING',
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY',
}


export interface ProductOptions {
    format?: string;
    grammage?: string;
    printSide?: string;
    lamination?: string;
    size?: string;
    color?: string;
    material?: string;
    dimension?: string;
    binding?: string;
    folding?: string;
    corner?: string;
    eyelet?: string;
    page?: string;
    handle?: string;
    stub?: string;
    numbering?: string;
}


export interface OrderItem {
  product: Product;
  quantity: number;
  price: number; // The CALCULATED unit price at the time of order
  options?: Partial<ProductOptions>;
  designFile?: { name: string; url: string; };
}

export interface OrderGroup{
  groupId: string;
  groupCode: string;
  totalAmount: number;
  createdAt: string;
  orders: Order[];
}

export interface Order {
  orderId: string;
  date: string;
  customerName: string;
  customerId: string;
  items: OrderItem[];
  orderItems: OrderItem[];
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  taxRateId: string;
  taxRateValue: number;
  status: OrderStatus;
  productionStatus: ProductionStatus;
  productionHistory: { status: ProductionStatus, date: string }[];
  paymentStatus: PaymentStatus;
  amountPaid: number;
  subsidiaryId: string;
  paymentDueDate: string;
  salesRepId?: string;
  opportunityId?: string;
  paymentMethod: CustomerPaymentMethod;
  // FIX: Add optional 'source' property to track order origin and resolve type error.
  source?: 'manual' | 'web_order' | 'quote_request';
}

export interface Kpi {
  titleKey: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
}

export enum ContactStatus {
  PROSPECT = 'PROSPECT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Contact {
  id: string;
  contactName: string;
  company: string;
  email: string;
  phone: string;
  since: string;
  subsidiaryId: string;
  address: string;
  salesRepId?: string;
  password?: string; // Rendu obligatoire pour l'inscription et la connexion
  status?: ContactStatus;
  isVerified: boolean;
  accountId?: string;
}

export type Client = Contact;
export type ClientStatus = ContactStatus;

export interface Supplier {
  id: string;
  supplierName: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  subsidiaryId: string;
}

// Purchasing Module Types
export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentTerms {
  IMMEDIATE = 'IMMEDIATE', // Paiement direct de la trésorerie
  CREDIT = 'CREDIT', // Compte fournisseur (dette)
  DRAFT_PAYMENT = 'DRAFT_PAYMENT', // Traite
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  quantityReceived: number;
  purchasePrice: number;
}

export interface PurchaseOrderHistory {
  date: string;
  event: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  paymentTerms: PaymentTerms;
  subsidiaryId: string;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  history: PurchaseOrderHistory[];
}


export interface CreditAccount {  
  id: string;
  clientName: string;
  companyName: string;
  balance: number; // Solde créditeur
  lastPaymentDate: string;
  subsidiaryId: string;
}

export enum AccountType {
  BANQUE = 'BANQUE',
  CAISSE = 'CAISSE',
  COMPTE_PREFINANCEMENT = 'COMPTE_PREFINANCEMENT',
}

export interface TreasuryAccount {
  id: string;
  accountName: string;
  balance: number;
  currency: string;
  accountType: AccountType;
  subsidiaryId: string;
}

export enum TransactionStatus {
  VALIDATED = 'VALIDE',
  PENDING = 'EN_ATTENTE',
}

export type TransactionType = 'RECETTE' | 'DEPENSE';

export interface FinancialTransaction {
  id: string;
  transactionDate: string;
  description: string;
  amount: number;
  treasuryAccountId: string;
  subsidiaryId: string;
  relatedDocumentId?: string; // e.g., PO-2024-001 or CMD-001
  financialTransactionType: TransactionType;
  providerName?: string; // Nom du prestataire
  providerPhone?: string; // Téléphone du prestataire
}

export interface SupplierDebt {
  id: string;
  supplierName: string;
  invoiceId: string;
  dueDate: string;
  amount: number;
  status: 'À payer' | 'Payé' | 'En retard';
  subsidiaryId: string;
  invoiceUrl?: string;
  purchaseOrderId: string; // Link back to the purchase order
}

export interface SalesChartData {
    key: string;
    sales: number;
}

export interface PurchaseChartData {
    key: string;
    purchases: number;
}

export interface StockChartData {
    key: string;
    value: number;
    nameKey: string;
}

// Expense Module Types
export enum ExpenseType {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
}

export enum ExpenseCategory {
  RENT = 'RENT', // Loyer
  SALARIES = 'SALARIES', // Salaires
  ADVERTISING = 'ADVERTISING', // Publicité
  TRANSPORT = 'TRANSPORT', // Transport / logistique
  SERVICES = 'SERVICES', // Services informatiques, comptables et Fiscaux
  INSURANCE = 'INSURANCE', // Assurances
  PURCHASE_COST = 'PURCHASE_COST', // Coût d’achat
  COMMISSIONS = 'COMMISSIONS', // Commissions sur ventes
  PACKAGING = 'PACKAGING', // Emballages
  TRANSACTION_FEES = 'TRANSACTION_FEES', // Frais de transaction
  OTHER = 'OTHER',
}

export interface ExpenseRecord {
  id: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  type: ExpenseType;
  amount: number;
  subsidiaryId: string;
}


// HR Module Types
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum ContractType {
  CDI = 'CDI', // Contrat à durée indéterminée
  CDD = 'CDD', // Contrat à durée déterminée
  FREELANCE = 'FREELANCE',
  INTERNSHIP = 'INTERNSHIP', // Stage
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
}

export enum DocumentType {
  CONTRACT = 'contract',
  ID_CARD = 'idCard',
  WORK_PERMIT = 'workPermit',
  DIPLOMA = 'diploma',
}

export enum PaymentMethod {
    BANK_TRANSFER = 'BANK_TRANSFER',
    CHECK = 'CHECK',
    CASH = 'CASH',
}

export enum CustomerPaymentMethod {
  CARD = 'CARD',
  ORANGE_MONEY = 'ORANGE_MONEY',
  WAVE = 'WAVE',
  MOBILE_MONEY = 'MOBILE_MONEY',
  PAYCAAP = 'PAYCAAP',
  PAY_ON_DELIVERY = 'PAY_ON_DELIVERY',
  CUSTOMER_CREDIT = 'CUSTOMER_CREDIT',
}

export interface EmployeeDocument {
    name: string;
    url: string;
}

export interface Employee {
    id: string;
    subsidiaryId: string;
    // Personal Info
    lastName: string;
    firstName: string;
    birthDate: string;
    gender: Gender;
    address: string;
    phone: string;
    email: string;
    nationality: string;
    socialSecurityNumber: string;
    // Professional Info
    positions: string;
    department: string;
    hireDate: string;
    contractType: ContractType;
    status: EmployeeStatus;
    managerId: string | null;
    workLocation: string;
    // Salary Info
    baseSalary: number;
    bonus: number;
    benefits: string[];
    lastSalaryAdjustmentDate: string | null;
    paymentMethod: PaymentMethod;
    // Documents
    documents: {
        contract: EmployeeDocument | null;
        idCard: EmployeeDocument | null;
        workPermit: EmployeeDocument | null;
        diplomas: EmployeeDocument[];
    };
    // Career
    positionHistory: {
        position: string;
        department: string;
        startDate: string;
        endDate: string | null;
    }[];
    trainings: {
        name: string;
        date: string;
        provider: string;
    }[];
    performanceReviews: {
        date: string;
        reviewer: string;
        rating: number; // 1-5
        comments: string;
    }[];
    leaveBalance: {
        annual: number;
        sick: number;
        personal: number;
        maternity: number;
        paternity: number;
        other: number;
    };
    leaveRecords: LeaveRecord[];
}

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  UNPAID = 'UNPAID',
}

export interface LeaveRecord {
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
}

export type EmployeeFormData = Omit<Employee, 'id' | 'subsidiaryId' | 'positionHistory' | 'trainings' | 'performanceReviews'> & {
    documents: {
        contract: {name: string, url: string, file: File | null} | null;
        idCard: {name: string, url: string, file: File | null} | null;
        workPermit: {name: string, url: string, file: File | null} | null;
        diplomas: {name: string, url: string, file: File | null}[];
    };
    leaveBalance: {
        annual: number;
        sick: number;
        personal: number;
        maternity: number;
        paternity: number;
        other: number;
    };
    leaveRecords: LeaveRecord[];
};


export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT_JUSTIFIED = 'ABSENT_JUSTIFIED',
    ABSENT_UNJUSTIFIED = 'ABSENT_UNJUSTIFIED',
    HOLIDAY = 'HOLIDAY',
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    attendanceDate: string;
    status: AttendanceStatus;
    arrivalTime: string | null;
    departureTime: string | null;
    breakStartTime: string | null;
    breakEndTime: string | null;
    signature: string | null;
    subsidiaryId: string;
}

export enum PayrollStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
}

export interface PayrollRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    subsidiaryId: string;
    period: string; // e.g. "2024-07"
    baseSalary: number;
    grossSalary: number;
    bonus: number;
    deductions: {
        social: number;
        tax: number;
        absences: number;
    };
    calculatedDeductions?: {
        social: number;
        tax: number;
        absences: number;
    };
    netSalary: number;
    paymentDate: string | null;
    status: PayrollStatus;
    signature: string | null;
    createdAt: string;
    updatedAt: string;
}

export enum AbsenceType {
    JUSTIFIED = 'JUSTIFIED',
    UNJUSTIFIED = 'UNJUSTIFIED',
}

export interface AbsenceRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    typeAbsence: AbsenceType;
    startDate: string;
    endDate: string;
    reason: string;
    documentUrl: string | null;
    subsidiaryId: string;
}

// Secretariat Module Types
export enum DocumentCategory {
    LEGAL = 'LEGAL',
    FINANCIAL = 'FINANCIAL',
    HR = 'HR',
    CONTRACT = 'CONTRACT',
    OTHER = 'OTHER',
}

export enum DocumentStatus {
    DRAFT = 'DRAFT',
    FINAL = 'FINAL',
    ARCHIVED = 'ARCHIVED',
}

export interface CompanyDocument {
    id: string;
    name: string;
    category: DocumentCategory;
    uploadDate: string;
    status: DocumentStatus;
    fileUrl: string;
    subsidiaryId: string;
}

export interface Meeting {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    participants: string[]; // array of employee IDs
    agenda: string;
    minutes: string;
    subsidiaryId: string;
}

export enum SecretariatTaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export interface SecretariatTask {
    id: string;
    title: string;
    description: string;
    assignedToId: string; // employee ID
    dueDate: string;
    status: SecretariatTaskStatus;
    subsidiaryId: string;
}

// CRM Types

export enum OpportunityStage {
    QUALIFICATION = 'QUALIFICATION',
    PROPOSAL = 'PROPOSAL',
    NEGOTIATION = 'NEGOTIATION',
    WON = 'WON',
    LOST = 'LOST',
}

export interface Opportunity {
    id: string;
    opportunityName: string;
    contactId: string;
    accountId: string;
    opportunityValue: number;
    stage: OpportunityStage;
    products: Product[];
    closeDate: string;
    userId: string;
    subsidiaryId: string;
     productIds: string[];
    source?: 'manual' | 'web_order' | 'quote_request';
}

export enum InteractionType {
    CALL = 'CALL',
    EMAIL = 'EMAIL',
    MEETING = 'MEETING',
    OTHER = 'OTHER',
}

export interface Interaction {
    id: string;
    contactId: string;
    date: string;
    type: InteractionType;
    notes: string;
    userId: string;
}

export enum CrmTaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export enum CrmTaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

export interface CrmTask {
    id: string;
    title: string;
    description: string;
    contactId: string;
    opportunityId?: string;
    userId: string;
    dueDate: string;
    status: CrmTaskStatus;
    priority: CrmTaskPriority;
}

export enum LeadStatus {
    NEW = 'NEW',
    CONTACTED = 'CONTACTED',
    QUALIFIED = 'QUALIFIED',
    LOST = 'LOST',
}

export interface Lead {
    id: string;
    leadName: string;
    company: string;
    email: string;
    phone: string;
    status: LeadStatus;
    subsidiaryId: string;
    salesRepId?: string;
    description?: string;
}

export interface Account {
    id: string;
    accountName: string;
    industry: string;
    phone: string;
    address: string;
    subsidiaryId: string;
    salesRepId?: string;
}

export enum ContractStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED'
}
export interface Contract {
    id: string;
    title: string;
    clientId: string;
    startDate: string;
    endDate: string;
    amount: number;
    status: ContractStatus;
    subsidiaryId: string;
}

export interface FixedAsset {
    id: string;
    name: string;
    acquisitionDate: string;
    acquisitionCost: number;
    depreciationRate: number; // yearly percentage
    subsidiaryId: string;
}

export interface LongTermDebt {
    id: string;
    name: string;
    initialAmount: number;
    currentBalance: number;
    interestRate: number;
    maturityDate: string;
    subsidiaryId: string;
}

export enum EquipmentStatus {
    OPERATIONAL = 'OPERATIONAL',
    NEEDS_MAINTENANCE = 'NEEDS_MAINTENANCE',
    OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export interface MaintenanceRecord {
    id: string;
    maintenanceDate: string;
    technician: string;
    description: string;
    maintenanceCost: number;
}
export interface Equipment {
    id: string; 
    equipmentName: string;
    status: EquipmentStatus;
    lastMaintenanceDate: Date;
    nextMaintenanceDate: Date;
    maintenanceHistory: MaintenanceRecord[];
    subsidiaryId: string;
    acquisitionDate: Date;
    acquisitionValue: number;
}

export interface TaxRate {
  id: string;
  taxRatesName: string;
  rate: number; // e.g., 0.1925 for 19.25%
  isDefault: boolean;
  description?: string;
}