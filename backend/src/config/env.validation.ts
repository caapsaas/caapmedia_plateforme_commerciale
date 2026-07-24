import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET doit faire au moins 32 caractères' })
  JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.map((error) =>
      Object.values(error.constraints ?? {}).join(', '),
    );
    throw new Error(
      `Configuration d'environnement invalide:\n${messages.join('\n')}`,
    );
  }

  return validatedConfig;
}
