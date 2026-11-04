"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveScopeContext = resolveScopeContext;
exports.withSubsidiaryScope = withSubsidiaryScope;
exports.resolveEffectiveSubsidiaryId = resolveEffectiveSubsidiaryId;
exports.assertSubsidiaryAccess = assertSubsidiaryAccess;
const common_1 = require("@nestjs/common");
const role_identity_1 = require("../auth/role/role-identity");
function requireSubsidiaryId(subsidiaryId) {
    if (!subsidiaryId?.trim()) {
        throw new common_1.ForbiddenException('Une filiale est requise pour cette opération.');
    }
}
function resolveScopeContext(user, extraGlobalRoles = []) {
    requireSubsidiaryId(user?.subsidiaryId);
    const activeRole = (0, role_identity_1.getActiveRole)(user);
    const hasGlobalScope = (0, role_identity_1.isSuperAdmin)(user) ||
        (activeRole !== undefined && extraGlobalRoles.includes(activeRole));
    return { subsidiaryId: user.subsidiaryId, hasGlobalScope };
}
function withSubsidiaryScope(where, ctx, requestedSubsidiaryId) {
    requireSubsidiaryId(ctx?.subsidiaryId);
    if (ctx.hasGlobalScope) {
        return requestedSubsidiaryId
            ? { ...where, subsidiaryId: requestedSubsidiaryId }
            : where;
    }
    return { ...where, subsidiaryId: ctx.subsidiaryId };
}
function resolveEffectiveSubsidiaryId(ctx, requestedSubsidiaryId) {
    requireSubsidiaryId(ctx?.subsidiaryId);
    if (ctx.hasGlobalScope) {
        return requestedSubsidiaryId || undefined;
    }
    return ctx.subsidiaryId;
}
function assertSubsidiaryAccess(entitySubsidiaryId, ctx) {
    requireSubsidiaryId(ctx?.subsidiaryId);
    if (!ctx.hasGlobalScope && entitySubsidiaryId !== ctx.subsidiaryId) {
        throw new common_1.ForbiddenException("Vous n'avez pas acces a cette ressource.");
    }
}
//# sourceMappingURL=subsidiary-scope.js.map