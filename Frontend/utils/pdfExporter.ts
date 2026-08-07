import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface PdfHeader {
    key: string;
    label: string;
}

export const exportToPdf = (title: string, headers: PdfHeader[], data: any[], filename: string, orientation: 'p' | 'l' = 'p') => {
    try {
        const doc = new jsPDF({
            orientation: orientation as 'p' | 'l',
            unit: 'mm',
            format: 'a4',
        });

        doc.setFontSize(16);
        doc.text(title, 14, 15);

        const tableHeaders = headers.map(h => h.label);
        const tableData = data.map(row =>
            headers.map(header => {
                // Gère les clés imbriquées comme 'product.name'
                const value = header.key.split('.').reduce((o, i) => (o ? o[i] : ''), row);
                return value !== null && value !== undefined ? String(value) : '';
            })
        );

        autoTable(doc, {
            startY: 25,
            head: [tableHeaders],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [198, 233, 17],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
            },
            bodyStyles: {
                textColor: [50, 50, 50],
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
            margin: { left: 14, right: 14, top: 25, bottom: 14 },
            didDrawPage: (data) => {
                // Footer
                const pageCount = doc.getNumberOfPages();
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.getHeight();
                const pageWidth = pageSize.getWidth();
                doc.setFontSize(10);
                doc.text(
                    `Page ${data.pageNumber} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            },
        });

        // Ensure filename doesn't have duplicate extensions
        const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        doc.save(finalFilename);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Convertit un canvas capturé (scale=2) en un jsPDF prêt à l'emploi.
 *
 * `autoPageSize: true` (par défaut) crée une page UNIQUE aux dimensions
 * exactes du contenu : aucune coupure au milieu d'un tableau — le problème
 * que le découpage A4 classique (ci-dessous) ne peut pas éviter pour des
 * documents courts (bon de commande, bon de livraison, bon d'entrée...).
 * Pattern repris de gmo (Frontend_GMO/utils/pdfUtils.ts::printElementAsPdf).
 *
 * `autoPageSize: false` reproduit l'ancien découpage multi-pages A4 —
 * réservé aux documents volontairement longs (ex. facture multi-lignes) où
 * une pagination physique standard est préférable à une page unique géante.
 */
const canvasToPdf = (canvas: HTMLCanvasElement, autoPageSize: boolean): jsPDF => {
    const imgData = canvas.toDataURL('image/png');

    if (autoPageSize) {
        // px → mm à 96 DPI, corrigé du scale=2 utilisé lors de la capture.
        const mmPerPx = 25.4 / 96;
        const contentWidthMm = (canvas.width / 2) * mmPerPx;
        const contentHeightMm = (canvas.height / 2) * mmPerPx;
        const pdf = new jsPDF({
            orientation: contentHeightMm > contentWidthMm ? 'p' : 'l',
            unit: 'mm',
            format: [contentWidthMm, contentHeightMm],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, contentWidthMm, contentHeightMm);
        return pdf;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;
    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
    }
    return pdf;
};

/**
 * Capture un élément DOM (ex : un gabarit d'impression caché avec DocumentHeader)
 * en image et le télécharge directement en PDF — remplace le pattern ad hoc
 * `jsPDF({unit:'px', format:[canvas.width, canvas.height]})` dupliqué (et
 * incorrect : un PDF en pixels n'a pas des proportions A4 exploitables à
 * l'impression) dans BonDeCommande/BonDeLivraison/InvoiceModal.
 */
export const exportElementToPdf = async (
    element: HTMLElement,
    filename: string,
    options?: { autoPageSize?: boolean },
): Promise<void> => {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const pdf = canvasToPdf(canvas, options?.autoPageSize ?? true);
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};

/**
 * Capture un élément DOM (ex : un gabarit d'impression caché avec DocumentHeader)
 * en image, l'assemble en PDF, puis ouvre le PDF dans un nouvel onglet et
 * déclenche l'impression via le viewer natif du navigateur.
 */
export const printElementAsPdf = async (
    element: HTMLElement,
    options?: { autoPageSize?: boolean },
): Promise<void> => {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const pdf = canvasToPdf(canvas, options?.autoPageSize ?? true);

    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');

    if (!newWindow) {
        pdf.save('document.pdf');
        URL.revokeObjectURL(url);
        return;
    }

    let triggered = false;
    const doPrint = () => {
        if (triggered) return;
        triggered = true;
        try {
            newWindow.print();
        } catch {
            // Le navigateur peut refuser l'appel programmatique : l'utilisateur imprime via Ctrl+P dans l'onglet PDF.
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    };

    newWindow.addEventListener('load', () => setTimeout(doPrint, 300));
    setTimeout(doPrint, 3000);
};