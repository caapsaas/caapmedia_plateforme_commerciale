import type { ValidationError } from 'class-validator';

export function formatValidationErrors(
  errors: ValidationError[],
  parent = '',
): string[] {
  return errors.flatMap((error) => {
    const path = parent ? `${parent}.${error.property}` : error.property;
    return [
      ...Object.values(error.constraints ?? {}).map(
        (message) => `${path}: ${message}`,
      ),
      ...formatValidationErrors(error.children ?? [], path),
    ];
  });
}
