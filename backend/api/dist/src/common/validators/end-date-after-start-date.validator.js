"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndDateAfterStartDateConstraint = void 0;
exports.IsEndDateAfterStartDate = IsEndDateAfterStartDate;
const class_validator_1 = require("class-validator");
let EndDateAfterStartDateConstraint = class EndDateAfterStartDateConstraint {
    validate(endDate, args) {
        const startDateField = args.constraints[0];
        const startDate = args.object[startDateField];
        if (!startDate || !endDate)
            return true;
        return new Date(endDate) >= new Date(startDate);
    }
    defaultMessage(args) {
        const startDateField = args.constraints[0];
        return `${args.property} must be greater than or equal to ${startDateField}`;
    }
};
exports.EndDateAfterStartDateConstraint = EndDateAfterStartDateConstraint;
exports.EndDateAfterStartDateConstraint = EndDateAfterStartDateConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'endDateAfterStartDate', async: false })
], EndDateAfterStartDateConstraint);
function IsEndDateAfterStartDate(startDateField, validationOptions) {
    return function (target, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [startDateField],
            validator: EndDateAfterStartDateConstraint,
        });
    };
}
//# sourceMappingURL=end-date-after-start-date.validator.js.map