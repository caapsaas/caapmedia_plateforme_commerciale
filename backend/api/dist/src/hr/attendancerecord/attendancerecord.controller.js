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
exports.AttendanceRecordController = void 0;
const common_1 = require("@nestjs/common");
const attendancerecord_service_1 = require("./attendancerecord.service");
const atendancerecord_dto_1 = require("./dto/atendancerecord.dto");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
function hideLocation(record) {
    const attendance = { ...record };
    delete attendance.arrivalLatitude;
    delete attendance.arrivalLongitude;
    delete attendance.departureLatitude;
    delete attendance.departureLongitude;
    delete attendance.accuracyMeters;
    delete attendance.isGeolocationValid;
    return attendance;
}
let AttendanceRecordController = class AttendanceRecordController {
    attendanceRecordService;
    constructor(attendanceRecordService) {
        this.attendanceRecordService = attendanceRecordService;
    }
    async create(createAttendanceRecordDto, req) {
        if (!createAttendanceRecordDto.employeeId) {
            throw new common_1.BadRequestException('employeeId is required');
        }
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        const record = await this.attendanceRecordService.create(createAttendanceRecordDto, createAttendanceRecordDto.employeeId, subsidiaryId);
        return hideLocation(record);
    }
    async findAll(req, query) {
        const paginationQuery = new pagination_query_dto_1.PaginationQueryDto();
        paginationQuery.page = query.page ? Number(query.page) : 1;
        paginationQuery.limit = query.limit ? Number(query.limit) : 10;
        paginationQuery.search = query.search;
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, query.subsidiaryId);
        const result = await this.attendanceRecordService.findAll(subsidiaryId, paginationQuery);
        return { ...result, data: result.data.map(hideLocation) };
    }
    async findOne(id, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const record = await this.attendanceRecordService.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, ctx);
        return hideLocation(record);
    }
    async update(id, updateAttendanceRecordDto, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const record = await this.attendanceRecordService.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, ctx);
        const updated = await this.attendanceRecordService.update(id, updateAttendanceRecordDto);
        return hideLocation(updated);
    }
    async remove(id, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const record = await this.attendanceRecordService.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, ctx);
        const deleted = await this.attendanceRecordService.remove(id);
        return hideLocation(deleted);
    }
};
exports.AttendanceRecordController = AttendanceRecordController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [atendancerecord_dto_1.CreateAttendanceRecordDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceRecordController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, atendancerecord_dto_1.AttendanceRecordQueryDto]),
    __metadata("design:returntype", Promise)
], AttendanceRecordController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceRecordController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, atendancerecord_dto_1.UpdateAttendanceRecordDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceRecordController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceRecordController.prototype, "remove", null);
exports.AttendanceRecordController = AttendanceRecordController = __decorate([
    (0, common_1.Controller)('hr/attendance-records'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [attendancerecord_service_1.AttendanceRecordService])
], AttendanceRecordController);
//# sourceMappingURL=attendancerecord.controller.js.map