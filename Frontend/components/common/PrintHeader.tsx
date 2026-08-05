import React from 'react';
import { PRINT_CONFIG } from '../../utils/pdfUtils';

interface PrintHeaderProps {
  documentType: string;
  documentNumber?: string;
  period?: string;
  subsidiary?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  companyLogo?: string;
  showBranding?: boolean;
}

/**
 * En-tête standardisé pour tous les documents CaapMedia
 * Réutilisable dans tous les templates
 */
export const PrintHeader: React.FC<PrintHeaderProps> = ({
  documentType,
  documentNumber,
  period,
  subsidiary,
  companyLogo = '/CaapMedia.png',
  showBranding = true
}) => {
  return (
    <div className="print-header pb-4 mb-4 border-b-2 border-gray-300">
      <div className="flex justify-between items-start gap-6">
        {/* Colonne gauche : Logo + Infos légales */}
        <div className="flex-1 min-w-0">
          {showBranding && (
            <div className="flex items-start gap-3 mb-3">
              {companyLogo && (
                <img
                  src={companyLogo}
                  alt="Logo CaapMedia"
                  className="h-12 w-auto object-contain shrink-0"
                />
              )}
              <div>
                <p className="font-bold uppercase text-sm tracking-wide text-black">
                  {PRINT_CONFIG.COMPANY_NAME}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {PRINT_CONFIG.FOOTER_TEXT}
                </p>
              </div>
            </div>
          )}

          {/* Infos filiale/entreprise */}
          {subsidiary && (
            <div className="text-[10px] space-y-0.5 text-gray-700 mt-2">
              {subsidiary.name && (
                <p>
                  <span className="font-semibold">Filiale :</span> {subsidiary.name}
                </p>
              )}
              {subsidiary.address && (
                <p>
                  <span className="font-semibold">Adresse :</span> {subsidiary.address}
                </p>
              )}
              {(subsidiary.phone || subsidiary.email) && (
                <p>
                  {subsidiary.phone && <>Tél. : {subsidiary.phone}</>}
                  {subsidiary.phone && subsidiary.email && ' · '}
                  {subsidiary.email && <>Email : {subsidiary.email}</>}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Colonne droite : Type document + Numéro + Période */}
        <div className="w-[280px] shrink-0 text-right">
          <h1 className="text-xl font-bold uppercase tracking-wider text-black">
            {documentType}
          </h1>

          {documentNumber && (
            <p className="text-sm font-semibold text-gray-800 mt-2">
              N° {documentNumber}
            </p>
          )}

          {period && (
            <p className="text-sm text-gray-600 mt-1">
              Période : <span className="font-semibold">{period}</span>
            </p>
          )}

          {/* Ligne décorative */}
          <div
            className="mt-3 h-1 w-full"
            style={{ backgroundColor: PRINT_CONFIG.COMPANY_COLOR }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
