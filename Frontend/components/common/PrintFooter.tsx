import React from 'react';
import { PRINT_CONFIG, formatDateForPrint } from '../../utils/pdfUtils';

interface PrintFooterProps {
  documentType?: string;
  generatedDate?: Date | string;
  showLegalText?: boolean;
  customText?: string;
  pageNumber?: number;
  totalPages?: number;
}

/**
 * Pied de page standardisé pour tous les documents CaapMedia
 * Inclut date de génération, texte légal, numéro de page
 */
export const PrintFooter: React.FC<PrintFooterProps> = ({
  documentType = 'Document',
  generatedDate = new Date(),
  showLegalText = true,
  customText,
  pageNumber,
  totalPages
}) => {
  const formattedDate = typeof generatedDate === 'string'
    ? formatDateForPrint(generatedDate)
    : formatDateForPrint(generatedDate);

  return (
    <div className="print-footer mt-6 pt-3 border-t border-gray-300 text-[9px] text-gray-500">
      <div className="flex justify-between items-center">
        {/* Gauche : Info génération */}
        <div className="flex-1">
          <p>
            {documentType} généré le {formattedDate}
          </p>
          {customText && (
            <p className="mt-1 italic">{customText}</p>
          )}
        </div>

        {/* Centre : Texte légal */}
        {showLegalText && (
          <div className="flex-1 text-center px-4">
            <p>
              Document établi conformément à la législation en vigueur.
            </p>
            <p className="mt-1">
              {PRINT_CONFIG.FOOTER_TEXT}
            </p>
          </div>
        )}

        {/* Droite : Numéro de page */}
        {pageNumber !== undefined && totalPages !== undefined && (
          <div className="flex-1 text-right">
            <p>
              Page {pageNumber} / {totalPages}
            </p>
          </div>
        )}
      </div>

      {/* Ligne séparatrice */}
      <div
        className="mt-2 h-px w-full"
        style={{ backgroundColor: PRINT_CONFIG.COMPANY_COLOR }}
      />
    </div>
  );
};

export default PrintFooter;
