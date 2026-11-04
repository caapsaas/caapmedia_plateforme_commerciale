import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderStatusDto } from './dto/create-purchase-order.dto';
import { Prisma, User } from '@prisma/client';
import { FindAllPurchaseOrdersDto } from './dto/find-all-purchase-orders.dto';
import { ReceiveItemsDto } from './dto/receive-items.dto';
export declare class PurchaseOrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createPurchaseOrderDto: CreatePurchaseOrderDto, authenticatedUser: User): Promise<{
        purchaseOrderItems: {
            id: string;
            productId: string;
            productName: string;
            quantity: number;
            quantityReceived: number;
            purchasePrice: Prisma.Decimal;
            purchaseUnitId: string | null;
            purchaseOrderId: string;
        }[];
        purchaseOrderHistory: {
            id: string;
            purchaseOrderId: string;
            eventName: string;
            eventDate: Date;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        supplierName: string;
        orderDate: Date;
        expectedDeliveryDate: Date;
        totalAmount: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        supplierId: string;
        paymentTerms: import("@prisma/client").$Enums.PaymentTerms;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
    }>;
    findAll(user: User, query: FindAllPurchaseOrdersDto): Promise<{
        data: {
            totalAmount: number;
            amountPaid: number;
            subsidiary: {
                id: string;
                subsidiaryName: string;
            };
            items: {
                purchasePrice: number;
                product: {
                    baseUnit: {
                        symbol: string | null;
                        id: string;
                        name: string;
                    };
                } & {
                    type: import("@prisma/client").$Enums.ItemType;
                    description: string;
                    id: string;
                    name: string;
                    category: string;
                    productRange: string | null;
                    isActive: boolean;
                    isVisibleOnSite: boolean;
                    displayOrder: number | null;
                    sku: string | null;
                    minThreshold: Prisma.Decimal | null;
                    stockManaged: boolean;
                    mainSupplierId: string | null;
                    baseUnitId: string | null;
                };
                purchaseUnit: {
                    symbol: string | null;
                    id: string;
                    name: string;
                };
                id: string;
                productId: string;
                productName: string;
                quantity: number;
                quantityReceived: number;
                purchaseUnitId: string | null;
                purchaseOrderId: string;
            }[];
            history: {
                date: Date;
                event: string;
            }[];
            supplierDebts: {
                amount: number;
                id: string;
                subsidiaryId: string;
                status: import("@prisma/client").$Enums.DebtStatus;
                supplierName: string;
                purchaseOrderId: string;
                invoiceId: string;
                dueDate: Date;
                invoiceUrl: string | null;
            }[];
            purchaseOrderItems: ({
                product: {
                    baseUnit: {
                        symbol: string | null;
                        id: string;
                        name: string;
                    };
                } & {
                    type: import("@prisma/client").$Enums.ItemType;
                    description: string;
                    id: string;
                    name: string;
                    category: string;
                    productRange: string | null;
                    isActive: boolean;
                    isVisibleOnSite: boolean;
                    displayOrder: number | null;
                    sku: string | null;
                    minThreshold: Prisma.Decimal | null;
                    stockManaged: boolean;
                    mainSupplierId: string | null;
                    baseUnitId: string | null;
                };
                purchaseUnit: {
                    symbol: string | null;
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                productId: string;
                productName: string;
                quantity: number;
                quantityReceived: number;
                purchasePrice: Prisma.Decimal;
                purchaseUnitId: string | null;
                purchaseOrderId: string;
            })[];
            supplier: {
                id: string;
                address: string;
                phone: string;
                email: string;
                subsidiaryId: string;
                company: string;
                supplierName: string;
            };
            purchaseOrderHistory: {
                id: string;
                purchaseOrderId: string;
                eventName: string;
                eventDate: Date;
            }[];
            id: string;
            subsidiaryId: string;
            status: import("@prisma/client").$Enums.PurchaseOrderStatus;
            supplierName: string;
            orderDate: Date;
            expectedDeliveryDate: Date;
            supplierId: string;
            paymentTerms: import("@prisma/client").$Enums.PaymentTerms;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    findOne(id: string, user: User): Promise<{
        totalAmount: number;
        amountPaid: number;
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        items: {
            purchasePrice: number;
            product: {
                baseUnit: {
                    symbol: string | null;
                    id: string;
                    name: string;
                };
            } & {
                type: import("@prisma/client").$Enums.ItemType;
                description: string;
                id: string;
                name: string;
                category: string;
                productRange: string | null;
                isActive: boolean;
                isVisibleOnSite: boolean;
                displayOrder: number | null;
                sku: string | null;
                minThreshold: Prisma.Decimal | null;
                stockManaged: boolean;
                mainSupplierId: string | null;
                baseUnitId: string | null;
            };
            purchaseUnit: {
                symbol: string | null;
                id: string;
                name: string;
            };
            id: string;
            productId: string;
            productName: string;
            quantity: number;
            quantityReceived: number;
            purchaseUnitId: string | null;
            purchaseOrderId: string;
        }[];
        history: {
            date: Date;
            event: string;
        }[];
        supplierDebts: {
            amount: number;
            id: string;
            subsidiaryId: string;
            status: import("@prisma/client").$Enums.DebtStatus;
            supplierName: string;
            purchaseOrderId: string;
            invoiceId: string;
            dueDate: Date;
            invoiceUrl: string | null;
        }[];
        purchaseOrderItems: ({
            product: {
                baseUnit: {
                    symbol: string | null;
                    id: string;
                    name: string;
                };
            } & {
                type: import("@prisma/client").$Enums.ItemType;
                description: string;
                id: string;
                name: string;
                category: string;
                productRange: string | null;
                isActive: boolean;
                isVisibleOnSite: boolean;
                displayOrder: number | null;
                sku: string | null;
                minThreshold: Prisma.Decimal | null;
                stockManaged: boolean;
                mainSupplierId: string | null;
                baseUnitId: string | null;
            };
            purchaseUnit: {
                symbol: string | null;
                id: string;
                name: string;
            };
        } & {
            id: string;
            productId: string;
            productName: string;
            quantity: number;
            quantityReceived: number;
            purchasePrice: Prisma.Decimal;
            purchaseUnitId: string | null;
            purchaseOrderId: string;
        })[];
        supplier: {
            id: string;
            address: string;
            phone: string;
            email: string;
            subsidiaryId: string;
            company: string;
            supplierName: string;
        };
        purchaseOrderHistory: {
            id: string;
            purchaseOrderId: string;
            eventName: string;
            eventDate: Date;
        }[];
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        supplierName: string;
        orderDate: Date;
        expectedDeliveryDate: Date;
        supplierId: string;
        paymentTerms: import("@prisma/client").$Enums.PaymentTerms;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
    }>;
    private mapToResponse;
    receiveItems(id: string, receiveItemsDto: ReceiveItemsDto, authenticatedUser: User): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        supplierName: string;
        orderDate: Date;
        expectedDeliveryDate: Date;
        totalAmount: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        supplierId: string;
        paymentTerms: import("@prisma/client").$Enums.PaymentTerms;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
    }>;
    updateStatus(id: string, updateStatusDto: UpdatePurchaseOrderStatusDto, authenticatedUser: User): Promise<{
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        supplierName: string;
        orderDate: Date;
        expectedDeliveryDate: Date;
        totalAmount: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        supplierId: string;
        paymentTerms: import("@prisma/client").$Enums.PaymentTerms;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
    }>;
}
