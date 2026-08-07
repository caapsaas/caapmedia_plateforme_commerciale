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
        setGlobalPayrolls(Array.isArray(data) ? data : data?.data || []);
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

    setIsGeneratingCharges(true);
    try {
      const result: any = await accumulateCharges(month);

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

  const handleConfirmCharges = () => {
    if (chargesData) {
      const month = selectedPeriod;
      toast.success(
        'Charges générées',
        `${chargesData.totalPayrolls} fiche(s) de paie - Total: ${formatCurrency(chargesData.grandTotalAllCharges)}`
      );
      setShowChargesConfirmation(false);
      setChargesData(null);
    }
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

    // Préparer le payload avec subsidiaryId si SUPER_ADMIN
    const payload: any = {
      period,
      riskGroup: 'A',
      forceRegenerate
    };
    if (isSuperAdmin && selectedSubsidiaryId) {
      payload.subsidiaryId = selectedSubsidiaryId;
    }

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
            onClick={() => handleProcessPayroll()}
            disabled={isProcessing || globalView}
            className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Générer les fiches de paie (crée ou regénère selon les fiches existantes)"
          >
            <span>
              {isProcessing ? 'Traitement...' : t('hr.payroll.process')}
            </span>
          </button>

          <button
            onClick={handleGoToBonus}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors"
            title="Gérer les paiements de bonus"
          >
            <span>Paiement des bonus</span>
          </button>

          <button
            onClick={handleAccumulateCharges}
            disabled={isGeneratingCharges || globalView}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Générer les charges de paies"
          >
            <span>
              {isGeneratingCharges ? 'Génération...' : 'Génération des charges de paies'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* En-tête avec gradient vert */}
            <div className="bg-gradient-to-br from-[#c6e911] to-[#a8c90d] px-8 py-8 text-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">📊 Résumé des charges</h2>
                  <p className="text-sm font-semibold text-slate-700 opacity-90">Période: {selectedPeriod} • {chargesData.totalPayrolls} fiche(s)</p>
                </div>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="p-8 space-y-5 max-h-96 overflow-y-auto">
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
            <div className="bg-slate-50 px-8 py-5 flex justify-end gap-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowChargesConfirmation(false);
                  setChargesData(null);
                }}
                className="px-6 py-2.5 bg-white text-slate-700 font-semibold rounded-lg border-2 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmCharges}
                className="px-6 py-2.5 bg-gradient-to-r from-[#c6e911] to-[#a8c90d] text-slate-900 font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
              >
                ✓ Confirmer les charges
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