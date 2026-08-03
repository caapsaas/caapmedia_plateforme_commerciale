import React, { useState, useEffect } from 'react';

interface CameroonTaxRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    cfcEmployeeRate?: number;
    cfcEmployerRate?: number;
    fneRate?: number;
    cnpsCap?: number;
    professionalExpenseRate?: number;
    fixedAbatementAnnual?: number;
    riskGroupARate?: number;
    riskGroupBRate?: number;
    riskGroupCRate?: number;
  }) => Promise<void>;
  cfcEmployeeRate: number;
  cfcEmployerRate: number;
  fneRate: number;
  cnpsCap: number;
  professionalExpenseRate: number;
  fixedAbatementAnnual: number;
  riskGroupARate: number;
  riskGroupBRate: number;
  riskGroupCRate: number;
  isLoading: boolean;
}

const CameroonTaxRatesModal: React.FC<CameroonTaxRatesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cfcEmployeeRate,
  cfcEmployerRate,
  fneRate,
  cnpsCap,
  professionalExpenseRate,
  fixedAbatementAnnual,
  riskGroupARate,
  riskGroupBRate,
  riskGroupCRate,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    cfcEmployeeRate,
    cfcEmployerRate,
    fneRate,
    cnpsCap,
    professionalExpenseRate,
    fixedAbatementAnnual,
    riskGroupARate,
    riskGroupBRate,
    riskGroupCRate,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        cfcEmployeeRate,
        cfcEmployerRate,
        fneRate,
        cnpsCap,
        professionalExpenseRate,
        fixedAbatementAnnual,
        riskGroupARate,
        riskGroupBRate,
        riskGroupCRate,
      });
      setError('');
    }
  }, [isOpen, cfcEmployeeRate, cfcEmployerRate, fneRate, cnpsCap, professionalExpenseRate, fixedAbatementAnnual, riskGroupARate, riskGroupBRate, riskGroupCRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.cfcEmployeeRate < 0 || formData.cfcEmployeeRate > 1) {
      setError('Le taux CFC employé doit être entre 0 et 1');
      return;
    }
    if (formData.cfcEmployerRate < 0 || formData.cfcEmployerRate > 1) {
      setError('Le taux CFC employeur doit être entre 0 et 1');
      return;
    }
    if (formData.fneRate < 0 || formData.fneRate > 1) {
      setError('Le taux FNE doit être entre 0 et 1');
      return;
    }
    if (formData.cnpsCap < 0) {
      setError('Le plafond CNPS doit être positif');
      return;
    }
    if (formData.professionalExpenseRate < 0 || formData.professionalExpenseRate > 1) {
      setError('Le taux d\'abattement professionnel doit être entre 0 et 1');
      return;
    }
    if (formData.fixedAbatementAnnual < 0) {
      setError('L\'abattement fixe annuel doit être positif');
      return;
    }
    if (formData.riskGroupARate < 0 || formData.riskGroupARate > 1) {
      setError('Le taux du groupe A doit être entre 0 et 1');
      return;
    }
    if (formData.riskGroupBRate < 0 || formData.riskGroupBRate > 1) {
      setError('Le taux du groupe B doit être entre 0 et 1');
      return;
    }
    if (formData.riskGroupCRate < 0 || formData.riskGroupCRate > 1) {
      setError('Le taux du groupe C doit être entre 0 et 1');
      return;
    }

    try {
      await onSave({
        cfcEmployeeRate: formData.cfcEmployeeRate,
        cfcEmployerRate: formData.cfcEmployerRate,
        fneRate: formData.fneRate,
        cnpsCap: formData.cnpsCap,
        professionalExpenseRate: formData.professionalExpenseRate,
        fixedAbatementAnnual: formData.fixedAbatementAnnual,
        riskGroupARate: formData.riskGroupARate,
        riskGroupBRate: formData.riskGroupBRate,
        riskGroupCRate: formData.riskGroupCRate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Paramètres fiscaux camerounais
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Configurez les taux et plafonds utilisés pour le calcul de la paie au Cameroun.
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CFC Rates */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Crédit Foncier (CFC)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Taux employé (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(formData.cfcEmployeeRate * 100).toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, cfcEmployeeRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Taux employeur (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(formData.cfcEmployerRate * 100).toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, cfcEmployerRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* FNE Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fonds National de l'Emploi (FNE) - Taux (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={(formData.fneRate * 100).toFixed(2)}
                onChange={(e) => setFormData({ ...formData, fneRate: parseFloat(e.target.value) / 100 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                disabled={isLoading}
              />
            </div>

            {/* CNPS Cap */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Plafond CNPS (FCFA)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.cnpsCap}
                onChange={(e) => setFormData({ ...formData, cnpsCap: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Plafond mensuel pour le calcul des cotisations CNPS
              </p>
            </div>

            {/* Professional Expense Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Abattement professionnel (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={(formData.professionalExpenseRate * 100).toFixed(2)}
                onChange={(e) => setFormData({ ...formData, professionalExpenseRate: parseFloat(e.target.value) / 100 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Pourcentage appliqué sur le salaire après CNPS pour le calcul de l'IRPP
              </p>
            </div>

            {/* Fixed Abatement Annual */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Abattement fixe annuel (FCFA)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.fixedAbatementAnnual}
                onChange={(e) => setFormData({ ...formData, fixedAbatementAnnual: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Montant déduit annuellement (divisé par 12 mensuellement)
              </p>
            </div>

            {/* Risk Group Rates */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Taux d'accident du travail</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Groupe A (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(formData.riskGroupARate * 100).toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, riskGroupARate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-500 mt-1">Risque faible</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Groupe B (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(formData.riskGroupBRate * 100).toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, riskGroupBRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-500 mt-1">Risque moyen</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Groupe C (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(formData.riskGroupCRate * 100).toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, riskGroupCRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-500 mt-1">Risque élevé</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-lg font-semibold hover:bg-[#adc40f] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CameroonTaxRatesModal;
