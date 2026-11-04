import { UserRole } from '@prisma/client';
import { RoleIdentity } from '../auth/role/role-identity';
export interface ScopableUser extends RoleIdentity {
    subsidiaryId: string;
}
export interface SubsidiaryScopeContext {
    subsidiaryId: string;
    hasGlobalScope: boolean;
}
export declare function resolveScopeContext(user: ScopableUser, extraGlobalRoles?: UserRole[]): SubsidiaryScopeContext;
export declare function withSubsidiaryScope<T extends Record<string, unknown>>(where: T, ctx: SubsidiaryScopeContext, requestedSubsidiaryId?: string): T & {
    subsidiaryId?: string;
};
export declare function resolveEffectiveSubsidiaryId(ctx: SubsidiaryScopeContext, requestedSubsidiaryId?: string): string | undefined;
export declare function assertSubsidiaryAccess(entitySubsidiaryId: string, ctx: SubsidiaryScopeContext): void;
