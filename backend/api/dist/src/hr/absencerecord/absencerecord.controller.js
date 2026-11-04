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
exports.AbsencerecordController = void 0;
const common_1 = require("@nestjs/common");
const absencerecord_service_1 = require("./absencerecord.service");
const absencerecord_dto_1 = require("./dto/absencerecord.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
const subsidiary_calendar_dto_1 = require("./dto/subsidiary-calendar.dto");
let AbsencerecordController = class AbsencerecordController {
    absenceRecordService;
    constructor(absenceRecordService) {
        this.absenceRecordService = absenceRecordService;
    }
    create(createAbsenceRecordDto, req) {
        if (!createAbsenceRecordDto.employeeId) {
            throw new common_1.BadRequestException('employeeId is required');
        }
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        return this.absenceRecordService.create(createAbsenceRecordDto, createAbsenceRecordDto.employeeId, subsidiaryId);
    }
    async generateDailyAbsences(req, requestedId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, requestedId);
        if (!subsidiaryId) {
            throw new common_1.BadRequestException('Sélectionnez une filiale avant de générer les absences.');
        }
        return this.absenceRecordService.generateDailyAbsences(subsidiaryId);
    }
    getCalendar(req, requestedId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, requestedId);
        if (!subsidiaryId) {
            throw new common_1.BadRequestException('Sélectionnez une filiale pour consulter son calendrier.');
        }
        return this.absenceRecordService.getSubsidiaryCalendar(subsidiaryId);
    }
    updateWorkingDays(req, body, requestedId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, requestedId);
        if (!subsidiaryId) {
            throw new common_1.BadRequestException('Sélectionnez une filiale pour modifier son calendrier.');
        }
        return this.absenceRecordService.updateWorkingDays(subsidiaryId, body.workingDays);
    }
    addHoliday(req, body, requestedId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, requestedId);
        if (!subsidiaryId) {
            throw new common_1.BadRequestException('Sélectionnez une filiale pour ajouter un jour férié.');
        }
        return this.absenceRecordService.addHoliday(subsidiaryId, body.date, body.name);
    }
    removeHoliday(req, holidayId, requestedId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, requestedId);
        if (!subsidiaryId) {
            throw new common_1.BadRequestException('Sélectionnez une filiale pour supprimer un jour férié.');
        }
        return this.absenceRecordService.removeHoliday(subsidiaryId, holidayId);
    }
    findAll(req, paginationQuery, subsidiaryIdFilter) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, subsidiaryIdFilter);
        return this.absenceRecordService.findAll(subsidiaryId, paginationQuery);
    }
    async findOne(id, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const record = await this.absenceRecordService.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, ctx);
        return record;
    }
    async update(id, updateAbsenceRecordDto, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const record = await this.absenceRecordService.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, ctx);
        return this.absenceRecordService.update(id, updateAbsenceRecordDto);
    }
    async remove(id, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const record = await this.absenceRecordService.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, ctx);
        return this.absenceRecordService.remove(id);
    }
};
exports.AbsencerecordController = AbsencerecordController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [absencerecord_dto_1.CreateAbsenceRecordDto, Object]),
    __metadata("design:returntype", void 0)
], AbsencerecordController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('generate-daily'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AbsencerecordController.prototype, "generateDailyAbsences", null);
__decorate([
    (0, common_1.Get)('calendar'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AbsencerecordController.prototype, "getCalendar", null);
__decorate([
    (0, common_1.Patch)('calendar/working-days'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subsidiary_calendar_dto_1.UpdateWorkingDaysDto, String]),
    __metadata("design:returntype", void 0)
], AbsencerecordController.prototype, "updateWorkingDays", null);
__decorate([
    (0, common_1.Post)('calendar/holidays'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subsidiary_calendar_dto_1.CreateSubsidiaryHolidayDto, String]),
    __metadata("design:returntype", void 0)
], AbsencerecordController.prototype, "addHoliday", null);
__decorate([
    (0, common_1.Delete)('calendar/holidays/:holidayId'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('holidayId')),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AbsencerecordController.prototype, "removeHoliday", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto, String]),
    __metadata("design:returntype", void 0)
], AbsencerecordController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AbsencerecordController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, absencerecord_dto_1.UpdateAbsenceRecordDto, Object]),
    __metadata("design:returntype", Promise)
], AbsencerecordController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AbsencerecordController.prototype, "remove", null);
exports.AbsencerecordController = AbsencerecordController = __decorate([
    (0, common_1.Controller)('hr/absence-records'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [absencerecord_service_1.AbsenceRecordService])
], AbsencerecordController);
//# sourceMappingURL=absencerecord.controller.js.map