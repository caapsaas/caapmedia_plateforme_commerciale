"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProformasModule = void 0;
const notifications_module_1 = require("../../notifications/notifications.module");
const common_1 = require("@nestjs/common");
const proformas_service_1 = require("./proformas.service");
const proformas_controller_1 = require("./proformas.controller");
const proforma_pdf_service_1 = require("./proforma-pdf.service");
const proforma_mailer_service_1 = require("./proforma-mailer.service");
const proforma_delivery_service_1 = require("./proforma-delivery.service");
const proforma_share_controller_1 = require("./proforma-share.controller");
let ProformasModule = class ProformasModule {
};
exports.ProformasModule = ProformasModule;
exports.ProformasModule = ProformasModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        controllers: [proformas_controller_1.ProformasController, proforma_share_controller_1.ProformaShareController],
        providers: [
            proformas_service_1.ProformasService,
            proforma_pdf_service_1.ProformaPdfService,
            proforma_mailer_service_1.ProformaMailerService,
            proforma_delivery_service_1.ProformaDeliveryService,
        ],
        exports: [proformas_service_1.ProformasService],
    })
], ProformasModule);
//# sourceMappingURL=proformas.module.js.map