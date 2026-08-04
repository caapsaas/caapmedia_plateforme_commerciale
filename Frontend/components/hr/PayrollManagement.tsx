import React, { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Subsidiary, PayrollRecord, PayrollStatus, Employee, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import IconSignature from '../icons/IconSignature';
import ViewSignatureModal from './ViewSignatureModal';
import PayrollDetailsModal from './PayrollDetailsModal';
import PayrollSignatureModal from './PayrollSignatureModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import IconEye from '../icons/IconEye';
import { UseMutateFunction } from '@tanstack/react-query';
import SearchBar from './SearchBar';
import { getPayrollRecordsGlobal } from '../../services/apihr/apiPayroll';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

interface ProcessPayrollResponse {
  count: number;
  message: string;
}

interface PayrollManagementProps {
  subsidiary: Subsidiary;
  employees: Employee[];
  payrolls: PayrollRecord[];
  isLoading?: boolean;
  onProcessPayroll: UseMutateFunction<
    ProcessPayrollResponse,
    Error,
    { period: string; subsidiaryId?: string; riskGroup?: 'A' | 'B' | 'C' },
    unknown
  >;
  onSaveSignature: UseMutateFunction<
    PayrollRecord,
    Error,
    { payrollId: string; signature: string },
    unknown
  >;
}

const PayrollManagement: React.FC<PayrollManagementProps> = ({
  subsidiary,
  employees,
  payrolls,
  isLoading = false,
  onProcessPayroll,
  onSaveSignature,
}) => {
  const { t, formatCurrency } = useI18n();
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // États des modales
  const [viewingSignature, setViewingSignature] = useState<{
    name: string;
    signature: string;
  } | null>(null);
  const [signingRecord, setSigningRecord] = useState<PayrollRecord | null>(null);
  const [viewingDetails, setViewingDetails] = useState<PayrollRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7), // YYYY-MM
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // État pour la sélection de filiale (SUPER_ADMIN uniquement)
  const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState<string | undefined>(
    (user?.userRole === UserRole.SUPER_ADMIN || user?.additionalRoles?.includes(UserRole.SUPER_ADMIN))
      ? undefined
      : subsidiary.id
  );

  // État pour la vue globale (SUPER_ADMIN uniquement)
  const [globalView, setGlobalView] = useState(false);
  const [globalPayrolls, setGlobalPayrolls] = useState<PayrollRecord[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  // Vérifier si l'utilisateur est SUPER_ADMIN
  const isSuperAdmin = user?.userRole === UserRole.SUPER_ADMIN || user?.additionalRoles?.includes(UserRole.SUPER_ADMIN);

  // Filiale cible pour les opérations
  const targetSubsidiaryId = selectedSubsidiaryId || subsidiary.id;

  // Handler pour basculer la vue globale
  const handleToggleGlobalView = async () => {
    if (globalView) {
      // Retour à la vue filiale
      setGlobalView(false);
      setGlobalPayrolls([]);
    } else {
      // Passer à la vue globale
      setIsLoadingGlobal(true);
      try {
        const data = await getPayrollRecordsGlobal();
        setGlobalPayrolls(data);
        setGlobalView(true);
        toast.success('Vue globale', 'Affichage de toutes les filiales');
      } catch (error) {
        toast.error('Erreur', 'Impossible de charger les données globales');
      } finally {
        setIsLoadingGlobal(false);
      }
    }
  };

  // Utiliser les données globales ou filiales selon la vue
  const currentPayrolls = globalView ? globalPayrolls : payrolls;

  // Filtrage des fiches de paie
  const filteredPayrolls = useMemo(() => {
    return currentPayrolls.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      const period = record.payrollPeriod || record.period || '';
      const matchesSearch =
        record.employeeName?.toLowerCase().includes(searchLower) ||
        period.toLowerCase().includes(searchLower);
      const matchesPeriod = selectedPeriod ? period === selectedPeriod : true;
      return matchesSearch && matchesPeriod;
    });
  }, [currentPayrolls, searchTerm, selectedPeriod]);

  // Résumé financier
  const summary = useMemo(() => {
    const totalGross = filteredPayrolls.reduce(
      (sum, r) => sum + Number(r.grossSalary || 0),
      0,
    );
    const totalNet = filteredPayrolls.reduce(
      (sum, r) => sum + Number(r.netSalary || 0),
      0,
    );
    const totalDeductions = filteredPayrolls.reduce(
      (sum, r) => sum + Number(r.deductions || 0),
      0,
    );
    const pendingCount = filteredPayrolls.filter(
      (r) => r.status === PayrollStatus.PENDING,
    ).length;
    const paidCount = filteredPayrolls.filter(
      (r) => r.status === PayrollStatus.PAID,
    ).length;

    return { totalGross, totalNet, totalDeductions, pendingCount, paidCount };
  }, [filteredPayrolls]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleSign = (record: PayrollRecord) => {
    setSigningRecord(record);
  };

  const handleSaveSignature = (payrollId: string, signature: string) => {
    onSaveSignature(
      { payrollId, signature },
      {
        onSuccess: () => {
          toast.success(
            'Signature enregistrée',
            'La fiche de paie a été signée et marquée comme payée.',
          );
          setSigningRecord(null);
        },
        onError: () => {
          toast.error(
            'Erreur de signature',
            "Impossible d'enregistrer la signature.",
          );
        },
      },
    );
  };

  const handleProcessPayroll = () => {
    // Nettoyage + validation stricte YYYY-MM
    const period = (selectedPeriod || '').trim();

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      toast.error('Période invalide', 'Utilisez le format YYYY-MM (ex: 2026-07)');
      return;
    }

    setIsProcessing(true);

    // Préparer le payload avec subsidiaryId si SUPER_ADMIN
    const payload: any = { period, riskGroup: 'A' };
    if (isSuperAdmin && selectedSubsidiaryId) {
      payload.subsidiaryId = selectedSubsidiaryId;
    }

    onProcessPayroll(
      payload,
      {
        onSuccess: (data) => {
          setIsProcessing(false);
          if (data.count === 0) {
            toast.info(
              'Aucune nouvelle fiche',
              data.message || 'Tous les employés ont déjà une fiche pour cette période.',
            );
          } else {
            toast.success(
              'Paie générée',
              data.message || `${data.count} fiche(s) de paie créée(s).`,
            );
          }
        },
        onError: (error: any) => {
          setIsProcessing(false);
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            'Une erreur est survenue lors de la génération de la paie.';
          toast.error('Erreur de traitement', msg);
        },
      },
    );
  };

  const getStatusClass = (status: PayrollStatus | string) => {
    switch (status) {
      case PayrollStatus.PAID:
        return 'bg-green-100 text-green-800';
      case PayrollStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handlePrint = () => {
    window.print();
    toast.info('Impression', "La page est en cours d'impression.");
  };

  const handleExportCsv = () => {
    try {
      const headers = [
        { key: 'employeeName', label: t('hr.payroll.employee') },
        { key: 'payrollPeriod', label: t('hr.payroll.period') },
        { key: 'grossSalary', label: 'Brut' },
        { key: 'deductions', label: 'Retenues' },
        { key: 'netSalary', label: t('hr.payroll.netSalary') },
        { key: 'paymentDate', label: t('hr.payroll.paymentDate') },
        { key: 'status', label: t('hr.payroll.status') },
      ];
      const data = filteredPayrolls.map((r) => ({
        ...r,
        payrollPeriod: r.payrollPeriod || r.period,
        status: t(`hr.payroll.status_${r.status}`),
      }));
      exportToCsv('registre_paie', headers, data);
      toast.success('Export CSV', 'Export réalisé avec succès.');
    } catch {
      toast.error('Erreur export', "Impossible d'exporter en CSV.");
    }
  };

  const handleExportPdf = () => {
    try {
      const headers = [
        { key: 'employeeName', label: t('hr.payroll.employee') },
        { key: 'payrollPeriod', label: t('hr.payroll.period') },
        { key: 'grossSalary', label: 'Brut' },
        { key: 'deductions', label: 'Retenues' },
        { key: 'netSalary', label: t('hr.payroll.netSalary') },
        { key: 'status', label: t('hr.payroll.status') },
      ];
      const data = filteredPayrolls.map((r) => ({
        employeeName: r.employeeName,
        payrollPeriod: r.payrollPeriod || r.period,
        grossSalary: formatCurrency(Number(r.grossSalary || 0)),
        deductions: formatCurrency(Number(r.deductions || 0)),
        netSalary: formatCurrency(Number(r.netSalary || 0)),
        status: t(`hr.payroll.status_${r.status}`),
      }));
      exportToPdf(t('hr.payroll.title'), headers, data, 'paie');
      toast.success('Export PDF', 'Export réalisé avec succès.');
    } catch {
      toast.error('Erreur export', "Impossible d'exporter en PDF.");
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">
            {t('hr.payroll.title')}
          </h3>
          {globalView && (
            <p className="text-xs text-purple-600 font-medium mt-1">
              Vue globale - Toutes les filiales
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Sélecteur de période */}
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          />

          {/* Toggle Vue Globale (SUPER_ADMIN uniquement) */}
          {isSuperAdmin && (
            <button
              onClick={handleToggleGlobalView}
              disabled={isLoadingGlobal}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                globalView
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>{isLoadingGlobal ? 'Chargement...' : globalView ? 'Vue filiale' : 'Vue globale'}</span>
            </button>
          )}

          <button
            onClick={handleProcessPayroll}
            disabled={isProcessing || globalView}
            className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {isProcessing ? 'Traitement...' : t('hr.payroll.process')}
            </span>
          </button>

          <button
            onClick={() => navigate({ to: '/dashboard/hr/signing' })}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <span>Aller au paiement</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
            title={t('common.print')}
          >
            <IconPrint className="h-5 w-5" />
          </button>
          <button
            onClick={handleExportCsv}
            className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
            title={t('common.export')}
          >
            <IconExport className="h-5 w-5" />
          </button>
          <button
            onClick={handleExportPdf}
            className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
            title={t('common.exportPdf')}
          >
            <IconPdf className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500">Fiches</p>
          <p className="text-lg font-bold text-slate-800">
            {filteredPayrolls.length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600">Total Brut</p>
          <p className="text-lg font-bold text-blue-800">
            {formatCurrency(summary.totalGross)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <p className="text-xs text-orange-600">Total Retenues</p>
          <p className="text-lg font-bold text-orange-800">
            {formatCurrency(summary.totalDeductions)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600">Total Net</p>
          <p className="text-lg font-bold text-green-800">
            {formatCurrency(summary.totalNet)}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <p className="text-xs text-yellow-600">En attente</p>
          <p className="text-lg font-bold text-yellow-800">
            {summary.pendingCount}
          </p>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-4 no-print">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t('common.search') || 'Rechercher un employé ou une période...'}
          className="max-w-md"
        />
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              <th className="px-4 py-3">{t('hr.payroll.employee')}</th>
              {globalView && <th className="px-4 py-3">Filiale</th>}
              <th className="px-4 py-3">{t('hr.payroll.period')}</th>
              <th className="px-4 py-3 text-right">Brut</th>
              <th className="px-4 py-3 text-right">Retenues</th>
              <th className="px-4 py-3 text-right">{t('hr.payroll.netSalary')}</th>
              <th className="px-4 py-3">{t('hr.payroll.paymentDate')}</th>
              <th className="px-4 py-3 text-center">{t('hr.payroll.status')}</th>
              {/* <th className="px-4 py-3 text-center no-print">
                {t('hr.payroll.signature')}
              </th>
              <th className="px-4 py-3 text-center no-print">
                {t('common.actions')}
              </th> */}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={7} columns={globalView ? 8 : 7} />
            ) : filteredPayrolls.length === 0 ? (
              <tr>
                <td colSpan={globalView ? 8 : 7}>
                  <EmptyState icon="finance" title={t('hr.payroll.title')} description="Aucune fiche de paie trouvée" />
                </td>
              </tr>
            ) : (
              filteredPayrolls.map((record) => (
                <tr
                  key={record.id}
                  className="bg-white border-b hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {record.employeeName}
                  </td>
                  {globalView && (
                    <td className="px-4 py-3 text-purple-700 font-medium">
                      {(record as any).subsidiary?.subsidiaryName || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {record.payrollPeriod || record.period}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(Number(record.grossSalary || 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {formatCurrency(Number(record.deductions || 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {formatCurrency(Number(record.netSalary || 0))}
                  </td>
                  <td className="px-4 py-3">
                    {record.paymentDate
                      ? new Date(record.paymentDate).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(record.status)}`}
                    >
                      {t(`hr.payroll.status_${record.status}`)}
                    </span>
                  </td>
                  {/* <td className="px-4 py-3 text-center no-print">
                    {record.signature ? (
                      <button
                        onClick={() =>
                          setViewingSignature({
                            name: record.employeeName,
                            signature: record.signature!,
                          })
                        }
                        className="flex items-center mx-auto space-x-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md hover:bg-green-200 transition-colors"
                      >
                        <IconSignature className="h-4 w-4" />
                        <span>{t('common.view')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSign(record)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-md hover:bg-blue-600 transition-colors"
                      >
                        {t('hr.payroll.sign')}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center space-x-1 no-print">
                    <button
                      onClick={() => setViewingDetails(record)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Voir le détail"
                    >
                      <IconEye className="h-5 w-5" />
                    </button>
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      {viewingSignature && (
        <ViewSignatureModal
          isOpen={!!viewingSignature}
          onClose={() => setViewingSignature(null)}
          signatureUrl={viewingSignature.signature}
          name={viewingSignature.name}
        />
      )}

      {signingRecord && (
        <PayrollSignatureModal
          isOpen={!!signingRecord}
          onClose={() => setSigningRecord(null)}
          onSaveSignature={handleSaveSignature}
          record={signingRecord}
        />
      )}

     {viewingDetails && (
  <PayrollDetailsModal
    isOpen={!!viewingDetails}
    onClose={() => setViewingDetails(null)}
    record={viewingDetails}
    company={{
      name: subsidiary?.name,
      address: subsidiary?.address,
      city: '', 
      niu: subsidiary?.ifu, 
      cnpsNumber: '', 
      phone: subsidiary?.phone,
      email: subsidiary?.email,
    }}
  />
)}
    </div>
  );
};

export default PayrollManagement;