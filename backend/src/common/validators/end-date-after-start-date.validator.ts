import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'endDateAfterStartDate', async: false })
export class EndDateAfterStartDateConstraint
  implements ValidatorConstraintInterface
{
  validate(endDate: any, args: ValidationArguments) {
    const startDateField = args.constraints[0] as string;
    const startDate = (args.object as any)[startDateField];

    if (!startDate || !endDate) return true;

    return new Date(endDate) >= new Date(startDate);
  }

  defaultMessage(args: ValidationArguments) {
    const startDateField = args.constraints[0] as string;
    return `${args.property} must be greater than or equal to ${startDateField}`;
  }
}

export function IsEndDateAfterStartDate(
  startDateField: string,
  validationOptions?: ValidationOptions,
) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [startDateField],
      validator: EndDateAfterStartDateConstraint,
    });
  };
}
