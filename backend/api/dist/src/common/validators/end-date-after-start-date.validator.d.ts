import { ValidatorConstraintInterface, ValidationArguments, ValidationOptions } from 'class-validator';
export declare class EndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
    validate(endDate: any, args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsEndDateAfterStartDate(startDateField: string, validationOptions?: ValidationOptions): (target: object, propertyName: string) => void;
