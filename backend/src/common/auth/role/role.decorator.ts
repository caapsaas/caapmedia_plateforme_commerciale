import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles'; // Clé de métadonnées pour les rôles
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);