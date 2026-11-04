"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_HINT_COOKIE = exports.CSRF_HEADER = exports.CSRF_TOKEN_COOKIE = exports.REFRESH_TOKEN_COOKIE = exports.ACCESS_TOKEN_COOKIE = void 0;
exports.setAuthCookies = setAuthCookies;
exports.setSessionHintCookie = setSessionHintCookie;
exports.clearAuthCookies = clearAuthCookies;
exports.setCsrfCookie = setCsrfCookie;
const crypto_1 = require("crypto");
exports.ACCESS_TOKEN_COOKIE = 'access_token';
exports.REFRESH_TOKEN_COOKIE = 'refresh_token';
exports.CSRF_TOKEN_COOKIE = 'csrf_token';
exports.CSRF_HEADER = 'x-csrf-token';
exports.SESSION_HINT_COOKIE = 'session_expires_at';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const AUTH_ROUTES_PATH = '/api-caapmedia/auth';
function baseCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
    };
}
function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie(exports.ACCESS_TOKEN_COOKIE, accessToken, {
        ...baseCookieOptions(),
        maxAge: ACCESS_TOKEN_MAX_AGE_MS,
        path: '/',
    });
    res.cookie(exports.REFRESH_TOKEN_COOKIE, refreshToken, {
        ...baseCookieOptions(),
        maxAge: REFRESH_TOKEN_MAX_AGE_MS,
        path: AUTH_ROUTES_PATH,
    });
    setSessionHintCookie(res);
}
function setSessionHintCookie(res) {
    res.cookie(exports.SESSION_HINT_COOKIE, String(Date.now() + ACCESS_TOKEN_MAX_AGE_MS), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_MAX_AGE_MS,
        path: '/',
    });
}
function clearAuthCookies(res) {
    res.clearCookie(exports.ACCESS_TOKEN_COOKIE, { ...baseCookieOptions(), path: '/' });
    res.clearCookie(exports.REFRESH_TOKEN_COOKIE, {
        ...baseCookieOptions(),
        path: AUTH_ROUTES_PATH,
    });
    res.clearCookie(exports.CSRF_TOKEN_COOKIE, {
        secure: baseCookieOptions().secure,
        sameSite: 'strict',
        path: '/',
    });
    res.clearCookie(exports.SESSION_HINT_COOKIE, {
        httpOnly: false,
        secure: baseCookieOptions().secure,
        sameSite: 'strict',
        path: '/',
    });
}
function setCsrfCookie(res) {
    res.cookie(exports.CSRF_TOKEN_COOKIE, (0, crypto_1.randomBytes)(32).toString('hex'), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ACCESS_TOKEN_MAX_AGE_MS,
        path: '/',
    });
}
//# sourceMappingURL=cookie.util.js.map