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
import { getPayrollRecordsGlobal, accumulateCharges } from '../../services/apihr/apiPayroll';
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

const getLocalPayrollPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

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
    getLocalPayrollPeriod(),
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

  // États pour les charges
  const [isGeneratingCharges, setIsGeneratingCharges] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [chargesData, setChargesData] = useState<any>(null);
  const [showChargesConfirmation, setShowChargesConfirmation] = useState(false);

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

  // Handler pour aller à la page de gestion des bonus
  const handleGoToBonus = () => {
    navigate({ to: '/dashboard/hr/bonus' });
  };

  // Handler pour accumuler les charges patronales (affiche modale)
  const handleAccumulateCharges = async () => {
    const month = selectedPeriod;

    if (!month) {
      toast.error('Période invalide', 'Sélectionnez une période valide');
      return;
    }
    if (!targetSubsidiaryId) {
      toast.error('Filiale requise', 'Sélectionnez une filiale avant de calculer les charges.');
      return;
    }

    setIsGeneratingCharges(true);
    try {
      const result: any = await accumulateCharges(month, targetSubsidiaryId);

      if (result.totalPayrolls === 0) {
        setIsGeneratingCharges(false);
        toast.info('Aucune donnée', `Aucune fiche de paie trouvée pour ${month}`);
      } else {
        setChargesData(result);
        setShowChargesConfirmation(true);
        setIsGeneratingCharges(false);
      }
    } catch (error: any) {
      setIsGeneratingCharges(false);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Impossible de récupérer les charges.';
      toast.error('Erreur', msg);
    }
  };

  const closeChargesSummary = () => {
    setShowChargesConfirmation(false);
    setChargesData(null);
  };

  // Utiliser les données globales ou filiales selon la vue
  const currentPayrolls = globalView ? globalPayrolls : payrolls;

  // Filtrage des fiches de paie
  const filteredPayrolls = useMemo(() => {
    const payrollsArray = Array.isArray(currentPayrolls) ? currentPayrolls : [];
    return payrollsArray.filter((record) => {
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

  const handleProcessPayroll = (forceRegenerate: boolean = false) => {
    // Nettoyage + validation stricte YYYY-MM
    const period = (selectedPeriod || '').trim();

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      toast.error('Période invalide', 'Utilisez le format YYYY-MM (ex: 2026-07)');
      return;
    }

    setIsProcessing(true);

    // La page parent fournit la filiale active; le backend en a besoin pour
    // les utilisateurs globaux et vérifie le scope pour les autres rôles.
    const payload: any = {
      period,
      subsidiaryId: targetSubsidiaryId,
      riskGroup: 'A',
      forceRegenerate
    };

    onProcessPayroll(
      payload,
      {
        onSuccess: (data: any) => {
          setIsProcessing(false);
          setShowRegenerateModal(false);

          // Si aucune fiche créée et aucune régénérée, proposer la régénération
          if (data.count === 0 && data.regenerated === 0 && !forceRegenerate) {
            setShowRegenerateModal(true);
            return;
          }

          if (data.count === 0 && data.regenerated === 0) {
            toast.info(
              'Aucune nouvelle fiche',
              data.message || 'Tous les employés ont déjà une fiche pour cette période.',
            );
          } else {
            const message = data.regenerated
              ? `${data.regenerated} fiche(s) régénérée(s) + ${data.count} fiche(s) créée(s)`
              : `${data.count} fiche(s) de paie créée(s)`;
            toast.success(
              'Paie générée',
              data.message || message,
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

  const handleRegenerateConfirm = () => {
    handleProcessPayroll(true);
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
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{t('hr.title')}</p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{t('hr.payroll.title')}</h3>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{t('hr.payroll.subtitle')}</p>
            {globalView && <p className="mt-2 inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">{t('hr.payroll.globalView')}</p>}
          </div>

          <div className="flex flex-wrap items-end gap-2.5 no-print xl:justify-end">
            <label className="text-xs font-medium text-slate-500">
              <span className="mb-1.5 block">{t('hr.payroll.period')}</span>
              <input type="month" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-lime-400 focus:ring-4 focus:ring-lime-100" />
            </label>
            {isSuperAdmin && (
              <button onClick={handleToggleGlobalView} disabled={isLoadingGlobal} className={`h-10 rounded-xl border px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${globalView ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                {isLoadingGlobal ? t('hr.payroll.loading') : globalView ? t('hr.payroll.subsidiaryView') : t('hr.payroll.globalView')}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 no-print">
          <button onClick={() => handleProcessPayroll()} disabled={isProcessing || globalView} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#c6e911] px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-[#b6d90e] disabled:cursor-not-allowed disabled:opacity-50" title={t('hr.payroll.processHelp')}>
            {isProcessing ? t('hr.payroll.processing') : t('hr.payroll.process')}
          </button>
          <button onClick={handleGoToBonus} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">{t('hr.payroll.bonusPayments')}</button>
          <button onClick={handleAccumulateCharges} disabled={isGeneratingCharges || globalView} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            {isGeneratingCharges ? t('hr.payroll.generatingCharges') : t('hr.payroll.generateCharges')}
          </button>
          <button onClick={() => navigate({ to: '/dashboard/hr/signing' })} className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-3.5 text-sm font-medium text-white transition hover:bg-slate-700">{t('hr.payroll.goToPayments')}</button>
          <span className="mx-1 hidden h-6 border-l border-slate-200 sm:block" />
          <div className="ml-auto flex items-center gap-1">
            <button onClick={handlePrint} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" title={t('common.print')} aria-label={t('common.print')}><IconPrint className="h-5 w-5" /></button>
            <button onClick={handleExportCsv} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" title={t('common.export')} aria-label={t('common.export')}><IconExport className="h-5 w-5" /></button>
            <button onClick={handleExportPdf} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" title={t('common.exportPdf')} aria-label={t('common.exportPdf')}><IconPdf className="h-5 w-5" /></button>
          </div>
        </div>
      </section>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">{t('hr.payroll.records')}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {filteredPayrolls.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">{t('hr.payroll.totalGross')}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrency(summary.totalGross)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">{t('hr.payroll.totalDeductions')}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrency(summary.totalDeductions)}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 shadow-sm">
          <p className="text-xs font-medium text-emerald-700">{t('hr.payroll.totalNet')}</p>
          <p className="mt-2 text-lg font-semibold text-emerald-900">
            {formatCurrency(summary.totalNet)}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 shadow-sm">
          <p className="text-xs font-medium text-amber-700">{t('hr.payroll.pending')}</p>
          <p className="mt-2 text-xl font-semibold text-amber-900">
            {summary.pendingCount}
          </p>
        </div>
      </div>

      {/* Recherche */}
      <div className="no-print">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t('common.search') || 'Rechercher un employé ou une période...'}
          className="max-w-md"
        />
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
       <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">{t('hr.payroll.employee')}</th>
              {globalView && <th className="px-5 py-3.5">{t('hr.payroll.subsidiary')}</th>}
              <th className="px-5 py-3.5">{t('hr.payroll.period')}</th>
              <th className="px-5 py-3.5 text-right">{t('hr.payroll.gross')}</th>
              <th className="px-5 py-3.5 text-right">{t('hr.payroll.deductions')}</th>
              <th className="px-5 py-3.5 text-right">{t('hr.payroll.netSalary')}</th>
              <th className="px-5 py-3.5">{t('hr.payroll.paymentDate')}</th>
              <th className="px-5 py-3.5 text-center">{t('hr.payroll.status')}</th>
              <th className="px-5 py-3.5 text-right no-print">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={7} columns={globalView ? 9 : 8} />
            ) : filteredPayrolls.length === 0 ? (
              <tr>
                <td colSpan={globalView ? 9 : 8}>
                  <EmptyState icon="finance" title={t('hr.payroll.title')} description={t('hr.payroll.noPayrollFound')} />
                </td>
              </tr>
            ) : (
              filteredPayrolls.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4 font-medium text-slate-900">
                    <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">{record.employeeName?.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase()}</span>{record.employeeName}</div>
                  </td>
                  {globalView && (
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {(record as any).subsidiary?.subsidiaryName || '—'}
                    </td>
                  )}
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {record.payrollPeriod || record.period}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCurrency(Number(record.grossSalary || 0))}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-500">
                    {formatCurrency(Number(record.deductions || 0))}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
                    {formatCurrency(Number(record.netSalary || 0))}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {record.paymentDate
                      ? new Date(record.paymentDate).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(record.status)}`}
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
                  <td className="px-5 py-4 text-right no-print">
                    <button onClick={() => setViewingDetails(record)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" title={t('hr.payroll.details')} aria-label={t('hr.payroll.details')}><IconEye className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
       </div>
      </div>

      {/* Modale de confirmation régénération */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-white">
              <h2 className="text-lg font-bold">⚠️ Régénérer les fiches de paie</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-700">
                Cette action va <strong>supprimer et regénérer</strong> toutes les fiches de paie existantes pour la période <strong>{selectedPeriod}</strong> avec les données actuelles des employés.
              </p>
              <p className="text-sm text-slate-600">
                ✅ Utilisez cette option après avoir modifié les informations d'un employé (salaire, bonus, etc.)
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="px-4 py-2 bg-slate-300 text-slate-800 font-semibold rounded-md hover:bg-slate-400 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRegenerateConfirm}
                disabled={isProcessing}
                className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Régénération...' : 'Regénérer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation des charges - Design moderne */}
      {showChargesConfirmation && chargesData && (() => {
        // Calculer le total de toutes les charges affichées
        let totalAllCharges = 0;

        // Salaires nets
        Object.values(chargesData.salaryDeductions.byPaymentMethod).forEach((deductions: any) => {
          totalAllCharges += deductions.netSalary;
        });

        // Charges patronales
        Object.values(chargesData.employerCharges).forEach((charge: any) => {
          totalAllCharges += charge.amount;
        });

        // Primes mensuelles
        totalAllCharges += chargesData.monthlyPrimes?.totalPrimes || 0;

        // Bonus nets
        totalAllCharges += chargesData.bonusCharges?.netBonusesTotal || 0;

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* En-tête avec gradient vert */}
            <div className="border-b border-slate-100 bg-white px-6 py-5 text-slate-900 sm:px-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Résumé des charges</h2>
                  <p className="mt-1 text-sm text-slate-500">Période : {selectedPeriod} · {chargesData.totalPayrolls} fiche(s)</p>
                </div>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 sm:p-6">
              {/* Salaires par mode de paiement - SECTION PRINCIPALE */}
              {chargesData.salaryDeductions?.grandTotal > 0 && (
                <div className="bg-gradient-to-br from-[#f0fde4] to-white rounded-xl p-5 border-2 border-[#c6e911]/30">
                  <p className="text-sm font-bold text-[#5a7c0f] mb-4 uppercase tracking-wide">💰 Salaires par mode de paiement</p>
                  <div className="space-y-3">
                    {Object.entries(chargesData.salaryDeductions.byPaymentMethod).map(([method, deductions]: [string, any]) => {
                      const methodLabel: Record<string, string> = {
                        BANK_TRANSFER: 'Virement bancaire',
                        CHECK: 'Chèque',
                        CASH: 'Espèce',
                        UNKNOWN: 'Autre',
                      };
                      return (
                        <div key={method} className="bg-white rounded-lg p-4 border border-[#e0f0a0] hover:border-[#c6e911] transition-colors">
                          <p className="font-bold text-slate-800 mb-3">{methodLabel[method] || method}</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Salaire brut</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(deductions.grossSalary)}</span>
                            </div>
                            <div className="border-t border-[#e0f0a0] pt-2"></div>
                            <div className="flex justify-between items-center text-slate-600 text-xs">
                              <span>CNPS</span>
                              <span>{deductions.cnps > 0 ? `- ${formatCurrency(deductions.cnps)}` : '-'}</span>
                            </div>
                            {deductions.cfc > 0 && (
                              <div className="flex justify-between items-center text-slate-600 text-xs">
                                <span>CFC</span>
                                <span>- {formatCurrency(deductions.cfc)}</span>
                              </div>
                            )}
                            {deductions.irpp > 0 && (
                              <div className="flex justify-between items-center text-slate-600 text-xs">
                                <span>IRPP</span>
                                <span>- {formatCurrency(deductions.irpp)}</span>
                              </div>
                            )}
                            {deductions.cac > 0 && (
                              <div className="flex justify-between items-center text-slate-600 text-xs">
                                <span>CAC</span>
                                <span>- {formatCurrency(deductions.cac)}</span>
                              </div>
                            )}
                            {deductions.other > 0 && (
                              <div className="flex justify-between items-center text-slate-600 text-xs">
                                <span>Autres retenues</span>
                                <span>- {formatCurrency(deductions.other)}</span>
                              </div>
                            )}
                            <div className="border-t border-[#e0f0a0] pt-2"></div>
                            <div className="flex justify-between items-center bg-gradient-to-r from-[#c6e911]/10 to-transparent p-3 rounded-lg">
                              <span className="font-bold text-[#5a7c0f]">Salaire net</span>
                              <span className="font-bold text-lg text-[#5a7c0f]">{formatCurrency(deductions.netSalary)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Charges patronales */}
              {Object.keys(chargesData.employerCharges || {}).length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border-2 border-blue-200">
                  <p className="text-sm font-bold text-blue-900 mb-3 uppercase tracking-wide">💼 Charges patronales</p>
                  <div className="space-y-2">
                    {Object.entries(chargesData.employerCharges).map(([type, data]: [string, any]) => (
                      <div key={type} className="flex justify-between text-sm px-3 py-2 bg-white rounded border border-blue-100">
                        <span className="font-medium text-slate-700">{type}</span>
                        <span className="font-bold text-blue-700">{formatCurrency(data.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primes mensuelles */}
              {chargesData.monthlyPrimes?.totalPrimes > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 border-2 border-purple-200">
                  <p className="text-sm font-bold text-purple-900 mb-3 uppercase tracking-wide">🏆 Primes mensuelles</p>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between px-3 py-2 bg-white rounded border border-purple-100">
                      <span className="text-slate-600">Total</span>
                      <span className="font-bold text-purple-700">{formatCurrency(chargesData.monthlyPrimes.totalPrimes)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 bg-white rounded border border-purple-100 text-xs">
                      <span className="text-slate-600">{chargesData.monthlyPrimes.employeesWithPrimes} employé(s) • Moy. {formatCurrency(chargesData.monthlyPrimes.averagePrimePerEmployee)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Charges liées aux bonus */}
              {chargesData.bonusCharges?.totalBonuses > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-5 border-2 border-amber-200">
                  <p className="text-sm font-bold text-amber-900 mb-3 uppercase tracking-wide">🎁 Charges liées aux bonus</p>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between px-3 py-2 bg-white rounded border border-amber-100">
                      <span className="text-slate-600">{chargesData.bonusCharges.totalBonuses} bonus à payer</span>
                      <span className="font-bold text-amber-700">{formatCurrency(chargesData.bonusCharges.netBonusesTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Total général - En évidence */}
              <div className="bg-gradient-to-br from-[#c6e911] to-[#a8c90d] rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">Montant total des charges</p>
                    <p className="text-xs text-slate-600 mt-1">Tous les éléments ci-dessus</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-slate-900">
                      {formatCurrency(totalAllCharges)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
              <button
                onClick={closeChargesSummary}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
        );
      })()}

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
