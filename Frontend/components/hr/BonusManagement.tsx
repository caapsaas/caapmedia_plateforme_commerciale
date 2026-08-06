import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { Subsidiary, Employee } from '../../types';
import IconArrowLeft from '../icons/IconArrowLeft';
import SearchBar from './SearchBar';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import IconDelete from '../icons/IconDelete';
import { getPendingBonuses, getApprovedBonuses, approveBonus, cancelBonus, extractBonusesFromPayroll, assignBonus } from '../../services/apihr/apiPayroll';
import { getEmployees } from '../../services/apihr/apiEmployees';
import IconPlus from '../icons/IconPlus';

interface PayrollBonus {
  id: string;
  employeeId: string;
  bonusTypeId: string;
  grossAmount: number;
  netAmount: number;
  period: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paymentDate?: string;
  bankTransferId?: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface BonusManagementProps {
  subsidiary: Subsidiary;
}

const BonusManagement: React.FC<BonusManagementProps> = ({ subsidiary }) => {
  const { t, formatCurrency } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();

  const [bonuses, setBonuses] = useState<PayrollBonus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [isExtractingBonuses, setIsExtractingBonuses] = useState(false);
  const [showAddBonusModal, setShowAddBonusModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bonusFormData, setBonusFormData] = useState({
    employeeId: '',
    bonusTypeId: '',
    grossAmount: '',
    paymentMethod: 'DEFAULT',
  });

  // Charger les bonus et employés au montage
  useEffect(() => {
    loadBonuses();
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
      toast.error('Erreur', 'Impossible de charger la liste des employés');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const loadBonuses = async () => {
    setIsLoading(true);
    try {
      const pending = await getPendingBonuses();
      const approved = await getApprovedBonuses();
      setBonuses([...pending, ...approved]);
    } catch (error) {
      toast.error('Erreur', 'Impossible de charger les bonus');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les bonus
  const filteredBonuses = useMemo(() => {
    return bonuses.filter((bonus) => {
      const searchLower = searchTerm.toLowerCase();
      const period = bonus.period || '';
      const matchesPeriod = selectedPeriod ? period === selectedPeriod : true;
      return matchesPeriod;
    });
  }, [bonuses, searchTerm, selectedPeriod]);

  // Résumé financier
  const summary = useMemo(() => {
    const totalGross = filteredBonuses.reduce((sum, b) => sum + Number(b.grossAmount || 0), 0);
    const totalNet = filteredBonuses.reduce((sum, b) => sum + Number(b.netAmount || 0), 0);
    const pendingCount = filteredBonuses.filter((b) => b.status === 'PENDING').length;
    const approvedCount = filteredBonuses.filter((b) => b.status === 'APPROVED').length;
    const paidCount = filteredBonuses.filter((b) => b.status === 'PAID').length;

    return { totalGross, totalNet, pendingCount, approvedCount, paidCount };
  }, [filteredBonuses]);

  // Approuver un bonus
  const handleApproveBonus = async (bonusId: string) => {
    setIsApproving(bonusId);
    try {
      await approveBonus(bonusId);
      toast.success('Bonus approuvé', 'Le bonus a été approuvé avec succès.');
      loadBonuses();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Impossible d\'approuver le bonus.';
      toast.error('Erreur', msg);
    } finally {
      setIsApproving(null);
    }
  };

  // Annuler un bonus
  const handleCancelBonus = async (bonusId: string, reason: string = 'Annulation par l\'utilisateur') => {
    setIsCancelling(bonusId);
    try {
      await cancelBonus(bonusId, reason);
      toast.success('Bonus annulé', 'Le bonus a été annulé avec succès.');
      loadBonuses();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Impossible d\'annuler le bonus.';
      toast.error('Erreur', msg);
    } finally {
      setIsCancelling(null);
    }
  };

  // Extraire les bonus des fiches de paie
  const handleExtractBonuses = async () => {
    if (!selectedPeriod) {
      toast.error('Période invalide', 'Sélectionnez une période valide');
      return;
    }

    setIsExtractingBonuses(true);
    try {
      const result = await extractBonusesFromPayroll(selectedPeriod);
      toast.success(
        'Bonus extraits',
        `${result.created} bonus créé(s), ${result.skipped} ignoré(s).`
      );
      loadBonuses();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Impossible d\'extraire les bonus.';
      toast.error('Erreur', msg);
    } finally {
      setIsExtractingBonuses(false);
    }
  };

  // Attribuer un bonus
  const handleAddBonus = async () => {
    if (!bonusFormData.employeeId || !bonusFormData.bonusTypeId || !bonusFormData.grossAmount) {
      toast.error('Données incomplètes', 'Veuillez remplir tous les champs requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      await assignBonus({
        employeeId: bonusFormData.employeeId,
        bonusTypeId: bonusFormData.bonusTypeId,
        grossAmount: Number(bonusFormData.grossAmount),
        period: selectedPeriod,
        paymentMethod: bonusFormData.paymentMethod,
      });
      toast.success('Bonus créé', 'Le bonus a été attribué avec succès.');
      setShowAddBonusModal(false);
      setBonusFormData({ employeeId: '', bonusTypeId: '', grossAmount: '', paymentMethod: 'DEFAULT' });
      loadBonuses();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Impossible d\'ajouter le bonus.';
      toast.error('Erreur', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Payé';
      case 'APPROVED':
        return 'Approuvé';
      case 'PENDING':
        return 'En attente';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/dashboard/hr' })}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Retour"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="text-xl font-semibold text-slate-800">Paiement des bonus</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de période */}
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          />

          <button
            onClick={handleExtractBonuses}
            disabled={isExtractingBonuses}
            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Extraire les bonus des fiches de paie et les convertir en PayrollBonus"
          >
            {isExtractingBonuses ? 'Extraction...' : 'Extraire les bonus des primes'}
          </button>

          <button
            onClick={() => setShowAddBonusModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-md hover:bg-orange-600 transition-colors"
          >
            <IconPlus className="h-4 w-4" />
            Attribuer un bonus
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-lg font-bold text-slate-800">{filteredBonuses.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600">Total Brut</p>
          <p className="text-lg font-bold text-blue-800">{formatCurrency(summary.totalGross)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600">Total Net</p>
          <p className="text-lg font-bold text-green-800">{formatCurrency(summary.totalNet)}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <p className="text-xs text-yellow-600">En attente</p>
          <p className="text-lg font-bold text-yellow-800">{summary.pendingCount}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600">Approuvés</p>
          <p className="text-lg font-bold text-purple-800">{summary.approvedCount}</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Rechercher un bonus..."
          className="max-w-md"
        />
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              <th className="px-4 py-3">Employé</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Brut</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={7} columns={6} />
            ) : filteredBonuses.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon="finance"
                    title="Aucun bonus"
                    description="Aucun bonus pour cette période."
                  />
                </td>
              </tr>
            ) : (
              filteredBonuses.map((bonus) => (
                <tr key={bonus.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {bonus.bonusTypeId || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {bonus.period || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(Number(bonus.grossAmount || 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    {formatCurrency(Number(bonus.netAmount || 0))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(bonus.status)}`}
                    >
                      {getStatusLabel(bonus.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    {bonus.status === 'PENDING' && (
                      <button
                        onClick={() => handleApproveBonus(bonus.id)}
                        disabled={isApproving === bonus.id}
                        className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {isApproving === bonus.id ? 'Approbation...' : 'Approuver'}
                      </button>
                    )}
                    <button
                      onClick={() => handleCancelBonus(bonus.id)}
                      disabled={isCancelling === bonus.id || bonus.status === 'PAID'}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Annuler"
                    >
                      <IconDelete className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modale Attribuer un Bonus */}
      {showAddBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">Attribuer un bonus</h2>
              <p className="text-sm text-slate-600 mt-1">Période : {selectedPeriod}</p>
            </div>
            <div className="px-6 pb-6 space-y-4 max-h-96 overflow-y-auto">
              {/* Employé */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Employé <span className="text-red-500">*</span>
                </label>
                <select
                  value={bonusFormData.employeeId}
                  onChange={(e) => setBonusFormData({ ...bonusFormData, employeeId: e.target.value })}
                  disabled={isLoadingEmployees}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  <option value="">— Sélectionner —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type de bonus */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Type de bonus <span className="text-red-500">*</span>
                </label>
                <select
                  value={bonusFormData.bonusTypeId}
                  onChange={(e) => setBonusFormData({ ...bonusFormData, bonusTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">— Sélectionner —</option>
                  <option value="PERFORMANCE">Bonus de performance</option>
                  <option value="THIRTEENTH_MONTH">13e mois</option>
                  <option value="ANNUAL">Bonus annuel</option>
                  <option value="SPECIAL">Bonus spécial</option>
                </select>
              </div>

              {/* Montant brut */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Montant brut <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={bonusFormData.grossAmount}
                  onChange={(e) => setBonusFormData({ ...bonusFormData, grossAmount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Méthode de paiement */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Méthode de paiement
                </label>
                <select
                  value={bonusFormData.paymentMethod}
                  onChange={(e) => setBonusFormData({ ...bonusFormData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-orange-300 rounded-md text-slate-700 bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="DEFAULT">Par défaut (celle de l'employé)</option>
                  <option value="BANK_TRANSFER">Virement bancaire</option>
                  <option value="CHECK">Chèque</option>
                  <option value="CASH">Espèces</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 rounded-b-lg">
              <button
                onClick={() => {
                  setShowAddBonusModal(false);
                  setBonusFormData({ employeeId: '', bonusTypeId: '', grossAmount: '', paymentMethod: 'DEFAULT' });
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddBonus}
                disabled={isSubmitting}
                className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusManagement;
