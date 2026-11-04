import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
export declare class OpportunitiesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toResponse;
    private accessWhere;
    private findAccessible;
    private validateReferences;
    private validateProducts;
    create(dto: CreateOpportunityDto, user: JwtUser): Promise<{
        crmTasks: {
            description: string | null;
            title: string;
            id: string;
            status: import("@prisma/client").$Enums.CrmTaskStatus;
            dueDate: Date;
            opportunityId: string | null;
            contactId: string;
            userId: string;
            priority: import("@prisma/client").$Enums.CrmTaskPriority;
        }[];
        user: {
            id: string;
            email: string;
            userName: string;
        };
        account: {
            id: string;
            address: string;
            phone: string;
            subsidiaryId: string;
            salesRepId: string;
            accountName: string;
            industry: string;
        };
        contact: {
            id: string;
            address: string;
            phone: string;
            email: string;
            subsidiaryId: string;
            status: import("@prisma/client").$Enums.ContactStatus;
            contactName: string;
            company: string;
            accountId: string;
            salesRepId: string;
        };
        products: ({
            product: {
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
        } & {
            id: string;
            productId: string;
            opportunityId: string;
        })[];
    } & {
        id: string;
        subsidiaryId: string;
        accountId: string;
        opportunityName: string;
        opportunityValue: Prisma.Decimal;
        closeDate: Date;
        contactId: string;
        userId: string;
        stage: import("@prisma/client").$Enums.OpportunityStage;
        sourceOpportunity: import("@prisma/client").$Enums.OpportunitySource | null;
    } & {
        opportunityValue: number;
        productIds: string[];
        products: {
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
        }[];
    }>;
    findAll(user: JwtUser, paginationQuery?: PaginationQueryDto): Promise<{
        data: ({
            user: {
                id: string;
                email: string;
                userName: string;
            };
            account: {
                id: string;
                address: string;
                phone: string;
                subsidiaryId: string;
                salesRepId: string;
                accountName: string;
                industry: string;
            };
            contact: {
                id: string;
                address: string;
                phone: string;
                email: string;
                subsidiaryId: string;
                status: import("@prisma/client").$Enums.ContactStatus;
                contactName: string;
                company: string;
                accountId: string;
                salesRepId: string;
            };
            products: ({
                product: {
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
            } & {
                id: string;
                productId: string;
                opportunityId: string;
            })[];
        } & {
            id: string;
            subsidiaryId: string;
            accountId: string;
            opportunityName: string;
            opportunityValue: Prisma.Decimal;
            closeDate: Date;
            contactId: string;
            userId: string;
            stage: import("@prisma/client").$Enums.OpportunityStage;
            sourceOpportunity: import("@prisma/client").$Enums.OpportunitySource | null;
        } & {
            opportunityValue: number;
            productIds: string[];
            products: {
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
            }[];
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    findOne(id: string, user: JwtUser): Promise<{
        crmTasks: {
            description: string | null;
            title: string;
            id: string;
            status: import("@prisma/client").$Enums.CrmTaskStatus;
            dueDate: Date;
            opportunityId: string | null;
            contactId: string;
            userId: string;
            priority: import("@prisma/client").$Enums.CrmTaskPriority;
        }[];
        user: {
            id: string;
            email: string;
            userName: string;
        };
        account: {
            id: string;
            address: string;
            phone: string;
            subsidiaryId: string;
            salesRepId: string;
            accountName: string;
            industry: string;
        };
        contact: {
            id: string;
            address: string;
            phone: string;
            email: string;
            subsidiaryId: string;
            status: import("@prisma/client").$Enums.ContactStatus;
            contactName: string;
            company: string;
            accountId: string;
            salesRepId: string;
        };
        products: ({
            product: {
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
        } & {
            id: string;
            productId: string;
            opportunityId: string;
        })[];
    } & {
        id: string;
        subsidiaryId: string;
        accountId: string;
        opportunityName: string;
        opportunityValue: Prisma.Decimal;
        closeDate: Date;
        contactId: string;
        userId: string;
        stage: import("@prisma/client").$Enums.OpportunityStage;
        sourceOpportunity: import("@prisma/client").$Enums.OpportunitySource | null;
    } & {
        opportunityValue: number;
        productIds: string[];
        products: {
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
        }[];
    }>;
    update(id: string, dto: UpdateOpportunityDto, user: JwtUser): Promise<{
        crmTasks: {
            description: string | null;
            title: string;
            id: string;
            status: import("@prisma/client").$Enums.CrmTaskStatus;
            dueDate: Date;
            opportunityId: string | null;
            contactId: string;
            userId: string;
            priority: import("@prisma/client").$Enums.CrmTaskPriority;
        }[];
        user: {
            id: string;
            email: string;
            userName: string;
        };
        account: {
            id: string;
            address: string;
            phone: string;
            subsidiaryId: string;
            salesRepId: string;
            accountName: string;
            industry: string;
        };
        contact: {
            id: string;
            address: string;
            phone: string;
            email: string;
            subsidiaryId: string;
            status: import("@prisma/client").$Enums.ContactStatus;
            contactName: string;
            company: string;
            accountId: string;
            salesRepId: string;
        };
        products: ({
            product: {
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
        } & {
            id: string;
            productId: string;
            opportunityId: string;
        })[];
    } & {
        id: string;
        subsidiaryId: string;
        accountId: string;
        opportunityName: string;
        opportunityValue: Prisma.Decimal;
        closeDate: Date;
        contactId: string;
        userId: string;
        stage: import("@prisma/client").$Enums.OpportunityStage;
        sourceOpportunity: import("@prisma/client").$Enums.OpportunitySource | null;
    } & {
        opportunityValue: number;
        productIds: string[];
        products: {
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
        }[];
    }>;
    remove(id: string, user: JwtUser): Promise<{
        user: {
            id: string;
            email: string;
            userName: string;
        };
        account: {
            id: string;
            address: string;
            phone: string;
            subsidiaryId: string;
            salesRepId: string;
            accountName: string;
            industry: string;
        };
        contact: {
            id: string;
            address: string;
            phone: string;
            email: string;
            subsidiaryId: string;
            status: import("@prisma/client").$Enums.ContactStatus;
            contactName: string;
            company: string;
            accountId: string;
            salesRepId: string;
        };
        products: ({
            product: {
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
        } & {
            id: string;
            productId: string;
            opportunityId: string;
        })[];
    } & {
        id: string;
        subsidiaryId: string;
        accountId: string;
        opportunityName: string;
        opportunityValue: Prisma.Decimal;
        closeDate: Date;
        contactId: string;
        userId: string;
        stage: import("@prisma/client").$Enums.OpportunityStage;
        sourceOpportunity: import("@prisma/client").$Enums.OpportunitySource | null;
    } & {
        opportunityValue: number;
        productIds: string[];
        products: {
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
        }[];
    }>;
}
