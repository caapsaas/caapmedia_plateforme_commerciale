"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordRedactionInterceptor = void 0;
exports.redactPasswordHashes = redactPasswordHashes;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
function redactPasswordHashes(value) {
    if (Array.isArray(value))
        return value.map(redactPasswordHashes);
    if (value &&
        typeof value === 'object' &&
        Object.getPrototypeOf(value) === Object.prototype) {
        return Object.fromEntries(Object.entries(value)
            .filter(([key]) => !['passwordHash', 'pinHash', 'pinCode'].includes(key))
            .map(([key, field]) => [key, redactPasswordHashes(field)]));
    }
    return value;
}
let PasswordRedactionInterceptor = class PasswordRedactionInterceptor {
    intercept(_context, next) {
        return next.handle().pipe((0, operators_1.map)(redactPasswordHashes));
    }
};
exports.PasswordRedactionInterceptor = PasswordRedactionInterceptor;
exports.PasswordRedactionInterceptor = PasswordRedactionInterceptor = __decorate([
    (0, common_1.Injectable)()
], PasswordRedactionInterceptor);
//# sourceMappingURL=password-redaction.interceptor.js.map