import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Configuration centralisée pour tous les PDFs CaapMedia
 */
export const PRINT_CONFIG = {
  PAGE_SIZE: 'a4',
  PAGE_MARGIN: 10, // mm
  COMPANY_NAME: 'CaapMedia',
  COMPANY_COLOR: '#166534', // Vert CaapMedia
  COMPANY_SECONDARY_COLOR: '#dcfce7',
  FOOTER_TEXT: 'Plateforme Commerciale CaapMedia',
  QUALITY: 2 // Multiplicateur de qualité html2canvas
};

interface PdfOptions {
  orientation?: 'portrait' | 'landscape';
  filename?: string;
  title?: string;
  compress?: boolean;
}

/**
 * Exporte un élément DOM en PDF téléchargeable
 * @param elementId - ID de l'élément à exporter
 * @param options - Options de configuration
 */
export async function exportElementToPdf(
  elementId: string,
  options: PdfOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Élément avec l'ID "${elementId}" introuvable`);
  }

  try {
    // Convertir l'élément en image haute résolution
    const canvas = await html2canvas(element, {
      scale: PRINT_CONFIG.QUALITY,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true
    });

    // Calculer les dimensions pour A4
    const orientation = options.orientation || 'portrait';
    const pageWidth = orientation === 'landscape' ? 297 : 210; // mm
    const pageHeight = orientation === 'landscape' ? 210 : 297;

    const imgWidth = pageWidth - PRINT_CONFIG.PAGE_MARGIN * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Créer le PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    // Gérer multi-pages
    let yPosition = PRINT_CONFIG.PAGE_MARGIN;
    const maxHeight = pageHeight - PRINT_CONFIG.PAGE_MARGIN * 2;
    let heightRemaining = imgHeight;
    const imgData = canvas.toDataURL('image/png');
    let page = 1;

    while (heightRemaining > 0) {
      if (page > 1) {
        pdf.addPage();
      }

      const pageHeight = Math.min(heightRemaining, maxHeight);
      const sourceY = (imgHeight - heightRemaining) * (canvas.height / imgHeight);

      pdf.addImage(
        imgData,
        'PNG',
        PRINT_CONFIG.PAGE_MARGIN,
        PRINT_CONFIG.PAGE_MARGIN,
        imgWidth,
        pageHeight
      );

      heightRemaining -= pageHeight;
      page++;
    }

    // Télécharger le PDF
    const filename = options.filename || 'document.pdf';
    pdf.save(filename);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw new Error('Impossible de générer le PDF. Veuillez réessayer.');
  }
}

/**
 * Ouvre l'aperçu d'impression navigateur pour un élément
 * @param elementId - ID de l'élément à imprimer
 * @param options - Options de configuration
 */
export function printElementAsPdf(
  elementId: string,
  options: PdfOptions = {}
): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Élément avec l'ID "${elementId}" introuvable`);
  }

  // Créer une fenêtre d'impression
  const printWindow = window.open('', '', 'width=1200,height=800');
  if (!printWindow) {
    throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les pop-ups.');
  }

  // Copier les styles
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
  let stylesHtml = '';
  styles.forEach(style => {
    stylesHtml += style.outerHTML;
  });

  // Ajouter le contenu à imprimer
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${options.title || 'Document'}</title>
      ${stylesHtml}
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        .no-print {
          display: none !important;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();

  // Attendre le chargement puis imprimer
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

/**
 * Exporte un tableau en CSV
 * Utile pour données complexes
 */
export function exportTableToCsv(
  tableId: string,
  filename: string = 'export.csv'
): void {
  const table = document.getElementById(tableId);
  if (!table) {
    throw new Error(`Tableau avec l'ID "${tableId}" introuvable`);
  }

  const csv: string[] = [];
  const rows = table.querySelectorAll('tr');

  rows.forEach(row => {
    const cells = row.querySelectorAll('td, th');
    const rowData: string[] = [];

    cells.forEach(cell => {
      rowData.push(`"${cell.textContent?.trim() || ''}"`);
    });

    csv.push(rowData.join(','));
  });

  const csvContent = csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', filename);
  link.click();
}

/**
 * Formate une devise pour l'affichage dans les PDFs
 */
export function formatCurrencyForPrint(amount: number, currency: string = 'FCFA'): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' ' + currency;
}

/**
 * Formate une date pour l'affichage dans les PDFs
 */
export function formatDateForPrint(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}
