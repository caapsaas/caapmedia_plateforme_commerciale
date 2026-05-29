import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

/**
 * Retourne une fonction `hasRole` qui vérifie si l'utilisateur connecté possède
 * au moins un des rôles autorisés (rôle principal OU rôles supplémentaires).
 * Même logique OR que le backend `checkRole`.
 */
export const useHasRole = () => {
  const { user } = useAuth();

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    const allRoles = [user.userRole, ...(user.additionalRoles ?? [])];
    return allowedRoles.some(r => allRoles.includes(r));
  };

  return { hasRole };
};
