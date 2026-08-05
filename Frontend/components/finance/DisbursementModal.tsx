import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TreasuryAccount,
  AccountType,
  TreasuryTransactionType,
  CounterpartyType,
} from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import {
  getTreasuryAccounts,
  getCounterparties,
  createDisbursement,
  CreateDisbursementData,
} from '../../services/apiFinance/apiTreasury';

interface DisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  subsidiaryId: string;
  // Restreint les comptes source proposés à un seul type (ex. depuis l'onglet
  // Analytics "Coffre-fort") ; sinon tous les types éligibles sont proposés.
  sourceAccountType?: AccountType;
}

// Types éligibles comme source d'un décaissement (le préfinancement n'en fait
// pas partie — géré par son propre module).
const DISBURSABLE_ACCOUNT_TYPES: AccountType[] = [
  AccountType.SAFE,
  AccountType.BANQUE,
  AccountType.EXPENSE_BOX,
  AccountType.CAISSE,
  AccountType.CASH_REGISTER,
];

const TRANSFER_TYPES = [
  TreasuryTransactionType.BANK_WITHDRAWAL,
  TreasuryTransactionType.CASH_REFILL,
];

// Type de tiers attendu selon la nature du mouvement (pour filtrer la liste
// des contreparties existantes) — undefined = pas de tiers pertinent.
const COUNTERPARTY_TYPE_BY_TREASURY_TYPE: Partial<
  Record<TreasuryTransactionType, CounterpartyType>
> = {
  [TreasuryTransactionType.SUPPLIER_PAYMENT]: CounterpartyType.SUPPLIER,
  [TreasuryTransactionType.TAX_PAYMENT]: CounterpartyType.TAX_AUTHORITY,
};

const TREASURY_TYPE_LABELS: Record<TreasuryTransactionType, string> = {
  [TreasuryTransactionType.INFLOW]: 'Entrée diverse',
  [TreasuryTransactionType.OUTFLOW]: 'Sortie diverse',
  [TreasuryTransactionType.BANK_WITHDRAWAL]: 'Retrait vers la banque',
  [TreasuryTransactionType.CASH_REFILL]: 'Alimentation caisse dépense',
  [TreasuryTransactionType.SUPPLIER_PAYMENT]: 'Paiement fournisseur',
  [TreasuryTransactionType.SALARY_PAYMENT]: 'Paiement salaire',
  [TreasuryTransactionType.BONUS_PAYMENT]: 'Paiement prime',
  [TreasuryTransactionType.TAX_PAYMENT]: 'Paiement taxe/impôt',
  [TreasuryTransactionType.RENT]: 'Loyer',
  [TreasuryTransactionType.UTILITIES]: 'Charges (eau, électricité...)',
  [TreasuryTransactionType.MARKETING]: 'Marketing',
  [TreasuryTransactionType.SUPPLIES]: 'Fournitures',
  [TreasuryTransactionType.PURCHASE_COST]: "Coût d'achat",
  [TreasuryTransactionType.OTHER_EXPENSE]: 'Autre dépense',
};

const DisbursementModal: React.FC<DisbursementModalProps> = ({
  isOpen,
  onClose,
  subsidiaryId,
  sourceAccountType,
}) => {
  const { t, formatCurrency } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [treasuryType, setTreasuryType] = useState<TreasuryTransactionType>(
    TreasuryTransactionType.OTHER_EXPENSE,
  );
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [reference, setReference] = useState('');
  const [counterpartyId, setCounterpartyId] = useState('');
  const [newCounterpartyName, setNewCounterpartyName] = useState('');

  const resetForm = () => {
    setSourceAccountId('');
    setDestinationAccountId('');
    setTreasuryType(TreasuryTransactionType.OTHER_EXPENSE);
    setAmount(0);
    setDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setReference('');
    setCounterpartyId('');
    setNewCounterpartyName('');
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  const { data: accounts = [] } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', subsidiaryId],
    queryFn: () => getTreasuryAccounts(subsidiaryId),
    enabled: isOpen && !!subsidiaryId,
  });

  const sourceAccounts = useMemo(
    () =>
      accounts.filter((a) =>
        sourceAccountType
          ? a.accountType === sourceAccountType
          : DISBURSABLE_ACCOUNT_TYPES.includes(a.accountType),
      ),
    [accounts, sourceAccountType],
  );

  const isTransfer = TRANSFER_TYPES.includes(treasuryType);
  const relevantCounterpartyType = COUNTERPARTY_TYPE_BY_TREASURY_TYPE[treasuryType];

  // Comptes destination cohérents avec le virement demandé (banque pour un
  // retrait, caisse dépense pour une alimentation).
  const destinationAccounts = useMemo(() => {
    if (treasuryType === TreasuryTransactionType.BANK_WITHDRAWAL) {
      return accounts.filter((a) => a.accountType === AccountType.BANQUE);
    }
    if (treasuryType === TreasuryTransactionType.CASH_REFILL) {
      return accounts.filter((a) => a.accountType === AccountType.EXPENSE_BOX);
    }
    return [];
  }, [accounts, treasuryType]);

  const { data: counterparties = [] } = useQuery({
    queryKey: ['counterparties', relevantCounterpartyType],
    queryFn: () => getCounterparties(relevantCounterpartyType),
    enabled: isOpen && !isTransfer,
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (data: CreateDisbursementData) => createDisbursement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasuryAccounts', subsidiaryId] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions', subsidiaryId] });
      toast.success(t('treasury.transactionCreated'), t('treasury.transactionCreatedSuccess'));
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        t('treasury.transactionError'),
        error?.response?.data?.message || t('treasury.transactionErrorMessage'),
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccountId || amount <= 0 || !description) return;
    if (isTransfer && !destinationAccountId) return;

    submit({
      transactionDate,
      description,
      amount,
      sourceAccountId,
      destinationAccountId: isTransfer ? destinationAccountId : undefined,
      treasuryType,
      reference: reference || undefined,
      counterpartyId: counterpartyId || undefined,
      newCounterpartyName:
        !counterpartyId && newCounterpartyName ? newCounterpartyName : undefined,
      newCounterpartyType: relevantCounterpartyType,
    });
  };

  if (!isOpen) return null;

  const selectedSourceAccount = accounts.find((a) => a.id === sourceAccountId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800">Décaissement</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Compte source</label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                >
                  <option value="">-- Sélectionner --</option>
                  {sourceAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} - {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Nature du mouvement</label>
                <select
                  value={treasuryType}
                  onChange={(e) => {
                    setTreasuryType(e.target.value as TreasuryTransactionType);
                    setDestinationAccountId('');
                    setCounterpartyId('');
                  }}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                >
                  {Object.values(TreasuryTransactionType).map((type) => (
                    <option key={type} value={type}>
                      {TREASURY_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {isTransfer && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Compte destination</label>
                  <select
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  >
                    <option value="">-- Sélectionner --</option>
                    {destinationAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isTransfer && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Bénéficiaire / Tiers</label>
                  <select
                    value={counterpartyId}
                    onChange={(e) => setCounterpartyId(e.target.value)}
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  >
                    <option value="">-- Nouveau tiers --</option>
                    {counterparties.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.name}
                      </option>
                    ))}
                  </select>
                  {!counterpartyId && (
                    <input
                      type="text"
                      value={newCounterpartyName}
                      onChange={(e) => setNewCounterpartyName(e.target.value)}
                      placeholder="Nom du bénéficiaire"
                      className="mt-2 block w-full border-slate-300 rounded-md shadow-sm"
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Montant</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  />
                  {selectedSourceAccount && amount > selectedSourceAccount.balance && (
                    <p className="mt-1 text-xs text-red-600">
                      Solde insuffisant ({formatCurrency(selectedSourceAccount.balance)} disponible).
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Référence (optionnel)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="N° pièce, N° chèque..."
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] disabled:opacity-50"
            >
              {isPending ? '...' : 'Décaisser'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisbursementModal;
