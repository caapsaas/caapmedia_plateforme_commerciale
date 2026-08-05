import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { useToast } from '../context/ToastContext';
import { getPayrollRecords, signPayrollRecord, getPayrollRecordById } from '../services/apihr/apiPayroll';
import { PayrollRecord, PayrollStatus } from '../types';
import PayrollSignatureModal from '../components/hr/PayrollSignatureModal';
import PayrollDetailsModal from '../components/hr/PayrollDetailsModal';
import IconArrowLeft from '../components/icons/IconArrowLeft';
import IconSearch from '../components/icons/IconSearch';
import IconBriefcase from '../components/icons/IconBriefcase';
import IconDocumentText from '../components/icons/IconDocumentText';
import IconEye from '../components/icons/IconEye';

const PayrollSigningPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7), // YYYY-MM
  );
  const [signingRecord, setSigningRecord] = useState<PayrollRecord | null>(null);
  const [showPayslip, setShowPayslip] = useState(false);
  const [payslipRecord, setPayslipRecord] = useState<PayrollRecord | null>(null);

  // Charger les fiches de paie en attente
  useEffect(() => {
    loadPendingPayrolls();
  }, []);

  const loadPendingPayrolls = async () => {
    try {
      setLoading(true);
      const data = await getPayrollRecords();
      // Charger toutes les fiches (PENDING et PAID récemment signées)
      setPayrolls(data);
    } catch (error) {
      console.error('Erreur lors du chargement des fiches de paie:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Filtrer par recherche et période
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      const period = record.payrollPeriod || record.period || '';
      const matchesSearch =
        record.employeeName?.toLowerCase().includes(searchLower) ||
        period.toLowerCase().includes(searchLower);
      const matchesPeriod = selectedPeriod ? period === selectedPeriod : true;
      return matchesSearch && matchesPeriod;
    });
  }, [payrolls, searchTerm, selectedPeriod]);

  const handleSign = (record: PayrollRecord) => {
    setSigningRecord(record);
  };

  const handleSaveSignature = async (recordId: string, signature: string) => {
    try {
      console.log('Signature attempt:', { recordId, signature: signature ? 'present' : 'empty' });
      console.log('Record ID format:', recordId);
      if (!signature || signature.trim() === '') {
        toast.error('Erreur', 'La signature ne peut pas être vide');
        return;
      }
      if (!recordId) {
        toast.error('Erreur', 'ID de fiche de paie manquant');
        return;
      }
      await signPayrollRecord(recordId, signature);
      toast.success('Signature enregistrée avec succès');
      setSigningRecord(null);
      
      // Récupérer la fiche de paie mise à jour (statut PAID)
      const updatedRecord = await getPayrollRecordById(recordId);
      setPayslipRecord(updatedRecord);
      setShowPayslip(true);
      
      // Recharger la liste après signature
      await loadPendingPayrolls();
    } catch (error: any) {
      console.error('Erreur lors de la signature:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Erreur lors de la signature');
    }
  };

  const handleCloseSignatureModal = () => {
    setSigningRecord(null);
  };

  const handleClosePayslipModal = () => {
    setShowPayslip(false);
    setPayslipRecord(null);
  };

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate({ to: '/dashboard/hr' })}
            className="p-2 hover:bg-slate-200 rounded-md transition-colors"
            title={t('common.back')}
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {t('hr.payroll.signingTitle')}
          </h1>
        </div>
      </div>

      {/* Barre de recherche et filtre de période */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <input
          type="month"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Liste des fiches de paie */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-slate-600">{t('common.loading')}</p>
        </div>
      ) : filteredPayrolls.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <IconDocumentText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">{t('hr.payroll.noPendingPayrolls')}</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('hr.employee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('hr.payroll.period')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('hr.payroll.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayrolls.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <IconBriefcase className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">
                          {record.employeeName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <IconDocumentText className="h-4 w-4 mr-2" />
                      {record.payrollPeriod || record.period}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.status === PayrollStatus.PAID
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status === PayrollStatus.PAID
                        ? t('hr.payroll.status_PAID')
                        : t('hr.payroll.status_PENDING')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      {/* Bouton Voir/Exporter - toujours visible */}
                      <button
                        onClick={() => {
                          setPayslipRecord(record);
                          setShowPayslip(true);
                        }}
                        className="px-3 py-2 bg-slate-600 text-white text-xs rounded-md hover:bg-slate-700 transition-colors inline-flex items-center gap-1"
                        title="Afficher le bulletin et options d'export"
                      >
                        <IconEye className="h-4 w-4" />
                        {t('common.view')}
                      </button>

                      {/* Bouton Signer - uniquement si PENDING */}
                      {record.status === PayrollStatus.PENDING && (
                        <button
                          onClick={() => handleSign(record)}
                          className="px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors font-medium"
                          title="Signer la fiche de paie"
                        >
                          ✍️ {t('hr.payroll.sign')}
                        </button>
                      )}

                      {/* Badge Signé - si PAID */}
                      {record.status === PayrollStatus.PAID && (
                        <span className="px-3 py-2 bg-green-100 text-green-800 text-xs font-medium rounded-md">
                          ✓ {t('hr.payroll.status_PAID')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale de signature */}
      {signingRecord && (
        <PayrollSignatureModal
          isOpen={!!signingRecord}
          onClose={handleCloseSignatureModal}
          onSaveSignature={handleSaveSignature}
          record={signingRecord}
        />
      )}

      {/* Modal du bulletin de paie - affiché automatiquement après signature */}
      {showPayslip && payslipRecord && (
        <PayrollDetailsModal
          isOpen={showPayslip}
          onClose={handleClosePayslipModal}
          record={payslipRecord}
        />
      )}
    </div>
  );
};

export default PayrollSigningPage;
