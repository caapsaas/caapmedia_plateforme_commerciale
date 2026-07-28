import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

/**
 * Détermine si l'utilisateur connecté a une vue consolidée (toutes filiales)
 * sur les données comptables/financières — ADMIN ou FINANCIAL_DIRECTOR du
 * siège uniquement. Même règle que `resolveScopeContext` côté backend
 * (`extraGlobalRoles: [UserRole.FINANCIAL_DIRECTOR]`, SUPER_ADMIN toujours
 * consolidé quel que soit son role actif).
 */
export const useIsConsolidatedView = (): boolean => {
  const { user, subsidiary } = useAuth();
  if (!user) return false;
  const activeRole = user.activeRole ?? user.userRole;
  const allRoles = [user.userRole, ...(user.additionalRoles ?? [])];
  if (allRoles.includes(UserRole.SUPER_ADMIN)) return true;
  const isGlobalRole = activeRole === UserRole.ADMIN || activeRole === UserRole.FINANCIAL_DIRECTOR;
  return !!subsidiary?.isHeadquarter && isGlobalRole;
};

interface SubsidiaryFilterProps {
  value: string;
  onChange: (subsidiaryId: string) => void;
  className?: string;
}

/**
 * Sélecteur de filiale pour le drill-down sur une vue consolidée.
 * Conditionnellement rendu — n'apparaît que pour un utilisateur ayant
 * effectivement une portée globale (voir `useIsConsolidatedView`), pas
 * seulement désactivé pour les autres.
 */
const SubsidiaryFilter: React.FC<SubsidiaryFilterProps> = ({ value, onChange, className }) => {
  const isConsolidatedView = useIsConsolidatedView();

  const { data: subsidiaries = [] } = useQuery({
    queryKey: ['subsidiaries-filter-list'],
    queryFn: getSubsidiaries,
    enabled: isConsolidatedView,
  });

  if (!isConsolidatedView) return null;

  return (
    <div className={className}>
      <label className="text-sm font-medium text-slate-700 mr-2">Filiale :</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
      >
        <option value="">Consolidé (toutes filiales)</option>
        {subsidiaries.map((s) => (
          <option key={s.id} value={s.id}>{s.subsidiaryName || s.name}</option>
        ))}
      </select>
    </div>
  );
};

export default SubsidiaryFilter;
