import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { join } from 'node:path';
import { amountInWords } from './proforma-amount-in-words';

export type DeliveryProforma = Prisma.ProformaGetPayload<{
  include: { items: { include: { product: true } }; subsidiary: true };
}>;

export function proformaFilename(number: string): string {
  return `proforma_${number.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)}.pdf`;
}
export function money(value: Prisma.Decimal | number | string): string {
  return `${Number(value)
    .toLocaleString('fr-FR', { maximumFractionDigits: 2 })
    .replace(/[\u00a0\u202f]/g, ' ')} FCFA`;
}
const clean = (value: string | null | undefined) =>
  (value || '').replace(/\p{Cc}/gu, ' ').replace(/[\u2010-\u2015]/g, '-');

@Injectable()
export class ProformaPdfService {
  render(quote: DeliveryProforma): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 48,
        bufferPages: true,
        info: {
          Title: `Facture proforma ${quote.proformaNumber}`,
          Author: 'CaapMedia',
        },
      });
      const logo = join(__dirname, 'assets', 'CaapMedia.png');
      const decoratePage = () => {
        const { x, y } = doc;
        doc.page.margins.bottom = 80;
        doc.save().opacity(0.025);
        doc.image(
          logo,
          (doc.page.width - 168) / 2,
          (doc.page.height - 168) / 2,
          { fit: [168, 168] },
        );
        doc.restore();
        doc.x = x;
        doc.y = y;
      };
      doc.on('pageAdded', decoratePage);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      try {
        decoratePage();
        const width = doc.page.width - 96;
        const ensure = (height: number) => {
          if (doc.y + height > doc.page.height - 80) doc.addPage();
        };
        const date = (value: Date) =>
          value.toLocaleDateString('fr-FR', { timeZone: 'Africa/Douala' });
        const right = 48 + width;
        doc
          .polygon(
            [right - 225, 39],
            [right, 39],
            [right, 51],
            [right - 244, 51],
          )
          .fill('#aeca30');
        doc.rect(48, 69, 13, 25).fill('#459d36');
        doc.image(logo, 56, 56, {
          fit: [48, 48],
        });
        doc
          .font('Times-Bold')
          .fontSize(23)
          .fillColor('#377f2c')
          .text('CAAP - GROUPE Sarl', 116, 57, { width: 245, align: 'center' });
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#172033')
          .text('IMPRIMERIE - CONCEPTION - SÉRIGRAPHIE', 116, 84, {
            width: 245,
            align: 'center',
          })
          .text('PRESTATION DE SERVICES DIVERS', 116, 96, {
            width: 245,
            align: 'center',
          });
        doc
          .font('Times-Bold')
          .fontSize(10)
          .fillColor('#377f2c')
          .text('Communication et impression sur tous supports', 116, 109, {
            width: 245,
            align: 'center',
          });

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#172033')
          .text(clean(quote.subsidiary.subsidiaryName), 48, 128, {
            width,
            align: 'right',
          });
        doc.font('Helvetica').fontSize(9).fillColor('#475569');
        if (quote.subsidiary.address)
          doc.text(clean(quote.subsidiary.address), { width, align: 'right' });
        doc.text('+237 671 89 01 84  |  contact@caapmedia.com', {
          width,
          align: 'right',
        });
        const divider = doc.y + 10;
        doc
          .moveTo(48, divider)
          .lineTo(right, divider)
          .lineWidth(1)
          .strokeColor('#aeca30')
          .stroke();

        const partiesTop = divider + 17;
        const columnWidth = (width - 20) / 2;
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#64748b')
          .text('FACTURÉ À', 48, partiesTop, { width: columnWidth });
        doc
          .fontSize(11)
          .fillColor('#172033')
          .text(clean(quote.clientName), { width: columnWidth });
        doc.font('Helvetica').fontSize(9).fillColor('#475569');
        for (const detail of [
          quote.clientCompany,
          quote.clientEmail,
          quote.clientPhone,
        ]) {
          if (detail) doc.text(clean(detail), { width: columnWidth });
        }
        const clientBottom = doc.y;
        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .fillColor('#172033')
          .text('FACTURE PROFORMA', right - columnWidth, partiesTop, {
            width: columnWidth,
            align: 'right',
          });
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#475569')
          .text(`N° ${clean(quote.proformaNumber)}`, {
            width: columnWidth,
            align: 'right',
          })
          .text(`Date : ${date(quote.createdAt)}`, {
            width: columnWidth,
            align: 'right',
          })
          .text(`Validité : ${date(quote.validityDate)}`, {
            width: columnWidth,
            align: 'right',
          });
        doc.y = Math.max(clientBottom, doc.y) + 20;

        const xs = [48, 303, 347, 447];
        const widths = [255, 44, 100, width - 399];
        const heading = () => {
          ensure(34);
          const y = doc.y;
          doc.rect(48, y, width, 26).fill('#eef2e0');
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#172033');
          ['Désignation', 'Qté', 'Prix unitaire TTC', 'Total TTC'].forEach(
            (label, i) =>
              doc.text(label, xs[i] + 6, y + 8, {
                width: widths[i] - 12,
                align: i > 1 ? 'right' : i === 1 ? 'center' : 'left',
              }),
          );
          doc.y = y + 34;
        };
        heading();
        for (const item of quote.items) {
          doc.font('Helvetica').fontSize(10);
          const name = clean(item.product.name);
          const height = Math.max(
            28,
            doc.heightOfString(name, { width: widths[0] - 12 }) + 10,
          );
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
        ensure(108);
        doc.y += 8;
        for (const [label, value, bold] of [
          ['Sous-total HT', money(quote.subtotal), false],
          [
            `TVA incluse (${quote.taxRate.toString()} %)`,
            money(quote.taxAmount),
            false,
          ],
          ['TOTAL TTC', money(quote.totalAmount), true],
        ] as const) {
          const y = doc.y;
          doc
            .font(bold ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(bold ? 12 : 10)
            .fillColor('#172033');
          if (bold)
            doc
              .moveTo(270, y - 5)
              .lineTo(right, y - 5)
              .lineWidth(1)
              .strokeColor('#cbd5e1')
              .stroke();
          doc.text(label, 270, y, { width: 125 });
          doc.text(value, 395, y, { width: width - 347, align: 'right' });
          doc.y = y + (bold ? 28 : 22);
        }
        if (quote.notes) {
          const noteText = clean(quote.notes);
          doc.font('Helvetica-Bold').fontSize(9);
          const labelHeight = doc.heightOfString('NOTES ET CONDITIONS', {
            width: width - 28,
          });
          doc.font('Helvetica').fontSize(9);
          const noteHeight = doc.heightOfString(noteText, {
            width: width - 28,
            lineGap: 3,
          });
          const boxHeight = 25 + labelHeight + noteHeight;
          ensure(boxHeight + 12);
          const x = 48;
          const y = doc.y + 4;
          doc.roundedRect(x, y, width, boxHeight, 4).fill('#f7fae9');
          doc.rect(x, y, 4, boxHeight).fill('#c6e911');
          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor('#64748b')
            .text('NOTES ET CONDITIONS', x + 14, y + 9, {
              width: width - 28,
            });
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#334155')
            .text(noteText, x + 14, y + 12 + labelHeight, {
              width: width - 28,
              lineGap: 3,
            });
          doc.y = y + boxHeight + 12;
        }
        const amountLine = `Arrêté la présente facture proforma à la somme de : ${amountInWords(Number(quote.totalAmount))}.`;
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#475569');
        ensure(doc.heightOfString(amountLine, { width }) + 12);
        doc.text(amountLine, 48, doc.y, { width });
        doc.moveDown(0.5);
        ensure(35);
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor('#64748b')
          .text(
            'Ce document est une facture proforma et ne constitue pas une facture définitive.',
            48,
            doc.y + 8,
            { width, align: 'center' },
          );
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
          doc.text(
            `RCCM : ${clean(quote.subsidiary.rccm)} | IFU : ${clean(quote.subsidiary.ifu)}`,
            48,
            bottom - 54,
            { width, height: 12, align: 'center', ellipsis: true },
          );
          doc.text(
            `Banque : ${clean(quote.subsidiary.bankName)} | Compte : ${clean(quote.subsidiary.accountNumber)}`,
            48,
            bottom - 42,
            { width, height: 12, align: 'center', ellipsis: true },
          );
          doc.text(
            `CaapMedia | ${clean(quote.proformaNumber)} | ${page + 1}/${pages.count}`,
            48,
            bottom - 26,
            { width, align: 'center' },
          );
        }
        doc.end();
      } catch (error) {
        doc.destroy(error as Error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
