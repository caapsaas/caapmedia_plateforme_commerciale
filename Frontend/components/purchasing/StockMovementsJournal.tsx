import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StockMovementType, UserRole } from '../../types/models';
import { getStockMovements } from '../../services/apiPurchasing/apiStockMovements';
import { useI18n } from '../../i18n';
import { useHasRole } from '../../hooks/useHasRole';
import IconPlus from '../icons/IconPlus';
import ManualStockMovementModal from './ManualStockMovementModal';

const IN_TYPES = new Set<StockMovementType>([
    StockMovementType.PURCHASE_RECEIPT,
    StockMovementType.CUSTOMER_RETURN,
    StockMovementType.POSITIVE_ADJUSTMENT,
    StockMovementType.TRANSFER_IN,
]);

const MANUAL_MOVEMENT_ROLES = [UserRole.ADMIN, UserRole.PURCHASING_MANAGER];

interface StockMovementsJournalProps {
    subsidiaryId?: string;
}

const StockMovementsJournal: React.FC<StockMovementsJournalProps> = ({ subsidiaryId }) => {
    const { t } = useI18n();
    const { hasRole } = useHasRole();
    const [typeFilter, setTypeFilter] = useState<StockMovementType | ''>('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: movements = [], isLoading } = useQuery({
        queryKey: ['stock-movements', typeFilter, subsidiaryId],
        queryFn: () => getStockMovements({
            ...(typeFilter ? { type: typeFilter } : {}),
            ...(subsidiaryId ? { subsidiaryId } : {}),
        }),
    });

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
                <h3 className="text-base font-semibold text-slate-800">{t('stockMovements.title')}</h3>
                <div className="flex items-center gap-3">
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value as StockMovementType | '')}
                        className="border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    >
                        <option value="">{t('stockMovements.allTypes')}</option>
                        {Object.values(StockMovementType).map(type => (
                            <option key={type} value={type}>{t(`stockMovements.types.${type}`)}</option>
                        ))}
                    </select>
                    {hasRole(MANUAL_MOVEMENT_ROLES) && (
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-bold rounded-lg hover:bg-[#adc40f] transition-colors">
                            <IconPlus className="h-4 w-4" />
                            <span>{t('stockMovements.manual.newMovement')}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200">
                        <tr>
                            <th className="px-5 py-3 text-left font-semibold">{t('stockMovements.date')}</th>
                            <th className="px-5 py-3 text-left font-semibold">{t('stockMovements.product')}</th>
                            <th className="px-5 py-3 text-left font-semibold">{t('stockMovements.type')}</th>
                            <th className="px-5 py-3 text-center font-semibold">{t('stockMovements.direction')}</th>
                            <th className="px-5 py-3 text-right font-semibold">{t('stockMovements.quantity')}</th>
                            <th className="px-5 py-3 text-left font-semibold">{t('stockMovements.reason')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={6} className="px-5 py-3">
                                        <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + i * 7}%`, opacity: 1 - i * 0.15 }} />
                                    </td>
                                </tr>
                            ))
                        ) : movements.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-16 text-center">
                                    <svg className="w-10 h-10 mx-auto mb-2 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    <p className="text-sm font-medium text-slate-500">{t('stockMovements.empty')}</p>
                                    {typeFilter && <p className="text-xs text-slate-400 mt-1">Essayez de supprimer le filtre.</p>}
                                </td>
                            </tr>
                        ) : movements.map(movement => {
                            const isIn = IN_TYPES.has(movement.type);
                            return (
                                <tr key={movement.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap text-xs">
                                        {new Date(movement.createdAt).toLocaleString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-800">{movement.item?.name ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500 text-xs">{t(`stockMovements.types.${movement.type}`)}</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {isIn ? t('stockMovements.in') : t('stockMovements.out')}
                                        </span>
                                    </td>
                                    <td className={`px-5 py-3 text-right font-bold ${isIn ? 'text-green-600' : 'text-red-600'}`}>
                                        {isIn ? '+' : '−'}{movement.quantity}
                                    </td>
                                    <td className="px-5 py-3 text-slate-400 text-xs">{movement.reason || '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ManualStockMovementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default StockMovementsJournal;
