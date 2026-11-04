"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbsencerecordModule = void 0;
const common_1 = require("@nestjs/common");
const absencerecord_service_1 = require("./absencerecord.service");
const absencerecord_controller_1 = require("./absencerecord.controller");
let AbsencerecordModule = class AbsencerecordModule {
};
exports.AbsencerecordModule = AbsencerecordModule;
exports.AbsencerecordModule = AbsencerecordModule = __decorate([
    (0, common_1.Module)({
        providers: [absencerecord_service_1.AbsenceRecordService],
        controllers: [absencerecord_controller_1.AbsencerecordController],
        exports: [absencerecord_service_1.AbsenceRecordService],
    })
], AbsencerecordModule);
//# sourceMappingURL=absencerecord.module.js.map