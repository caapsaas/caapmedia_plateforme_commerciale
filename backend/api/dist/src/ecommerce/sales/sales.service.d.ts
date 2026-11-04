import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateDirectSaleDto } from './dto/create-sale.dto';
import { FindAllSalesDto } from './dto/find-all-sales.dto';
import { Prisma } from '@prisma/client';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';
export declare class SalesService {
    private readonly prisma;
    private readonly productSpecsService;
    private readonly orderNotifications;
    constructor(prisma: PrismaService, productSpecsService: ProductSpecsService, orderNotifications: OrderNotificationsService);
    createDirectSale(createDirectSaleDto: CreateDirectSaleDto, user: any): Promise<{
        message: string;
        orderId: string;
    }>;
    findAll(user: any, query: FindAllSalesDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
        id: string;
        taxRate: Prisma.Decimal;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.SaleStatus;
        paymentMethod: import("@prisma/client").$Enums.CustomerPaymentMethod;
        salesRepId: string | null;
        productName: string;
        quantity: number;
        customerName: string;
        customerId: string;
        orderId: string | null;
        specValues: Prisma.JsonValue | null;
        specSnapshot: Prisma.JsonValue | null;
        totalPrice: Prisma.Decimal;
        saleDate: Date;
    }>>;
}
