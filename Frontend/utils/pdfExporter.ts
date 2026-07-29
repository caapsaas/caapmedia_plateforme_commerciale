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
 * Capture un élément DOM (ex : un gabarit d'impression caché avec DocumentHeader)
 * en image, l'assemble en PDF paginé, puis ouvre le PDF dans un nouvel onglet et
 * déclenche l'impression via le viewer natif du navigateur.
 */
export const printElementAsPdf = async (element: HTMLElement): Promise<void> => {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

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