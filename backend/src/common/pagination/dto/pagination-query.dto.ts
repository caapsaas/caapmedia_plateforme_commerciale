import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de la page (commence à 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    default: 10,
    minimum: 1,
    maximum: 2000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  // Plafond a 2000 (et non 100 comme chez gmo) car ici le pipe de validation
  // est global (app.useGlobalPipes dans main.ts) et s'applique donc aussi aux
  // query params - contrairement a gmo qui n'a pas de pipe global et laisse
  // ses DTOs de query non valides en pratique. Sans cette marge, tout appel
  // "charger tout" (limit: 500/1000 - export CSV/PDF, stats agregees,
  // wrappers de compatibilite) est rejete en 400 par ce Max().
  @Max(2000)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Terme de recherche',
  })
  @IsOptional()
  search?: string;
}
