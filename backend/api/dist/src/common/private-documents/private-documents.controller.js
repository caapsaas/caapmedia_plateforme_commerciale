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
exports.PrivateDocumentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt/jwt.guard");
const private_documents_service_1 = require("./private-documents.service");
let PrivateDocumentsController = class PrivateDocumentsController {
    documents;
    constructor(documents) {
        this.documents = documents;
    }
    async download(params, req, res) {
        const path = await this.documents.resolveFile(params.category, params.filename, params.subsidiaryId, req.user);
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        await new Promise((resolve, reject) => {
            res.download(path, params.filename, (error) => error ? reject(error) : resolve());
        });
    }
};
exports.PrivateDocumentsController = PrivateDocumentsController;
__decorate([
    (0, common_1.Get)([':category/:filename', ':category/:subsidiaryId/:filename']),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PrivateDocumentsController.prototype, "download", null);
exports.PrivateDocumentsController = PrivateDocumentsController = __decorate([
    (0, common_1.Controller)('private-documents'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [private_documents_service_1.PrivateDocumentsService])
], PrivateDocumentsController);
//# sourceMappingURL=private-documents.controller.js.map