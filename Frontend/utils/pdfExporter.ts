import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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