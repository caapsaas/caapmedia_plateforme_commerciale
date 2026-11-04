"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProformaMailerService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const nodemailer = __importStar(require("nodemailer"));
const proforma_pdf_service_1 = require("./proforma-pdf.service");
let ProformaMailerService = class ProformaMailerService {
    async send(quote, pdf) {
        const host = process.env.SMTP_HOST;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const port = Number(process.env.SMTP_PORT || 587);
        if (!host ||
            !user ||
            !pass ||
            !Number.isInteger(port) ||
            port < 1 ||
            port > 65535) {
            throw new common_1.ServiceUnavailableException('L’envoi d’e-mails n’est pas configuré. Contactez un administrateur.');
        }
        if (!(0, class_validator_1.isEmail)(quote.clientEmail))
            throw new common_1.ServiceUnavailableException('L’adresse e-mail du client est invalide.');
        const secure = process.env.SMTP_SECURE === 'true' ||
            (process.env.SMTP_SECURE === undefined && port === 465);
        const transport = nodemailer.createTransport({
            host,
            port,
            secure,
            requireTLS: !secure,
            auth: { user, pass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 30000,
            disableFileAccess: true,
            disableUrlAccess: true,
        });
        try {
            const result = await transport.sendMail({
                from: process.env.SMTP_FROM || user,
                to: { address: quote.clientEmail, name: quote.clientName },
                ...((0, class_validator_1.isEmail)(quote.subsidiary.email)
                    ? { replyTo: quote.subsidiary.email }
                    : {}),
                subject: `Votre facture proforma ${quote.proformaNumber.replace(/[\r\n]/g, ' ')}`,
                text: `Bonjour ${quote.clientName},\n\nVeuillez trouver en pièce jointe votre facture proforma ${quote.proformaNumber}.\n\nNous restons à votre disposition.\n${quote.subsidiary.subsidiaryName}`,
                attachments: [
                    {
                        filename: (0, proforma_pdf_service_1.proformaFilename)(quote.proformaNumber),
                        content: pdf,
                        contentType: 'application/pdf',
                    },
                ],
            });
            if (!result.accepted.length || result.rejected.length)
                throw new Error('Recipient rejected');
        }
        catch {
            throw new common_1.ServiceUnavailableException('L’e-mail n’a pas pu être transmis. Réessayez ou contactez un administrateur.');
        }
        finally {
            transport.close();
        }
    }
};
exports.ProformaMailerService = ProformaMailerService;
exports.ProformaMailerService = ProformaMailerService = __decorate([
    (0, common_1.Injectable)()
], ProformaMailerService);
//# sourceMappingURL=proforma-mailer.service.js.map