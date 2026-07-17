/**
 * ID Prefixes Catalog - Maps entity types to their semantic prefixes
 * All prefixes must be unique and 3 characters
 */
export const ID_PREFIXES = {
  // Core
  SUBSIDIARY: 'SUB',
  USER: 'USR',

  // HR Module
  EMPLOYEE: 'EMP',
  ATTENDANCE: 'ATN',
  ABSENCE: 'ABS',
  PAYROLL: 'PAY',
  EMPLOYEELEAVEBALANCE: 'ELB',

  // E-commerce
  PRODUCT: 'PRD',
  ORDER: 'ORD',
  SALE: 'SAL',
  ORDERITEM: 'OIT',
  PRODUCTOPTION: 'POO',
  ORDERPRODUCTIONHISTORY: 'OPH',
  PROFORMA: 'PRF',
  PROFORMAITEM: 'PFI',

  // CRM
  ACCOUNT: 'ACC',
  CONTACT: 'CNT',
  LEAD: 'LED',
  OPPORTUNITY: 'OPP',
  CRMTASK: 'TSK',
  INTERACTION: 'INT',
  CONTRACT: 'CTR',
  MEETING: 'MTG',

  // Finance & Accounting
  TREASURY: 'TRS',
  EXPENSE: 'EXP',
  EXTERNALTRANSACTION: 'ETX',
  PREFINANCEMENT: 'PRE',
  PREFINACC: 'PFA',
  PREFINTX: 'PFT',
  CREDITACCOUNT: 'CRA',
  SUPPLIERDEBT: 'SDT',
  LONGTERDEBT: 'LTD',
  ASSET: 'AST',
  FIXEDASSET: 'FAS',
  TAXRATE: 'TAX',

  // Accounting Module
  ACCOUNTINGACCOUNT: 'ACO',
  ACCOUNTINGJOURNALS: 'AJN',
  JOURNALENTRY: 'JNE',
  ACCOUNTINGPERIOD: 'APD',
  FISCALYEAR: 'FYR',
  ACCOUNTMAPPING: 'AMP',
  BALANCESHEET: 'BLS',
  INCOMESTATEMENT: 'INC',

  // Purchase
  SUPPLIER: 'SUP',
  PURCHASEORDER: 'POR',
  PURCHASEORDERITEM: 'POI',

  // Maintenance
  EQUIPMENT: 'EQP',
  MAINTENANCERECORD: 'MNT',

  // Notifications & Misc
  NOTIFICATION: 'NOT',
  COMPANYDOCUMENT: 'DOC',
  SECRETARIATASK: 'SEC',

  // Analytics & Reports
  REPORT: 'RPT',

  // Newsletter
  NEWSLETTER: 'NWS',
} as const;

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];
