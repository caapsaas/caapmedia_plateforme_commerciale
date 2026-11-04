"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsCameroonCNPSConstraint = void 0;
exports.IsCameroonCNPS = IsCameroonCNPS;
const class_validator_1 = require("class-validator");
const cameroon_payroll_const_1 = require("../constants/cameroon-payroll.const");
let IsCameroonCNPSConstraint = class IsCameroonCNPSConstraint {
    validate(value) {
        if (!value)
            return true;
        return (0, cameroon_payroll_const_1.isValidCNPSFormat)(value);
    }
    defaultMessage(args) {
        return 'CNPS number must be in format: XX XXXX XXXX XXXX (16 digits)';
    }
};
exports.IsCameroonCNPSConstraint = IsCameroonCNPSConstraint;
exports.IsCameroonCNPSConstraint = IsCameroonCNPSConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isCameroonCNPS', async: false })
], IsCameroonCNPSConstraint);
function IsCameroonCNPS(validationOptions) {
    return function (target, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsCameroonCNPSConstraint,
        });
    };
}
//# sourceMappingURL=cameroon-cnps.validator.js.map