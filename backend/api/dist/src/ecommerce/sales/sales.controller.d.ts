import { SalesService } from './sales.service';
import { CreateDirectSaleDto } from './dto/create-sale.dto';
import { FindAllSalesDto } from './dto/find-all-sales.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    createDirectSale(createDirectSaleDto: CreateDirectSaleDto, req: any): Promise<{
        message: string;
        orderId: string;
    }>;
    findAll(query: FindAllSalesDto, req: any): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        id: string;
        taxRate: import("@prisma/client/runtime/library").Decimal;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.SaleStatus;
        paymentMethod: import("@prisma/client").$Enums.CustomerPaymentMethod;
        salesRepId: string | null;
        productName: string;
        quantity: number;
        customerName: string;
        customerId: string;
        orderId: string | null;
        specValues: import("@prisma/client/runtime/library").JsonValue | null;
        specSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        saleDate: Date;
    }>>;
}
