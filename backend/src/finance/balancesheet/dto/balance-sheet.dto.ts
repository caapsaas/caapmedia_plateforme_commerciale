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
    shareCapital: number;
    netIncome: number;
  };
  totalLiabilities: number;
}
