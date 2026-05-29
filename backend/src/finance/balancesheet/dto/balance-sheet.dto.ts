export class BalanceSheetDto {
  assets: {
    treasury: number;
    customerReceivables: number;
    inventory: number;
    equipments: number;
    fixedAssets: number;
  };
  totalAssets: number;
  liabilities: {
    supplierDebts: number;
    longTermDebts: number;
  };
  totalLiabilities: number;
  equity: {
    shareCapital: number;
    retainedEarnings: number;
  };
  totalEquity: number;
  // Doit satisfaire : totalAssets = totalLiabilities + totalEquity
}
