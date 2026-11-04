"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveRole = getActiveRole;
exports.isSuperAdmin = isSuperAdmin;
const client_1 = require("@prisma/client");
function getActiveRole(user) {
    return user.activeRole ?? user.role ?? user.userRole;
}
function isSuperAdmin(user) {
    const roles = user.roles?.length ? user.roles : [user.role ?? user.userRole];
    return roles.includes(client_1.UserRole.SUPER_ADMIN);
}
//# sourceMappingURL=role-identity.js.map