import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define an extended interface for jsPDF with autoTable.
// This is a workaround for module augmentation issues.
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface PdfHeader {
    key: string;
    label: string;
}

export const exportToPdf = (title: string, headers: PdfHeader[], data: any[], filename: string, orientation: 'p' | 'portrait' | 'l' | 'landscape' = 'p') => {
    const doc = new jsPDF({ orientation });

    doc.text(title, 14, 20);

    const tableHeaders = headers.map(h => h.label);
    const tableData = data.map(row => 
        headers.map(header => {
            // Gère les clés imbriquées comme 'product.name'
            const value = header.key.split('.').reduce((o, i) => (o ? o[i] : ''), row);
            return value !== null && value !== undefined ? value : '';
        })
    );

    (doc as jsPDFWithAutoTable).autoTable({
        startY: 30,
        head: [tableHeaders],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [198, 233, 17] }, // Couleur #c6e911
    });

    doc.save(`${filename}.pdf`);
};