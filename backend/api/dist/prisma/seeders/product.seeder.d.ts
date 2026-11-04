import { PrismaClient } from '@prisma/client';
interface StockProductSeedData {
    name: string;
    category: string;
    description: string;
    stock: number;
    price: number;
    warehouse: string;
    subsidiaryEmail: string;
    range: string;
    baseUnit: string;
    packagingUnit?: {
        name: string;
        conversionFactor: number;
    };
}
declare const STOCK_PRODUCTS_DATA: StockProductSeedData[];
declare function runProductSeeder(prisma: PrismaClient): Promise<void>;
export { runProductSeeder };
export { STOCK_PRODUCTS_DATA };
