"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsMinAgeConstraint = void 0;
exports.IsMinAge = IsMinAge;
const class_validator_1 = require("class-validator");
let IsMinAgeConstraint = class IsMinAgeConstraint {
    validate(value, args) {
        if (!value)
            return false;
        const minAge = args.constraints[0];
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            return age - 1 >= minAge;
        }
        return age >= minAge;
    }
    defaultMessage(args) {
        const minAge = args.constraints[0];
        return `Age must be at least ${minAge} years old`;
    }
};
exports.IsMinAgeConstraint = IsMinAgeConstraint;
exports.IsMinAgeConstraint = IsMinAgeConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isMinAge', async: false })
], IsMinAgeConstraint);
function IsMinAge(minAge, validationOptions) {
    return function (target, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [minAge],
            validator: IsMinAgeConstraint,
        });
    };
}
//# sourceMappingURL=age-validation.validator.js.map