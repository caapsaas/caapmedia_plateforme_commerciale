"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateDocumentsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const private_documents_controller_1 = require("./private-documents.controller");
const private_documents_service_1 = require("./private-documents.service");
let PrivateDocumentsModule = class PrivateDocumentsModule {
};
exports.PrivateDocumentsModule = PrivateDocumentsModule;
exports.PrivateDocumentsModule = PrivateDocumentsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [private_documents_controller_1.PrivateDocumentsController],
        providers: [private_documents_service_1.PrivateDocumentsService],
        exports: [private_documents_service_1.PrivateDocumentsService],
    })
], PrivateDocumentsModule);
//# sourceMappingURL=private-documents.module.js.map