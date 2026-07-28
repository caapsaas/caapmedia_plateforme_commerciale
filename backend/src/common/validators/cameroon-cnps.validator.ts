import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { isValidCNPSFormat } from '../constants/cameroon-payroll.const';

@ValidatorConstraint({ name: 'isCameroonCNPS', async: false })
export class IsCameroonCNPSConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value) return true; // Optional field
    return isValidCNPSFormat(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'CNPS number must be in format: XX XXXX XXXX XXXX (16 digits)';
  }
}

export function IsCameroonCNPS(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCameroonCNPSConstraint,
    });
  };
}
