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
exports.SecretariatController = void 0;
const meeting_reports_service_1 = require("./meeting-reports.service");
const document_storage_1 = require("../common/utils/document-storage");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const secretariat_service_1 = require("./secretariat.service");
const jwt_guard_1 = require("../../src/common/auth/jwt/jwt.guard");
const role_guard_1 = require("../common/auth/role/role.guard");
const subsidiary_guard_1 = require("../common/auth/subsidiary/subsidiary.guard");
const role_decorator_1 = require("../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const create_company_document_dto_1 = require("./dto/create-company-document.dto");
const update_company_document_dto_1 = require("./dto/update-company-document.dto");
const search_company_documents_dto_1 = require("./dto/search-company-documents.dto");
const pagination_query_dto_1 = require("../common/pagination/dto/pagination-query.dto");
const meeting_dto_1 = require("./dto/meeting.dto");
const task_dto_1 = require("./dto/task.dto");
const subsidiary_scope_1 = require("../common/utils/subsidiary-scope");
let SecretariatController = class SecretariatController {
    secretariatService;
    meetingReports;
    constructor(secretariatService, meetingReports) {
        this.secretariatService = secretariatService;
        this.meetingReports = meetingReports;
    }
    async createCompanyDocument(files, dto, req) {
        const file = files?.file?.[0];
        if (!file) {
            throw new common_1.BadRequestException('Un fichier est requis pour créer le document');
        }
        return this.secretariatService.createCompanyDocument(dto, req.user, file);
    }
    async updateCompanyDocument(id, dto, req, file) {
        return this.secretariatService.updateCompanyDocument(id, dto, req.user, file);
    }
    async deleteCompanyDocument(id, req) {
        return this.secretariatService.deleteCompanyDocument(id, req.user);
    }
    async archiveCompanyDocument(id, req) {
        return this.secretariatService.archiveCompanyDocument(id, req.user);
    }
    async getAllCompanyDocuments(req, paginationQuery) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        return this.secretariatService.getAllCompanyDocuments(ctx, paginationQuery);
    }
    async searchCompanyDocuments(query, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        return this.secretariatService.searchCompanyDocuments(query, ctx);
    }
    async createMeeting(dto, req) {
        return this.secretariatService.createMeeting(dto, req.user);
    }
    async updateMeeting(id, dto, req) {
        return this.secretariatService.updateMeeting(id, dto, req.user);
    }
    async deleteMeeting(id, req) {
        return this.secretariatService.deleteMeeting(id, req.user);
    }
    async getAllMeetings(req, paginationQuery) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        return this.secretariatService.getAllMeetings(ctx, paginationQuery);
    }
    async searchMeetings(query, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        return this.secretariatService.searchMeetings(query, ctx);
    }
    async completeMeeting(id, req) {
        return this.meetingReports.complete(id, req.user);
    }
    async uploadMeetingReport(id, file, req) {
        return this.meetingReports.upload(id, file, req.user);
    }
    async addParticipantToMeeting(id, employeeId, req) {
        return this.secretariatService.addParticipantToMeeting(id, employeeId, req.user);
    }
    async removeParticipantFromMeeting(id, employeeId, req) {
        return this.secretariatService.removeParticipantFromMeeting(id, employeeId, req.user);
    }
    async createSecretariatTask(dto, req) {
        return this.secretariatService.createSecretariatTask(dto, req.user);
    }
    async updateSecretariatTask(id, dto, req) {
        return this.secretariatService.updateSecretariatTask(id, dto, req.user);
    }
    async deleteSecretariatTask(id, req) {
        return this.secretariatService.deleteSecretariatTask(id, req.user);
    }
    async getAllSecretariatTasks(req, paginationQuery) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        return this.secretariatService.getAllSecretariatTasks(ctx, paginationQuery);
    }
    async searchSecretariatTasks(query, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        return this.secretariatService.searchSecretariatTasks(query, ctx);
    }
};
exports.SecretariatController = SecretariatController;
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Post)('documents'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([{ name: 'file', maxCount: 1 }], {
        storage: (0, multer_1.diskStorage)({
            destination: document_storage_1.secretariatDestination,
            filename: (_req, file, cb) => {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (_req, file, cb) => {
            if (!file.originalname.match(/\.(pdf|doc|docx|xlsx|xls|jpg|png|txt)$/)) {
                return cb(new common_1.BadRequestException('Seuls les fichiers PDF, DOC, DOCX, XLSX, XLS, JPG, PNG, TXT sont autorisés.'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_company_document_dto_1.CreateCompanyDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "createCompanyDocument", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Patch)('documents/:id'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: document_storage_1.secretariatDestination,
            filename: (_req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (_req, file, cb) => {
            if (!file.originalname.match(/\.(pdf|doc|docx|xlsx|xls|jpg|png|txt)$/)) {
                return cb(new common_1.BadRequestException('Seuls PDF, DOC, DOCX, JPG, PNG, TXT autorisés'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_company_document_dto_1.UpdateCompanyDocumentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "updateCompanyDocument", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Delete)('documents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "deleteCompanyDocument", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Patch)('documents/:id/archive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "archiveCompanyDocument", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Get)('documents'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "getAllCompanyDocuments", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Get)('documents/search'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_company_documents_dto_1.SearchCompanyDocumentsDto, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "searchCompanyDocuments", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Post)('meetings'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meeting_dto_1.CreateMeetingDto, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "createMeeting", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Patch)('meetings/:id'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, meeting_dto_1.UpdateMeetingDto, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "updateMeeting", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Delete)('meetings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "deleteMeeting", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Get)('meetings'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "getAllMeetings", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Get)('meetings/search'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meeting_dto_1.SearchMeetingsDto, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "searchMeetings", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Post)('meetings/:id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "completeMeeting", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Post)('meetings/:id/report'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: {
            fileSize: meeting_reports_service_1.MEETING_REPORT_MAX_SIZE,
            files: 1,
            fields: 0,
            parts: 2,
        },
        fileFilter: (_req, file, callback) => {
            const mime = meeting_reports_service_1.MEETING_REPORT_TYPES[(0, path_1.extname)(file.originalname).toLowerCase()];
            if (!mime || mime !== file.mimetype) {
                return callback(new common_1.BadRequestException('Formats autorisés : PDF, DOC et DOCX.'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "uploadMeetingReport", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Post)('meetings/:id/participants/:employeeId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "addParticipantToMeeting", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Delete)('meetings/:id/participants/:employeeId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "removeParticipantFromMeeting", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Post)('tasks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [task_dto_1.CreateSecretariatTaskDto, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "createSecretariatTask", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Patch)('tasks/:id'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.UpdateSecretariatTaskDto, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "updateSecretariatTask", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Delete)('tasks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "deleteSecretariatTask", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Get)('tasks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "getAllSecretariatTasks", null);
__decorate([
    (0, role_decorator_1.Roles)(client_1.UserRole.SECRETARY, client_1.UserRole.ADMIN),
    (0, common_1.Get)('tasks/search'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [task_dto_1.SearchSecretariatTasksDto, Object]),
    __metadata("design:returntype", Promise)
], SecretariatController.prototype, "searchSecretariatTasks", null);
exports.SecretariatController = SecretariatController = __decorate([
    (0, common_1.Controller)('secretariat'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard, subsidiary_guard_1.SubsidiaryGuard),
    __metadata("design:paramtypes", [secretariat_service_1.SecretariatService,
        meeting_reports_service_1.MeetingReportsService])
], SecretariatController);
//# sourceMappingURL=secretariat.controller.js.map