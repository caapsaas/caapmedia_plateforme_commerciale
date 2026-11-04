"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProformaShareController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const proforma_delivery_service_1 = require("./proforma-delivery.service");
const proforma_pdf_service_1 = require("./proforma-pdf.service");
let ProformaShareController = class ProformaShareController {
    delivery;
    constructor(delivery) {
        this.delivery = delivery;
    }
    async download(token, response) {
        const { quote, buffer } = await this.delivery.sharedDocument(token);
        response.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${(0, proforma_pdf_service_1.proformaFilename)(quote.proformaNumber)}"`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
            'X-Robots-Tag': 'noindex, nofollow, noarchive',
            'Referrer-Policy': 'no-referrer',
        });
        response.send(buffer);
    }
};
exports.ProformaShareController = ProformaShareController;
__decorate([
    (0, common_1.Get)(':token'),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProformaShareController.prototype, "download", null);
exports.ProformaShareController = ProformaShareController = __decorate([
    (0, common_1.Controller)('proforma-share'),
    __metadata("design:paramtypes", [proforma_delivery_service_1.ProformaDeliveryService])
], ProformaShareController);
//# sourceMappingURL=proforma-share.controller.js.map