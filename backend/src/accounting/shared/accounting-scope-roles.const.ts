import { UserRole } from '@prisma/client';

/** Rôles autorisés à voir une vue consolidée (toutes filiales) sur les
 * données comptables — voir Doc/module-comptabilite-plan-implementation.md §2.11.
 * Partagé entre reports.service.ts et entries.service.ts pour ne pas diverger. */
export const ACCOUNTING_GLOBAL_SCOPE_ROLES = [UserRole.FINANCIAL_DIRECTOR];
