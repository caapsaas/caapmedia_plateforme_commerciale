import { PaginationQueryDto } from './dto/pagination-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Sous-ensemble structurel commun aux délégués Prisma (this.prisma.contact,
 * this.prisma.account, ...) — évite `any` tout en acceptant n'importe quel
 * modèle sans caster explicitement à chaque appel.
 */
interface PaginatableModel<T> {
  findMany(args: Record<string, unknown>): Promise<T[]>;
  count(args: { where?: Record<string, unknown> }): Promise<number>;
}

export async function paginate<T>(
  model: PaginatableModel<T>,
  query: Record<string, unknown> = {},
  options: PaginationQueryDto = { page: 1, limit: 10 },
): Promise<PaginatedResult<T>> {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      ...query,
      skip,
      take: limit,
    }),
    model.count({
      where: (query.where as Record<string, unknown>) || {},
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
