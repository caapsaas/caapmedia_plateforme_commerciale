import React, { useState, useEffect } from 'react';
import { TreasuryAccount, Subsidiary } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import TreasuryAccountFormModal from './TreasuryAccountFormModal';
import { getTreasuryAccounts, createTreasuryAccount, updateTreasuryAccount, deleteTreasuryAccount, CreateTreasuryAccountData, UpdateTreasuryAccountData } from '../../services/apiFinance/apiTreasuryAccounts';

interface TreasuryAccountManagementProps {
  subsidiary: Subsidiary;
}

const TreasuryAccountManagement: React.FC<TreasuryAccountManagementProps> = ({ subsidiary }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<TreasuryAccount | null>(null);
  const [editingAccount, setEditingAccount] = useState<TreasuryAccount | null>(null);

  // Vérifier les permissions
  const canManage = user?.userRole === 'ADMIN' || user?.userRole === 'FINANCIAL_DIRECTOR';

  useEffect(() => {
    loadAccounts();
  }, [subsidiary.id]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await getTreasuryAccounts(subsidiary.id);
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
        // Mise à jour
        const updateData: UpdateTreasuryAccountData = {
          accountName: accountData.accountName
        };
        const updatedAccount = await updateTreasuryAccount(editingAccount.id, updateData);
        setAccounts(accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
        toast('success', t('treasuryAccounts.success.updated'));
      } else {
        // Création
        const createData: CreateTreasuryAccountData = {
          accountName: accountData.accountName,
          initialBalance: accountData.balance,
          currency: accountData.currency
        };
        const newAccount = await createTreasuryAccount(createData);
        setAccounts([...accounts, newAccount]);
        toast('success', t('treasuryAccounts.success.created'));
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

  if (loading) {
    return <div className="p-6 text-center">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('treasuryAccounts.title')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('treasuryAccounts.description')}
          </p>
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('treasuryAccounts.table.balance')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('treasuryAccounts.table.currency')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('treasuryAccounts.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.accountName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.balance, account.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.currency}
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
        
        {accounts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t('treasuryAccounts.noData')}
          </div>
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
