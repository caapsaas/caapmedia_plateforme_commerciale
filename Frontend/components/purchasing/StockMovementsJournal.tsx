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

// Rôles autorisés à créer un mouvement manuel (miroir de MANAGE_ROLES côté
// backend, stock-movements.controller.ts) — juste pour masquer le bouton,
// l'autorisation réelle reste appliquée côté serveur.
const MANUAL_MOVEMENT_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PURCHASING_MANAGER];

// Journal des mouvements de stock (Chantier 3) — historique consultable de
// toutes les entrées/sorties, en unité de base.
const StockMovementsJournal: React.FC = () => {
    const { t } = useI18n();
    const { hasRole } = useHasRole();
    const [typeFilter, setTypeFilter] = useState<StockMovementType | ''>('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: movements = [], isLoading } = useQuery({
        queryKey: ['stock-movements', typeFilter],
        queryFn: () => getStockMovements(typeFilter ? { type: typeFilter } : undefined),
    });

    if (isLoading) return <div>{t('common.loading')}</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h3 className="text-xl font-semibold text-slate-800">{t('stockMovements.title')}</h3>
                <div className="flex items-center gap-3">
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as StockMovementType | '')} className="border-slate-300 rounded-md shadow-sm py-2 px-3 border text-sm">
                        <option value="">{t('stockMovements.allTypes')}</option>
                        {Object.values(StockMovementType).map(type => (
                            <option key={type} value={type}>{t(`stockMovements.types.${type}`)}</option>
                        ))}
                    </select>
                    {hasRole(MANUAL_MOVEMENT_ROLES) && (
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                            <IconPlus className="h-4 w-4" />
                            <span>{t('stockMovements.manual.newMovement')}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('stockMovements.date')}</th>
                            <th scope="col" className="px-6 py-3">{t('stockMovements.product')}</th>
                            <th scope="col" className="px-6 py-3">{t('stockMovements.type')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('stockMovements.direction')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('stockMovements.quantity')}</th>
                            <th scope="col" className="px-6 py-3">{t('stockMovements.reason')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.map(movement => {
                            const isIn = IN_TYPES.has(movement.type);
                            return (
                                <tr key={movement.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(movement.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-semibold">{movement.item?.name ?? movement.itemId}</td>
                                    <td className="px-6 py-4">{t(`stockMovements.types.${movement.type}`)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {isIn ? t('stockMovements.in') : t('stockMovements.out')}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${isIn ? 'text-green-600' : 'text-red-600'}`}>
                                        {isIn ? '+' : '-'}{movement.quantity}
                                    </td>
                                    <td className="px-6 py-4">{movement.reason || '-'}</td>
                                </tr>
                            );
                        })}
                        {movements.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-400 italic">{t('stockMovements.empty')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ManualStockMovementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default StockMovementsJournal;
