"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const common_1 = require("@nestjs/common");
const otplib_1 = require("otplib");
const crypto_1 = require("crypto");
const QRCode = __importStar(require("qrcode"));
const ISSUER = 'CaapMedia';
const RECOVERY_CODE_COUNT = 10;
let TwoFactorService = class TwoFactorService {
    generateSecret() {
        return (0, otplib_1.generateSecret)();
    }
    async generateQrCodeDataUrl(email, secret) {
        const uri = (0, otplib_1.generateURI)({ issuer: ISSUER, label: email, secret });
        return QRCode.toDataURL(uri);
    }
    async verifyToken(secret, token) {
        const result = await (0, otplib_1.verify)({ secret, token });
        return result.valid;
    }
    async generateToken(secret) {
        return (0, otplib_1.generate)({ secret });
    }
    generateRecoveryCodes(count = RECOVERY_CODE_COUNT) {
        return Array.from({ length: count }, () => (0, crypto_1.randomBytes)(5).toString('hex'));
    }
    hashRecoveryCode(code) {
        return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
    }
};
exports.TwoFactorService = TwoFactorService;
exports.TwoFactorService = TwoFactorService = __decorate([
    (0, common_1.Injectable)()
], TwoFactorService);
//# sourceMappingURL=two-factor.service.js.map