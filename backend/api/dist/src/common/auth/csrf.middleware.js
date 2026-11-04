"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfMiddleware = csrfMiddleware;
const cookie_util_1 = require("./cookie.util");
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
function csrfMiddleware(req, res, next) {
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }
    const hasSessionCookie = Boolean(req.cookies?.[cookie_util_1.ACCESS_TOKEN_COOKIE]);
    if (!hasSessionCookie) {
        return next();
    }
    const cookieToken = req.cookies?.[cookie_util_1.CSRF_TOKEN_COOKIE];
    const headerToken = req.headers[cookie_util_1.CSRF_HEADER];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        res.status(403).json({
            message: 'CSRF token invalide ou manquant',
            error: 'Forbidden',
            statusCode: 403,
        });
        return;
    }
    next();
}
//# sourceMappingURL=csrf.middleware.js.map