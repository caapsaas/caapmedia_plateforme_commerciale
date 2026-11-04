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
exports.EmployeeController = void 0;
const fs_1 = require("fs");
const private_documents_service_1 = require("../../common/private-documents/private-documents.service");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const employee_service_1 = require("./employee.service");
const add_leave_record_dto_1 = require("./dto/add-leave-record.dto");
const update_leave_balance_dto_1 = require("./dto/update-leave-balance.dto");
const employee_dto_1 = require("./dto/employee.dto");
const client_1 = require("@prisma/client");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const logger_service_1 = require("../../common/utils/logger/logger.service");
const file_upload_service_1 = require("../../common/utils/file-upload.service");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let EmployeeController = class EmployeeController {
    employeeService;
    logger;
    fileUploadService;
    privateDocuments;
    constructor(employeeService, logger, fileUploadService, privateDocuments) {
        this.employeeService = employeeService;
        this.logger = logger;
        this.fileUploadService = fileUploadService;
        this.privateDocuments = privateDocuments;
    }
    async create(createEmployeeDto, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, createEmployeeDto.subsidiaryId) ??
            ctx.subsidiaryId;
        this.logger.log(`Creating employee in subsidiary ${subsidiaryId}`);
        this.logger.log(`Received DTO: ${JSON.stringify(createEmployeeDto)}`);
        const dtoAsAny = createEmployeeDto;
        const employeeId = dtoAsAny.id;
        this.logger.log(`Extracted employeeId: ${employeeId}`);
        if (employeeId) {
            this.logger.log(`Redirecting to update for employee ${employeeId}`);
            const employee = await this.employeeService.findOne(employeeId, false);
            (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, ctx);
            return this.employeeService.update(employeeId, dtoAsAny);
        }
        return this.employeeService.create(createEmployeeDto, subsidiaryId);
    }
    async findAll(req, paginationQuery, includeRelations, subsidiaryIdFilter) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, subsidiaryIdFilter);
        this.logger.log(`Fetching employees for subsidiary ${subsidiaryId} (role: ${req.user.roles})`);
        const includeRel = includeRelations === 'true';
        return this.employeeService.findAll(subsidiaryId, includeRel, paginationQuery);
    }
    async findOne(id, req, includeRelations) {
        this.logger.log(`Fetching employee ${id}`);
        const includeRel = includeRelations === 'true';
        const employee = await this.employeeService.findOne(id, includeRel);
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, ctx);
        return employee;
    }
    async update(id, updateEmployeeDto, req) {
        this.logger.log(`Updating employee ${id}`);
        const employee = await this.employeeService.findOne(id, false);
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, ctx);
        return this.employeeService.update(id, updateEmployeeDto);
    }
    async remove(id, req) {
        this.logger.warn(`Deleting employee ${id}`);
        const employee = await this.employeeService.findOne(id, false);
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, ctx);
        return this.employeeService.remove(id);
    }
    async uploadDocumentsGeneric(files, req) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files provided');
        }
        const uploadedFiles = [];
        for (const file of files) {
            const { url } = await this.fileUploadService.uploadFile(file.buffer, file.originalname, {
                subfolder: 'employee-documents',
                privateSubsidiaryId: req.user.subsidiaryId,
            });
            uploadedFiles.push({
                fieldname: file.fieldname,
                url,
                originalname: file.originalname,
            });
        }
        return { uploadedFiles };
    }
    async deleteDocument(body, req) {
        if (!body.url) {
            throw new common_1.BadRequestException('Document URL is required');
        }
        const path = body.url
            .replace(/^\/public\/employee-documents\//, 'employee-documents/')
            .replace(/^\/api-caapmedia\/private-documents\//, '');
        const segments = path.split('/');
        if (segments[0] !== 'employee-documents' ||
            ![2, 3].includes(segments.length)) {
            throw new common_1.BadRequestException('Invalid document URL');
        }
        const filename = segments[segments.length - 1];
        const subsidiaryId = segments.length === 3 ? segments[1] : undefined;
        const resolved = await this.privateDocuments.resolveFile('employee-documents', filename, subsidiaryId, req.user);
        await fs_1.promises.unlink(resolved);
        return { success: true };
    }
    async uploadDocuments(id, files, req) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files provided');
        }
        const employee = await this.employeeService.findOne(id, false);
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, ctx);
        const uploadedFiles = [];
        for (const file of files) {
            const { url } = await this.fileUploadService.uploadFile(file.buffer, file.originalname, {
                subfolder: 'employee-documents',
                privateSubsidiaryId: employee.subsidiaryId,
            });
            uploadedFiles.push({
                fieldname: file.fieldname,
                url,
                originalname: file.originalname,
            });
        }
        return { uploadedFiles };
    }
    async addDocument(id, body, req) {
        const employee = await this.employeeService.findOne(id, false);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.employeeService.addDocument(id, body.documentName, body.url, body.docType);
    }
    async addTraining(id, body, req) {
        const employee = await this.employeeService.findOne(id, false);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.employeeService.addTraining(id, {
            ...body,
            trainingDate: new Date(body.trainingDate),
        });
    }
    async addPositionHistory(id, body, req) {
        const employee = await this.employeeService.findOne(id, false);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.employeeService.addPositionHistory(id, {
            ...body,
            startDate: new Date(body.startDate),
            endDate: body.endDate ? new Date(body.endDate) : undefined,
        });
    }
    async addPerformanceReview(id, body, req) {
        const employee = await this.employeeService.findOne(id, false);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.employeeService.addPerformanceReview(id, {
            ...body,
            reviewDate: new Date(body.reviewDate),
        });
    }
    async addLeaveRecord(id, body, req) {
        const employee = await this.employeeService.findOne(id, false);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.employeeService.addLeaveRecord(id, {
            ...body,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
        });
    }
    async getLeaveBalances(id, req) {
        const employee = await this.employeeService.findOne(id, false);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.employeeService.getLeaveBalances(id);
    }
    async updateLeaveBalance(id, leaveType, body, req) {
        const employee = await this.employeeService.findOne(id, false);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.employeeService.updateLeaveBalance(id, leaveType, body.days, body.operation || 'set');
    }
    async updateAllLeaveBalances(id, leaveBalance, req) {
        const employee = await this.employeeService.findOne(id, false);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.employeeService.updateAllLeaveBalances(id, leaveBalance);
    }
};
exports.EmployeeController = EmployeeController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)('ADMIN', 'HR_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new employee' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Employee successfully created.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_dto_1.CreateEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SECRETARY'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employees of a subsidiary' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('includeRelations')),
    __param(3, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto, String, String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SECRETARY'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single employee by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('includeRelations')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)('ADMIN', 'HR_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_dto_1.UpdateEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete employee by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('upload-documents'),
    (0, role_decorator_1.Roles)('ADMIN', 'HR_MANAGER'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)({
        limits: { fileSize: 10 * 1024 * 1024, files: 10, fields: 30, parts: 40 },
    })),
    (0, swagger_1.ApiOperation)({ summary: 'Upload documents (without employee link)' }),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "uploadDocumentsGeneric", null);
__decorate([
    (0, common_1.Post)('delete-document'),
    (0, role_decorator_1.Roles)('ADMIN', 'HR_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a document file' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Post)(':id/upload-documents'),
    (0, role_decorator_1.Roles)('ADMIN', 'HR_MANAGER'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)({
        limits: { fileSize: 10 * 1024 * 1024, files: 10, fields: 30, parts: 40 },
    })),
    (0, swagger_1.ApiOperation)({ summary: 'Upload documents for an employee' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "uploadDocuments", null);
__decorate([
    (0, common_1.Post)(':id/documents'),
    (0, role_decorator_1.Roles)('ADMIN', 'HR_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a document to an employee' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "addDocument", null);
__decorate([
    (0, common_1.Post)(':id/trainings'),
    (0, role_decorator_1.Roles)('HR_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a training record to an employee' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "addTraining", null);
__decorate([
    (0, common_1.Post)(':id/position-history'),
    (0, role_decorator_1.Roles)('HR_MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a position history entry' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "addPositionHistory", null);
__decorate([
    (0, common_1.Post)(':id/performance-reviews'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a performance review' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "addPerformanceReview", null);
__decorate([
    (0, common_1.Post)(':id/leaves'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a leave record' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_leave_record_dto_1.AddLeaveRecordDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "addLeaveRecord", null);
__decorate([
    (0, common_1.Get)(':id/leave-balances'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee leave balances' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getLeaveBalances", null);
__decorate([
    (0, common_1.Patch)(':id/leave-balances/:leaveType'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee leave balance' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('leaveType')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_leave_balance_dto_1.UpdateLeaveBalanceDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "updateLeaveBalance", null);
__decorate([
    (0, common_1.Patch)(':id/leave-balances'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update all employee leave balances' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_dto_1.LeaveBalanceDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "updateAllLeaveBalances", null);
exports.EmployeeController = EmployeeController = __decorate([
    (0, swagger_1.ApiTags)('Employees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('hr/employees'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService,
        logger_service_1.LoggerService,
        file_upload_service_1.FileUploadService,
        private_documents_service_1.PrivateDocumentsService])
], EmployeeController);
//# sourceMappingURL=employee.controller.js.map