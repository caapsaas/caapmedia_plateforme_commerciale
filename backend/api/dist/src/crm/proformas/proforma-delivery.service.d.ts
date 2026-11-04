import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { ProformaPdfService } from './proforma-pdf.service';
import { ProformaMailerService } from './proforma-mailer.service';
export declare function normalizeWhatsAppPhone(raw: string): string;
export declare class ProformaDeliveryService {
    private readonly prisma;
    private readonly pdf;
    private readonly mailer;
    private readonly jwt;
    constructor(prisma: PrismaService, pdf: ProformaPdfService, mailer: ProformaMailerService);
    private key;
    private authorized;
    email(id: string, user: JwtUser, expectedRecipient: string): Promise<{
        channel: string;
        recipient: string;
        success: boolean;
    }>;
    whatsapp(id: string, user: JwtUser): Promise<{
        phone: string;
        message: string;
        downloadUrl: string;
        whatsappUrl: string;
        expiresAt: string;
    }>;
    sharedDocument(token: string): Promise<{
        quote: {
            items: ({
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
                    minThreshold: import("@prisma/client/runtime/library").Decimal | null;
                    stockManaged: boolean;
                    mainSupplierId: string | null;
                    baseUnitId: string | null;
                };
            } & {
                description: string | null;
                id: string;
                productId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                proformaId: string;
            })[];
            subsidiary: {
                id: string;
                subsidiaryName: string;
                logoSvg: string;
                address: string;
                phone: string;
                email: string;
                ifu: string;
                rccm: string;
                bankName: string;
                accountNumber: string;
                swiftCode: string;
                shareCapital: import("@prisma/client/runtime/library").Decimal;
                isHeadquarter: boolean;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                workingDays: number[];
                latitude: number | null;
                longitude: number | null;
                geofenceRadius: number;
            };
        } & {
            id: string;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            subsidiaryId: string;
            status: import("@prisma/client").$Enums.ProformaStatus;
            notes: string | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
            opportunityId: string | null;
            createdAt: Date;
            createdBy: string;
            clientName: string;
            leadId: string;
            clientEmail: string;
            clientPhone: string;
            clientCompany: string | null;
            proformaNumber: string;
            validityDate: Date;
            sentAt: Date | null;
            viewedAt: Date | null;
            acceptedAt: Date | null;
        };
        buffer: Buffer<ArrayBufferLike>;
    }>;
}
