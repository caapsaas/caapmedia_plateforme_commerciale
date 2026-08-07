import React, { useState, useEffect } from 'react';
import { TreasuryAccount, Subsidiary, UserRole } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { useHasRole } from '../../hooks/useHasRole';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TreasuryAccountFormModal from './TreasuryAccountFormModal';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import { getTreasuryAccounts, createTreasuryAccount, updateTreasuryAccount, deleteTreasuryAccount, TreasuryAccountCreationData, TreasuryAccountUpdateData } from '../../services/apiFinance/apiTreasury';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';

interface TreasuryAccountManagementProps {
  subsidiary: Subsidiary;
}

const TreasuryAccountManagement: React.FC<TreasuryAccountManagementProps> = ({ subsidiary }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { hasRole } = useHasRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<TreasuryAccount | null>(null);
  const [editingAccount, setEditingAccount] = useState<TreasuryAccount | null>(null);

  const isSuperAdmin = (user?.activeRole ?? user?.userRole) === UserRole.SUPER_ADMIN;

  const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
    queryKey: ['subsidiaries-list'],
    queryFn: getSubsidiaries,
    enabled: isSuperAdmin,
  });

  const [subsidiaryFilter, setSubsidiaryFilter] = useState<string>('');

  // Vérifier les permissions
  const canManage = hasRole([UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR]);

  useEffect(() => {
    loadAccounts();
  }, [subsidiary.id, subsidiaryFilter]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const targetSubsidiaryId = isSuperAdmin
        ? (subsidiaryFilter || undefined)
        : subsidiary.id;
      const accountsData = await getTreasuryAccounts(targetSubsidiaryId);
      setAccounts(accountsData);
    } catch (error) {
      toast('error', t('treasuryAccounts.error.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setShowModal(true);
  };

  const handleEdit = (account: TreasuryAccount) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    
    // Si le compte a un solde non nul, demander une confirmation renforcée
    if (account && account.balance !== 0) {
      const confirmMessage = t('treasuryAccounts.confirm.deleteWithBalance', {
        accountName: account.accountName,
        balance: formatCurrency(account.balance, account.currency)
      });
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    } else {
      // Confirmation standard pour les comptes avec solde nul
      if (!window.confirm(t('treasuryAccounts.confirm.delete'))) {
        return;
      }
    }
    
    try {
      await deleteTreasuryAccount(id);
      setAccounts(accounts.filter(acc => acc.id !== id));
      toast('success', t('treasuryAccounts.success.deleted'));
    } catch (error: any) {
      // Gérer les erreurs spécifiques du backend
      if (error?.message?.includes('non-zero balance')) {
        // Offrir une option pour forcer la suppression si le serveur n'est pas encore mis à jour
        const forceConfirm = window.confirm(
          t('treasuryAccounts.confirm.forceDelete', { 
            accountName: account?.accountName || 'Ce compte',
            balance: formatCurrency(account?.balance || 0, account?.currency || 'XOF')
          })
        );
        
        if (forceConfirm) {
          try {
            // Tenter de supprimer directement via l'API sans la restriction
            await deleteTreasuryAccount(id);
            setAccounts(accounts.filter(acc => acc.id !== id));
            toast('success', t('treasuryAccounts.success.deleted'));
          } catch (forceError: any) {
            toast('error', t('treasuryAccounts.error.forceDeleteFailed'));
          }
        }
      } else if (error?.message?.includes('existing transactions')) {
        toast('error', t('treasuryAccounts.error.deleteWithTransactions'));
      } else {
        toast('error', t('treasuryAccounts.error.delete'));
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAccount(null);
    setSelectedAccount(null);
  };

  const handleAccountSaved = async (accountData: TreasuryAccount) => {
    try {
      if (editingAccount) {
        // Mise à jour (le solde et le type ne sont jamais modifiables après création)
        const updateData: TreasuryAccountUpdateData = {
          accountName: accountData.accountName,
          cashierId: accountData.cashierId,
          accountCode: accountData.accountCode,
          accountNumber: accountData.accountNumber,
        };
        const updatedAccount = await updateTreasuryAccount(editingAccount.id, updateData);
        setAccounts(accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
        
        // Si c'est un compte de préfinancement, invalider le cache de l'API préfinancement
        if (accountData.accountType === 'COMPTE_PREFINANCEMENT' || updateData.accountType === 'COMPTE_PREFINANCEMENT') {
          queryClient.invalidateQueries({ queryKey: ['prefinancementAccount', subsidiary.id] });
          queryClient.invalidateQueries({ queryKey: ['prefinancementTransactions', subsidiary.id] });
          queryClient.invalidateQueries({ queryKey: ['prefinancementStatistics', subsidiary.id] });
        }
        
        toast('success', t('treasuryAccounts.success.updated'));
      } else {
        // Création
        const createData: TreasuryAccountCreationData = {
          accountName: accountData.accountName,
          initialBalance: accountData.balance,
          currency: accountData.currency,
          accountType: accountData.accountType,
          cashierId: accountData.cashierId,
          accountCode: accountData.accountCode,
          accountNumber: accountData.accountNumber,
          bankId: accountData.bankId,
          subsidiaryId: accountData.subsidiaryId,
        };
        const newAccount = await createTreasuryAccount(createData);
        // Un compte Banque est toujours rattaché au siège côté backend : s'il
        // a été créé depuis la vue d'une autre filiale, il n'appartient pas à
        // la liste actuellement affichée — recharger plutôt que d'ajouter
        // localement, pour ne pas afficher un compte qui n'est pas vraiment
        // dans cette filiale. Idem si l'ADMIN/SUPER_ADMIN a choisi une autre
        // filiale que celle affichée.
        if (newAccount.subsidiaryId === subsidiary.id) {
          setAccounts([...accounts, newAccount]);
        } else {
          await loadAccounts();
        }

        // Si c'est un compte de préfinancement, invalider le cache de l'API préfinancement
        if (accountData.accountType === 'COMPTE_PREFINANCEMENT') {
          queryClient.invalidateQueries({ queryKey: ['prefinancementAccount', subsidiary.id] });
          queryClient.invalidateQueries({ queryKey: ['prefinancementTransactions', subsidiary.id] });
          queryClient.invalidateQueries({ queryKey: ['prefinancementStatistics', subsidiary.id] });
        }

        toast(
          'success',
          newAccount.subsidiaryId === subsidiary.id
            ? t('treasuryAccounts.success.created')
            : t('treasuryAccounts.success.createdElsewhere'),
        );
      }
      handleModalClose();
    } catch (error) {
      // L'erreur est déjà gérée dans les fonctions API, mais on peut ajouter un traitement supplémentaire si nécessaire
      console.error('Error saving account:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'XOF' ? 'XOF' : 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!canManage) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            {t('common.accessDenied')}
          </h3>
          <p className="text-yellow-700">
            {t('treasuryAccounts.accessDenied')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('treasuryAccounts.title')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('treasuryAccounts.description')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isSuperAdmin && (
            <select
              value={subsidiaryFilter}
              onChange={(e) => setSubsidiaryFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            >
              <option value="">Toutes les filiales</option>
              {subsidiaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subsidiaryName}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{t('treasuryAccounts.actions.create')}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">{t('treasuryAccounts.stats.totalAccounts')}</h3>
          <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">{t('treasuryAccounts.stats.totalBalance')}</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(
              accounts.reduce((sum, acc) => sum + acc.balance, 0),
              accounts[0]?.currency || 'XOF'
            )}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">{t('treasuryAccounts.stats.averageBalance')}</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(
              accounts.length > 0 ? accounts.reduce((sum, acc) => sum + acc.balance, 0) / accounts.length : 0,
              accounts[0]?.currency || 'XOF'
            )}
          </p>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('treasuryAccounts.table.accountName')}
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filiale
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('treasuryAccounts.table.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('treasuryAccounts.table.balance')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('treasuryAccounts.table.currency')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('treasuryAccounts.table.accountCode')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('treasuryAccounts.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.accountName}
                    {account.accountType === 'BANQUE' && account.bank && (
                      <span className="block text-xs font-normal text-slate-400">{account.bank.name}</span>
                    )}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-600">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {account.subsidiary?.subsidiaryName || 'Siège / Global'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {t(`treasuryAccounts.accountTypes.${account.accountType}`)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.balance, account.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                    {account.accountCode ? (
                      <span className="bg-slate-100 px-2 py-1 rounded">{account.accountCode}</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                        title={t('treasuryAccounts.actions.edit')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        title={t('treasuryAccounts.actions.delete')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!loading && accounts.length === 0 && (
          <EmptyState icon="finance" title={t('treasuryAccounts.noData')} />
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <TreasuryAccountFormModal
          account={editingAccount}
          subsidiary={subsidiary}
          onClose={handleModalClose}
          onSave={handleAccountSaved}
        />
      )}
    </div>
  );
};

export default TreasuryAccountManagement;
