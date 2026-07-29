import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

/**
 * Droits d'écriture sur les référentiels comptables (plan comptable, mappings,
 * journaux, exercices, états financiers) : ADMIN ou FINANCIAL_DIRECTOR du
 * siège, ou SUPER_ADMIN (bypass total, même logique que `useHasRole` et
 * `useIsConsolidatedView` — le SUPER_ADMIN ne doit jamais se retrouver exclu
 * d'une UI qui ne le liste pas explicitement).
 */
export const useCanModifyAccounting = (): boolean => {
  const { user, subsidiary } = useAuth();
  if (!user) return false;
  const allRoles = [user.userRole, ...(user.additionalRoles ?? [])];
  if (allRoles.includes(UserRole.SUPER_ADMIN)) return true;
  const activeRole = user.activeRole ?? user.userRole;
  return !!subsidiary?.isHeadquarter && (activeRole === UserRole.ADMIN || activeRole === UserRole.FINANCIAL_DIRECTOR);
};
