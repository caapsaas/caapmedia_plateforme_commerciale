"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProformaPdfService = void 0;
exports.proformaFilename = proformaFilename;
exports.money = money;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
function proformaFilename(number) {
    return `proforma_${number.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)}.pdf`;
}
function money(value) {
    return `${Number(value)
        .toLocaleString('fr-FR', { maximumFractionDigits: 2 })
        .replace(/[\u00a0\u202f]/g, ' ')} FCFA`;
}
const clean = (value) => (value || '').replace(/\p{Cc}/gu, ' ').replace(/[\u2010-\u2015]/g, '-');
let ProformaPdfService = class ProformaPdfService {
    render(quote) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({
                size: 'A4',
                margin: 48,
                bufferPages: true,
                info: {
                    Title: `Facture proforma ${quote.proformaNumber}`,
                    Author: 'CaapMedia',
                },
            });
            doc.page.margins.bottom = 80;
            doc.on('pageAdded', () => {
                doc.page.margins.bottom = 80;
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            try {
                const width = doc.page.width - 96;
                const ensure = (height) => {
                    if (doc.y + height > doc.page.height - 80)
                        doc.addPage();
                };
                const date = (value) => value.toLocaleDateString('fr-FR', { timeZone: 'Africa/Douala' });
                doc.rect(48, 48, 6, 45).fill('#c6e911');
                doc
                    .font('Helvetica-Bold')
                    .fontSize(25)
                    .fillColor('#172033')
                    .text('CAAPMEDIA', 68, 52);
                doc
                    .font('Helvetica')
                    .fontSize(9)
                    .fillColor('#64748b')
                    .text('Impression et communication', 68, 83);
                doc
                    .font('Helvetica-Bold')
                    .fontSize(13)
                    .fillColor('#172033')
                    .text(clean(quote.subsidiary.subsidiaryName), 48, 120, { width });
                doc
                    .font('Helvetica')
                    .fontSize(9)
                    .fillColor('#475569')
                    .text(clean(quote.subsidiary.address), { width });
                doc.text(`${clean(quote.subsidiary.phone)} | ${clean(quote.subsidiary.email)}`, { width });
                doc.moveDown(1.5);
                doc
                    .font('Helvetica-Bold')
                    .fontSize(20)
                    .fillColor('#172033')
                    .text('FACTURE PROFORMA', { width });
                doc
                    .font('Helvetica')
                    .fontSize(10)
                    .text(`N° ${clean(quote.proformaNumber)}`);
                doc.text(`Date : ${date(quote.createdAt)}    Validité : ${date(quote.validityDate)}`);
                doc.moveDown(1.5);
                doc
                    .font('Helvetica-Bold')
                    .fontSize(9)
                    .fillColor('#64748b')
                    .text('CLIENT');
                doc
                    .fontSize(12)
                    .fillColor('#172033')
                    .text(clean(quote.clientName), { width });
                doc.font('Helvetica').fontSize(10).fillColor('#475569');
                if (quote.clientCompany)
                    doc.text(clean(quote.clientCompany), { width });
                doc.text(clean(quote.clientEmail), { width });
                doc.text(clean(quote.clientPhone), { width });
                doc.moveDown(1.5);
                const xs = [48, 303, 347, 447];
                const widths = [255, 44, 100, width - 399];
                const heading = () => {
                    ensure(34);
                    const y = doc.y;
                    doc.rect(48, y, width, 26).fill('#eef2e0');
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#172033');
                    ['Désignation', 'Qté', 'Prix unitaire', 'Total'].forEach((label, i) => doc.text(label, xs[i] + 6, y + 8, {
                        width: widths[i] - 12,
                        align: i > 1 ? 'right' : i === 1 ? 'center' : 'left',
                    }));
                    doc.y = y + 34;
                };
                heading();
                for (const item of quote.items) {
                    doc.font('Helvetica').fontSize(10);
                    const name = clean(item.product.name);
                    const height = Math.max(28, doc.heightOfString(name, { width: widths[0] - 12 }) + 10);
                    if (doc.y + height > doc.page.height - 80) {
                        doc.addPage();
                        heading();
                    }
                    const y = doc.y;
                    [
                        name,
                        String(item.quantity),
                        money(item.unitPrice),
                        money(item.unitPrice.mul(item.quantity)),
                    ].forEach((value, i) => {
                        doc
                            .font('Helvetica')
                            .fontSize(i > 1 ? 9 : 10)
                            .fillColor('#334155')
                            .text(value, xs[i] + 6, y, {
                            width: widths[i] - 12,
                            align: i > 1 ? 'right' : i === 1 ? 'center' : 'left',
                        });
                    });
                    doc.y = y + height;
                    if (item.description) {
                        doc
                            .fontSize(9)
                            .fillColor('#64748b')
                            .text(clean(item.description), 54, doc.y, {
                            width: width - 12,
                            lineGap: 2,
                        });
                        doc.moveDown(0.5);
                    }
                    doc
                        .moveTo(48, doc.y)
                        .lineTo(48 + width, doc.y)
                        .lineWidth(0.5)
                        .strokeColor('#e2e8f0')
                        .stroke();
                    doc.y += 12;
                }
                ensure(106);
                doc.y += 8;
                for (const [label, value, bold] of [
                    ['Sous-total HT', money(quote.subtotal), false],
                    [
                        `TVA (${quote.taxRate.toString()} %)`,
                        money(quote.taxAmount),
                        false,
                    ],
                    ['TOTAL TTC', money(quote.totalAmount), true],
                ]) {
                    const y = doc.y;
                    doc
                        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
                        .fontSize(bold ? 12 : 10)
                        .fillColor('#172033');
                    doc.text(label, 270, y, { width: 125 });
                    doc.text(value, 395, y, { width: width - 347, align: 'right' });
                    doc.y = y + (bold ? 28 : 22);
                }
                if (quote.notes) {
                    ensure(50);
                    doc.moveDown(1);
                    doc
                        .font('Helvetica-Bold')
                        .fontSize(10)
                        .text('Notes et conditions', 48, doc.y, { width });
                    doc
                        .font('Helvetica')
                        .fontSize(9)
                        .fillColor('#475569')
                        .text(clean(quote.notes), { width, lineGap: 3 });
                }
                const pages = doc.bufferedPageRange();
                for (let page = 0; page < pages.count; page++) {
                    doc.switchToPage(page);
                    doc.page.margins.bottom = 0;
                    const bottom = doc.page.height;
                    doc
                        .moveTo(48, bottom - 63)
                        .lineTo(48 + width, bottom - 63)
                        .strokeColor('#c6e911')
                        .lineWidth(2)
                        .stroke();
                    doc.font('Helvetica').fontSize(7).fillColor('#64748b');
                    doc.text(`RCCM : ${clean(quote.subsidiary.rccm)} | IFU : ${clean(quote.subsidiary.ifu)}`, 48, bottom - 54, { width, height: 12, align: 'center', ellipsis: true });
                    doc.text(`Banque : ${clean(quote.subsidiary.bankName)} | Compte : ${clean(quote.subsidiary.accountNumber)}`, 48, bottom - 42, { width, height: 12, align: 'center', ellipsis: true });
                    doc.text(`CaapMedia | ${clean(quote.proformaNumber)} | ${page + 1}/${pages.count}`, 48, bottom - 26, { width, align: 'center' });
                }
                doc.end();
            }
            catch (error) {
                doc.destroy(error);
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }
};
exports.ProformaPdfService = ProformaPdfService;
exports.ProformaPdfService = ProformaPdfService = __decorate([
    (0, common_1.Injectable)()
], ProformaPdfService);
//# sourceMappingURL=proforma-pdf.service.js.map