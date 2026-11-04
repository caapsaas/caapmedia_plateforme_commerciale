"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProformaDeliveryService = void 0;
exports.normalizeWhatsAppPhone = normalizeWhatsAppPhone;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const proforma_pdf_service_1 = require("./proforma-pdf.service");
const proforma_mailer_service_1 = require("./proforma-mailer.service");
const include = {
    items: { orderBy: { id: 'asc' }, include: { product: true } },
    subsidiary: true,
};
const sendable = [
    client_1.ProformaStatus.DRAFT,
    client_1.ProformaStatus.SENT,
    client_1.ProformaStatus.VIEWED,
];
function normalizeWhatsAppPhone(raw) {
    let phone = raw.trim().replace(/[\s().-]/g, '');
    if (phone.startsWith('+'))
        phone = phone.slice(1);
    else if (phone.startsWith('00'))
        phone = phone.slice(2);
    else if (/^[26]\d{8}$/.test(phone))
        phone = `237${phone}`;
    if (!/^[1-9]\d{7,14}$/.test(phone))
        throw new common_1.BadRequestException('Renseignez un numéro WhatsApp avec son indicatif pays.');
    return phone;
}
function version(quote) {
    const { proformaNumber, clientName, clientEmail, clientPhone, clientCompany, subtotal, taxRate, taxAmount, totalAmount, validityDate, notes, createdAt, } = quote;
    return (0, crypto_1.createHash)('sha256')
        .update(JSON.stringify({
        proformaNumber,
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        validityDate,
        notes,
        createdAt,
        subsidiary: {
            name: quote.subsidiary.subsidiaryName,
            address: quote.subsidiary.address,
            phone: quote.subsidiary.phone,
            email: quote.subsidiary.email,
            rccm: quote.subsidiary.rccm,
            ifu: quote.subsidiary.ifu,
            bankName: quote.subsidiary.bankName,
            accountNumber: quote.subsidiary.accountNumber,
        },
        items: quote.items.map((item) => ({
            id: item.id,
            name: item.product.name,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            description: item.description,
        })),
    }))
        .digest('hex');
}
let ProformaDeliveryService = class ProformaDeliveryService {
    prisma;
    pdf;
    mailer;
    jwt = new jwt_1.JwtService();
    constructor(prisma, pdf, mailer) {
        this.prisma = prisma;
        this.pdf = pdf;
        this.mailer = mailer;
    }
    key() {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32)
            throw new common_1.ServiceUnavailableException('Le partage de proformas n’est pas configuré.');
        return (0, crypto_1.createHmac)('sha256', secret)
            .update('caapmedia-proforma-sharing-v1')
            .digest('hex');
    }
    async authorized(id, user) {
        const quote = await this.prisma.proforma.findUnique({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
            include,
        });
        if (!quote)
            throw new common_1.NotFoundException('Proforma introuvable.');
        if (!sendable.includes(quote.status) || quote.validityDate <= new Date())
            throw new common_1.BadRequestException('Cette proforma ne peut plus être envoyée.');
        return quote;
    }
    async email(id, user, expectedRecipient) {
        const quote = await this.authorized(id, user);
        if (quote.clientEmail !== expectedRecipient)
            throw new common_1.ConflictException('Les coordonnées du client ont changé. Actualisez la proforma avant de l’envoyer.');
        await this.mailer.send(quote, await this.pdf.render(quote));
        await this.prisma.proforma.updateMany({
            where: {
                id,
                subsidiaryId: quote.subsidiaryId,
                status: client_1.ProformaStatus.DRAFT,
            },
            data: { status: client_1.ProformaStatus.SENT, sentAt: new Date() },
        });
        return { channel: 'email', recipient: quote.clientEmail, success: true };
    }
    async whatsapp(id, user) {
        const quote = await this.authorized(id, user);
        const phone = normalizeWhatsAppPhone(quote.clientPhone);
        const seconds = Math.max(1, Math.min(7 * 86400, Math.floor((quote.validityDate.getTime() - Date.now()) / 1000)));
        const token = this.jwt.sign({ sub: id, version: version(quote) }, {
            secret: this.key(),
            algorithm: 'HS256',
            audience: 'proforma-sharing',
            issuer: 'caapmedia',
            expiresIn: seconds,
        });
        let base;
        try {
            base = process.env.PUBLIC_API_URL || '';
            if (!base) {
                const origin = new URL(process.env.FRONTEND_URL || 'https://caapmedia.com');
                if (['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))
                    origin.port = process.env.PORT || '3000';
                base = `${origin.origin}/api-caapmedia`;
            }
            const configured = new URL(base);
            if (!['https:', 'http:'].includes(configured.protocol) ||
                (configured.protocol === 'http:' &&
                    !['localhost', '127.0.0.1', '[::1]'].includes(configured.hostname)) ||
                configured.search ||
                configured.hash ||
                configured.username ||
                configured.password)
                throw new Error();
        }
        catch {
            throw new common_1.ServiceUnavailableException('L’adresse de partage des proformas est invalide.');
        }
        const downloadUrl = `${base.replace(/\/+$/, '')}/proforma-share/${token}`;
        const message = `Bonjour ${quote.clientName},\nVoici votre facture proforma n° ${quote.proformaNumber} (${(0, proforma_pdf_service_1.money)(quote.totalAmount)}).\nTélécharger le PDF : ${downloadUrl}\n\n${quote.subsidiary.subsidiaryName}`;
        return {
            phone,
            message,
            downloadUrl,
            whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
            expiresAt: new Date(Date.now() + seconds * 1000).toISOString(),
        };
    }
    async sharedDocument(token) {
        let payload;
        try {
            payload = this.jwt.verify(token, {
                secret: this.key(),
                algorithms: ['HS256'],
                audience: 'proforma-sharing',
                issuer: 'caapmedia',
            });
            if (typeof payload.sub !== 'string' ||
                typeof payload.version !== 'string')
                throw new Error();
        }
        catch {
            throw new common_1.NotFoundException('Ce lien est expiré ou indisponible.');
        }
        const quote = await this.prisma.proforma.findUnique({
            where: { id: payload.sub },
            include,
        });
        if (!quote ||
            quote.validityDate <= new Date() ||
            quote.status === client_1.ProformaStatus.REJECTED ||
            quote.status === client_1.ProformaStatus.EXPIRED ||
            version(quote) !== payload.version)
            throw new common_1.NotFoundException('Ce lien est expiré ou indisponible.');
        return { quote, buffer: await this.pdf.render(quote) };
    }
};
exports.ProformaDeliveryService = ProformaDeliveryService;
exports.ProformaDeliveryService = ProformaDeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        proforma_pdf_service_1.ProformaPdfService,
        proforma_mailer_service_1.ProformaMailerService])
], ProformaDeliveryService);
//# sourceMappingURL=proforma-delivery.service.js.map