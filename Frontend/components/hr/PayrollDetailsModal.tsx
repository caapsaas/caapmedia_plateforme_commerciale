import React from 'react';
import { PayrollRecord } from '../../types';
import { useI18n } from '../../i18n';

interface PayrollDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord | null;
  company?: {
    name?: string;
    address?: string;
    city?: string;
    niu?: string;
    cnpsNumber?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
}

const PayrollDetailsModal: React.FC<PayrollDetailsModalProps> = ({
  isOpen,
  onClose,
  record,
  company,
}) => {
  const { formatCurrency } = useI18n();

  if (!isOpen || !record) return null;

  const period = record.payrollPeriod || record.period || '—';
  const paymentDate = record.paymentDate
    ? new Date(record.paymentDate).toLocaleDateString('fr-FR')
    : '—';

  // --- Valeurs sécurisées ---
  const baseSalary = Number(record.baseSalary || 0);
  const bonus = Number(record.bonus || 0);
  const allowances = Number(record.allowances || 0);
  const overtime = Number(record.overtime || 0);
  const otherEarnings = Number(record.otherEarnings || 0);
  const grossSalary = Number(record.grossSalary || 0);

  const cnpsEmployee = Number(record.cnpsEmployee || 0);
  const cfcEmployee = Number(record.cfcEmployee || 0);
  const irpp = Number(record.irpp || 0);
  const cac = Number(record.cac || 0);
  const otherDeductions = Number(record.otherDeductions || 0);
  const totalDeductions = Number(record.deductions || 0);
  const netSalary = Number(record.netSalary || 0);

  const cnpsEmployer = Number(record.cnpsEmployer || 0);
  const cfcEmployer = Number(record.cfcEmployer || 0);
  const fne = Number(record.fne || 0);
  const totalEmployerCost = Number(
    record.totalEmployerCost ||
      grossSalary + cnpsEmployer + cfcEmployer + fne,
  );

  const companyName = 'CaapMedia';
  const companyAddress = company?.address || '';
  const companyCity = company?.city || '';
  const companyNiu = company?.niu || '—';
  const companyCnps = company?.cnpsNumber || '—';
  const companyPhone = company?.phone || '';
  const companyEmail = company?.email || '';
  const companyLogo = '/CaapMedia.png';

  const handlePrint = () => window.print();

  // Assiette CNPS plafonnée
  const cnpsBase = Math.min(grossSalary, 750_000);

  // Format nombre simple (sans symbole) pour les colonnes Base / Taux
  const fmt = (n: number) =>
    n > 0
      ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '';

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 8mm; size: A4 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-modal-overlay { display: none !important; }
          .print-actions-bar { display: none !important; }
          .print-content {
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            border: none !important;
          }
          .print-area { border: none !important; }
        }
      `}</style>

      <div
        className="print-modal-overlay fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 overflow-y-auto"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="print-content bg-white w-full max-w-[210mm] shadow-2xl my-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ============================================================
              ZONE IMPRIMABLE – Style identique à l’image de référence
             ============================================================ */}
          <div className="print-area bg-white text-[11px] leading-tight text-black font-sans">

            {/* ---------- EN-TÊTE ---------- */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex justify-between items-start gap-6">
                {/* Colonne gauche : Société + infos légales + salarié admin */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    {companyLogo && (
                      <img
                        src={companyLogo}
                        alt="Logo"
                        className="h-12 w-auto object-contain shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-bold uppercase text-sm tracking-wide">
                        {companyName}
                      </p>
                      <p className="text-[11px] mt-0.5">
                        {companyAddress}
                        {companyAddress && companyCity ? ', ' : ''}
                        {companyCity}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] space-y-0.5 text-gray-800">
                    <p>
                      <span className="font-semibold">NIU :</span> {companyNiu}
                      &nbsp;&nbsp;
                      <span className="font-semibold">N° CNPS :</span> {companyCnps}
                    </p>
                    {(companyPhone || companyEmail) && (
                      <p>
                        {companyPhone && <>Tél. : {companyPhone}</>}
                        {companyPhone && companyEmail && ' · '}
                        {companyEmail && <>Email : {companyEmail}</>}
                      </p>
                    )}
                    <p className="mt-1.5">
                      <span className="font-semibold">Matricule :</span>{' '}
                      {record.employeeId || '—'}
                    </p>
                    <p>
                      <span className="font-semibold">Emploi :</span>{' '}
                      {(record as any).jobTitle || (record as any).position || '—'}
                    </p>
                    <p>
                      <span className="font-semibold">Statut :</span>{' '}
                      {(record as any).status || 'Employé'}
                    </p>
                    {(record as any).entryDate && (
                      <p>
                        <span className="font-semibold">Entrée :</span>{' '}
                        {new Date((record as any).entryDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Colonne droite : Titre + période + carte salarié */}
                <div className="w-[240px] shrink-0 text-right">
                  <h1 className="text-xl font-bold uppercase tracking-wider text-black">
                    BULLETIN DE SALAIRE
                  </h1>
                  <p className="text-sm mt-1 text-gray-700">
                    Période : <span className="font-semibold">{period}</span>
                  </p>
                  {paymentDate !== '—' && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Date de paiement : {paymentDate}
                    </p>
                  )}

                  {/* Carte salarié (style pastille bleue claire) */}
                  <div className="mt-4 bg-[#dcfce7] rounded-xl px-4 py-3 text-left">
                    <p className="font-bold text-[13px] text-black">
                      {record.employeeName || '—'}
                    </p>
                    {(record as any).employeeAddress && (
                      <p className="text-[11px] mt-1 text-gray-800 leading-snug">
                        {(record as any).employeeAddress}
                      </p>
                    )}
                    {(record as any).employeeCity && (
                      <p className="text-[11px] text-gray-800">
                        {(record as any).employeeCity}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ---------- TABLEAU PRINCIPAL ---------- */}
            <div className="px-3">
              <table className="w-full border-collapse border border-gray-400 text-[11px]">
                <thead>
                  <tr className="bg-[#166534] text-white">
                    <th className="border border-gray-500 px-2 py-2 text-left font-semibold w-[38%]">
                      Éléments de paie
                    </th>
                    <th className="border border-gray-500 px-2 py-2 text-center font-semibold w-[12%]">
                      Base
                    </th>
                    <th className="border border-gray-500 px-2 py-2 text-center font-semibold w-[10%]">
                      Taux
                    </th>
                    <th className="border border-gray-500 px-2 py-2 text-right font-semibold w-[13%]">
                      A déduire
                    </th>
                    <th className="border border-gray-500 px-2 py-2 text-right font-semibold w-[13%]">
                      A payer
                    </th>
                    <th className="border border-gray-500 px-2 py-2 text-right font-semibold w-[14%]">
                      Charges patronales
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* ===== GAINS ===== */}
                  <tr className="border-b border-gray-300">
                    <td className="px-2 py-1.5">Salaire de base</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(baseSalary)}</td>
                    <td className="px-2 py-1.5 text-center">—</td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                      {fmt(baseSalary)}
                    </td>
                    <td className="px-2 py-1.5"></td>
                  </tr>

                  {bonus > 0 && (
                    <tr className="border-b border-gray-300">
                      <td className="px-2 py-1.5">Primes / Bonus</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(bonus)}</td>
                      <td className="px-2 py-1.5 text-center">—</td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(bonus)}</td>
                      <td className="px-2 py-1.5"></td>
                    </tr>
                  )}

                  {allowances > 0 && (
                    <tr className="border-b border-gray-300">
                      <td className="px-2 py-1.5">Indemnités</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(allowances)}</td>
                      <td className="px-2 py-1.5 text-center">—</td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(allowances)}</td>
                      <td className="px-2 py-1.5"></td>
                    </tr>
                  )}

                  {overtime > 0 && (
                    <tr className="border-b border-gray-300">
                      <td className="px-2 py-1.5">Heures supplémentaires</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(overtime)}</td>
                      <td className="px-2 py-1.5 text-center">—</td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(overtime)}</td>
                      <td className="px-2 py-1.5"></td>
                    </tr>
                  )}

                  {otherEarnings > 0 && (
                    <tr className="border-b border-gray-300">
                      <td className="px-2 py-1.5">Autres gains</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(otherEarnings)}</td>
                      <td className="px-2 py-1.5 text-center">—</td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(otherEarnings)}</td>
                      <td className="px-2 py-1.5"></td>
                    </tr>
                  )}

                  {/* Salaire brut */}
                  <tr className="border-b border-gray-400 bg-gray-50">
                    <td className="px-2 py-1.5 font-bold">Salaire brut</td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-bold">
                      {fmt(grossSalary)}
                    </td>
                    <td className="px-2 py-1.5"></td>
                  </tr>

                  {/* ===== COTISATIONS SALARIÉ ===== */}
                  <tr>
                    <td colSpan={6} className="px-2 pt-2 pb-0.5 font-bold text-[10px] uppercase text-gray-700">
                      Cotisations salariales
                    </td>
                  </tr>

                  {cnpsEmployee > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="px-2 py-1 pl-4">CNPS Pension vieillesse</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(cnpsBase)}</td>
                      <td className="px-2 py-1 text-center">4,20 %</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(cnpsEmployee)}</td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                    </tr>
                  )}

                  {cfcEmployee > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="px-2 py-1 pl-4">Crédit Foncier – CFC</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(grossSalary)}</td>
                      <td className="px-2 py-1 text-center">1,00 %</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(cfcEmployee)}</td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                    </tr>
                  )}

                  {irpp > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="px-2 py-1 pl-4">IRPP (Impôt sur le revenu)</td>
                      <td className="px-2 py-1 text-right tabular-nums">
                        {fmt(grossSalary - cnpsEmployee - cfcEmployee)}
                      </td>
                      <td className="px-2 py-1 text-center">—</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(irpp)}</td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                    </tr>
                  )}

                  {cac > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="px-2 py-1 pl-4">CAC (10 % IRPP)</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(irpp)}</td>
                      <td className="px-2 py-1 text-center">10 %</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(cac)}</td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                    </tr>
                  )}

                  {otherDeductions > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="px-2 py-1 pl-4">Autres retenues</td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1 text-center">—</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(otherDeductions)}</td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                    </tr>
                  )}

                  {/* Total cotisations salariales */}
                  <tr className="border-b border-gray-400 bg-gray-50">
                    <td className="px-2 py-1.5 font-semibold">Total des cotisations et contributions</td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-semibold">
                      {fmt(totalDeductions)}
                    </td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                  </tr>

                  {/* ===== CHARGES PATRONALES (dans la colonne dédiée) ===== */}
                  <tr>
                    <td colSpan={6} className="px-2 pt-2 pb-0.5 font-bold text-[10px] uppercase text-gray-700">
                      Charges patronales
                    </td>
                  </tr>

                  {cnpsEmployer > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="px-2 py-1 pl-4">CNPS Employeur</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(cnpsBase)}</td>
                      <td className="px-2 py-1 text-center">—</td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(cnpsEmployer)}</td>
                    </tr>
                  )}

                  {cfcEmployer > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="px-2 py-1 pl-4">Crédit Foncier Employeur</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(grossSalary)}</td>
                      <td className="px-2 py-1 text-center">1,50 %</td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(cfcEmployer)}</td>
                    </tr>
                  )}

                  {fne > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="px-2 py-1 pl-4">FNE – Fonds National de l’Emploi</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(grossSalary)}</td>
                      <td className="px-2 py-1 text-center">1,00 %</td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt(fne)}</td>
                    </tr>
                  )}

                  {/* Total charges patronales */}
                  <tr className="border-b border-gray-400 bg-gray-50">
                    <td className="px-2 py-1.5 font-semibold">Total charges patronales</td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-semibold">
                      {fmt(cnpsEmployer + cfcEmployer + fne)}
                    </td>
                  </tr>

                  {/* ===== NET À PAYER ===== */}
                  <tr className="bg-white">
                    <td className="px-2 py-3 font-bold text-sm" colSpan={4}>
                      Net à payer
                    </td>
                    <td className="px-2 py-3 text-right font-bold text-base tabular-nums">
                      {fmt(netSalary)}
                    </td>
                    <td className="px-2 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ---------- BANDEAU RÉCAPITULATIF BAS DE PAGE ---------- */}
            <div className="px-3 mt-4">
              <table className="w-full border-collapse border border-gray-400 text-[10px]">
                <thead>
                  <tr className="bg-[#166534] text-white">
                    <th className="border border-gray-500 px-1.5 py-1.5 text-left font-semibold w-[9%]"></th>
                    <th className="border border-gray-500 px-1.5 py-1.5 text-center font-semibold">Heures</th>
                    <th className="border border-gray-500 px-1.5 py-1.5 text-center font-semibold">Heures suppl.</th>
                    <th className="border border-gray-500 px-1.5 py-1.5 text-center font-semibold">Brut</th>
                    <th className="border border-gray-500 px-1.5 py-1.5 text-center font-semibold">Plafond S.S.</th>
                    <th className="border border-gray-500 px-1.5 py-1.5 text-center font-semibold">Net imposable</th>
                    <th className="border border-gray-500 px-1.5 py-1.5 text-center font-semibold">Ch. patronales</th>
                    <th className="border border-gray-500 px-1.5 py-1.5 text-center font-semibold">Coût Global</th>
                    <th className="border border-gray-500 px-1.5 py-1.5 text-center font-semibold">Total versé</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="px-1.5 py-1.5 font-semibold">Mensuel</td>
                    <td className="px-1.5 py-1.5 text-center tabular-nums">
                      {(record as any).hours || '—'}
                    </td>
                    <td className="px-1.5 py-1.5 text-center tabular-nums">
                      {(record as any).overtimeHours || ''}
                    </td>
                    <td className="px-1.5 py-1.5 text-center tabular-nums">{fmt(grossSalary)}</td>
                    <td className="px-1.5 py-1.5 text-center tabular-nums">{fmt(cnpsBase)}</td>
                    <td className="px-1.5 py-1.5 text-center tabular-nums">
                      {fmt(grossSalary - cnpsEmployee - cfcEmployee)}
                    </td>
                    <td className="px-1.5 py-1.5 text-center tabular-nums">
                      {fmt(cnpsEmployer + cfcEmployer + fne)}
                    </td>
                    <td className="px-1.5 py-1.5 text-center tabular-nums font-medium">
                      {fmt(totalEmployerCost)}
                    </td>
                    <td className="px-1.5 py-1.5 text-center tabular-nums font-medium">
                      {fmt(netSalary)}
                    </td>
                  </tr>
                  {/* Ligne annuelle si disponible */}
                  {(record as any).annualGross != null && (
                    <tr>
                      <td className="px-1.5 py-1.5 font-semibold">Annuel</td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums">
                        {(record as any).annualHours || '—'}
                      </td>
                      <td className="px-1.5 py-1.5 text-center"></td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums">
                        {fmt(Number((record as any).annualGross || 0))}
                      </td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums">
                        {fmt(Number((record as any).annualCnpsCeiling || 0))}
                      </td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums">
                        {fmt(Number((record as any).annualTaxable || 0))}
                      </td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums">
                        {fmt(Number((record as any).annualEmployerCharges || 0))}
                      </td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums">
                        {fmt(Number((record as any).annualTotalCost || 0))}
                      </td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums">
                        {fmt(Number((record as any).annualNet || 0))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ---------- SIGNATURES ---------- */}
            <div className="px-5 mt-6 mb-4">
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-semibold mb-1">
                    Signature de l’employeur
                  </p>
                  <div className="border-b border-black h-14" />
                  <p className="text-[9px] text-gray-400 text-center mt-1">Date & Signature</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-semibold mb-1">
                    Signature du salarié
                  </p>
                  {record.signature ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={record.signature}
                        alt="Signature"
                        className="h-12 object-contain mb-1"
                      />
                      <div className="border-b border-black w-full" />
                      <p className="text-[9px] text-gray-400 text-center mt-1">Lu et approuvé</p>
                    </div>
                  ) : (
                    <>
                      <div className="border-b border-black h-14" />
                      <p className="text-[9px] text-gray-400 text-center mt-1">Lu et approuvé</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ---------- PIED DE PAGE ---------- */}
            <div className="px-5 pb-4 text-[9px] text-gray-500 border-t border-gray-200 pt-2">
              <p>
                Document établi conformément à la législation camerounaise en vigueur.
                Conservez ce bulletin sans limitation de durée.
              </p>
            </div>
          </div>

          {/* ========== BARRE D’ACTIONS (non imprimée) ========== */}
          <div className="print-actions-bar px-5 py-3 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
            <p className="text-xs text-gray-500">Aperçu bulletin de paie</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-[#166534] text-white text-sm font-semibold rounded hover:bg-green-900 transition-colors"
              >
                Imprimer
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayrollDetailsModal;