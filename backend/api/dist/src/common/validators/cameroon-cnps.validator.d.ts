import { ValidatorConstraintInterface, ValidationArguments, ValidationOptions } from 'class-validator';
export declare class IsCameroonCNPSConstraint implements ValidatorConstraintInterface {
    validate(value: any): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsCameroonCNPS(validationOptions?: ValidationOptions): (target: object, propertyName: string) => void;
