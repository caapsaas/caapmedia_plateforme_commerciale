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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeriodFilterDto = exports.PeriodFilter = void 0;
const class_validator_1 = require("class-validator");
var PeriodFilter;
(function (PeriodFilter) {
    PeriodFilter["ALL_TIME"] = "all_time";
    PeriodFilter["THIS_MONTH"] = "this_month";
    PeriodFilter["LAST_MONTH"] = "last_month";
    PeriodFilter["LAST_7_DAYS"] = "last_7_days";
    PeriodFilter["LAST_30_DAYS"] = "last_30_days";
    PeriodFilter["LAST_90_DAYS"] = "last_90_days";
    PeriodFilter["THIS_YEAR"] = "this_year";
    PeriodFilter["CUSTOM"] = "custom";
})(PeriodFilter || (exports.PeriodFilter = PeriodFilter = {}));
class PeriodFilterDto {
    period = PeriodFilter.THIS_MONTH;
    startDate;
    endDate;
}
exports.PeriodFilterDto = PeriodFilterDto;
__decorate([
    (0, class_validator_1.IsEnum)(PeriodFilter),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PeriodFilterDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.period === PeriodFilter.CUSTOM),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], PeriodFilterDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.period === PeriodFilter.CUSTOM),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], PeriodFilterDto.prototype, "endDate", void 0);
//# sourceMappingURL=period-filter.dto.js.map