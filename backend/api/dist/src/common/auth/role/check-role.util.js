"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = checkRole;
const common_1 = require("@nestjs/common");
const role_identity_1 = require("./role-identity");
function checkRole(user, allowedRoles, message) {
    if ((0, role_identity_1.isSuperAdmin)(user))
        return;
    const activeRole = (0, role_identity_1.getActiveRole)(user);
    if (!allowedRoles.includes(activeRole)) {
        throw new common_1.ForbiddenException(message);
    }
}
//# sourceMappingURL=check-role.util.js.map