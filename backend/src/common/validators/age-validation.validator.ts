import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isMinAge', async: false })
export class IsMinAgeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value) return false;
    const minAge = args.constraints[0] as number;
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= minAge;
    }
    return age >= minAge;
  }

  defaultMessage(args: ValidationArguments) {
    const minAge = args.constraints[0] as number;
    return `Age must be at least ${minAge} years old`;
  }
}

export function IsMinAge(minAge: number, validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minAge],
      validator: IsMinAgeConstraint,
    });
  };
}
