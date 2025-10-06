import { UserRole } from '@prisma/client';
import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';


export const ROLES_KEY = 'roles'; // Clé de métadonnées pour les rôles
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);


/**
 * Décorateur @CurrentUser
 * Extrait l'objet utilisateur de la requête.
 * La requête est enrichie par le JwtAuthGuard.
 * 
 * @example
 * someMethod(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    },
  )