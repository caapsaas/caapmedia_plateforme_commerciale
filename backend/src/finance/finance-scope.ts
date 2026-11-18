import { UserRole } from '@prisma/client';
import { getActiveRole } from '../common/auth/role/role-identity';
import type { JwtUser } from '../common/auth/jwt/jwt-user.interface';
import {
  resolveEffectiveSubsidiaryId,
  resolveScopeContext,
} from '../common/utils/subsidiary-scope';

export function financeSubsidiaryId(user: JwtUser, requestedId?: string) {
  const scope = resolveScopeContext(user);
  return resolveEffectiveSubsidiaryId(
    { ...scope, hasGlobalScope: getActiveRole(user) === UserRole.SUPER_ADMIN },
    requestedId,
  );
}
