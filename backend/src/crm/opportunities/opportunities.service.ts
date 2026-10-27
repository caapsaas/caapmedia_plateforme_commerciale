import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { Prisma, UserRole } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { paginate } from 'src/common/pagination/pagination';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { getActiveRole } from '../../common/auth/role/role-identity';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from '../../common/utils/subsidiary-scope';

// Les objets d'authentification ne doivent jamais sortir dans les relations CRM.
const safeRelations = {
  contact: {
    select: {
      id: true,
      contactName: true,
      company: true,
      email: true,
      phone: true,
      address: true,
      accountId: true,
      subsidiaryId: true,
      salesRepId: true,
      status: true,
    },
  },
  account: {
    select: {
      id: true,
      accountName: true,
      industry: true,
      phone: true,
      address: true,
      subsidiaryId: true,
      salesRepId: true,
    },
  },
  user: { select: { id: true, userName: true, email: true } },
} satisfies Prisma.OpportunityInclude;

const listRelations = {
  ...safeRelations,
  products: { include: { product: true } },
} satisfies Prisma.OpportunityInclude;

const detailRelations = {
  ...listRelations,
  crmTasks: true,
} satisfies Prisma.OpportunityInclude;

type OpportunityWithProducts = Prisma.OpportunityGetPayload<{
  include: typeof listRelations;
}>;

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse<T extends OpportunityWithProducts>(opportunity: T) {
    return {
      ...opportunity,
      opportunityValue: opportunity.opportunityValue.toNumber(),
      productIds: opportunity.products.map((link) => link.productId),
      products: opportunity.products.map((link) => link.product),
    };
  }

  private accessWhere(user: JwtUser): Prisma.OpportunityWhereInput {
    const scope = resolveScopeContext(user);
    if (!user.id?.trim())
      throw new ForbiddenException('Identité utilisateur requise.');
    const where: Prisma.OpportunityWhereInput = withSubsidiaryScope({}, scope);
    const activeRole = getActiveRole(user);
    if (
      !scope.hasGlobalScope &&
      activeRole !== UserRole.ADMIN &&
      activeRole !== UserRole.SECRETARY
    ) {
      where.userId = user.id;
    }
    return where;
  }

  private async findAccessible(
    id: string,
    user: JwtUser,
    db: Pick<Prisma.TransactionClient, 'opportunity'> = this.prisma,
  ) {
    const opportunity = await db.opportunity.findUnique({
      where: { ...this.accessWhere(user), id },
      include: detailRelations,
    });
    if (!opportunity)
      throw new NotFoundException(`Opportunity with ID "${id}" not found.`);
    return opportunity;
  }

  private async validateReferences(
    db: Prisma.TransactionClient,
    contactId: string,
    accountId: string,
    subsidiaryId: string,
  ) {
    if (!contactId || !accountId)
      throw new BadRequestException('Contact ID and Account ID are required.');
    const [contact, account] = await Promise.all([
      db.contact.findUnique({
        where: { id: contactId, subsidiaryId },
        select: { id: true, accountId: true },
      }),
      db.account.findUnique({
        where: { id: accountId, subsidiaryId },
        select: { id: true },
      }),
    ]);
    if (!contact || !account)
      throw new NotFoundException(
        'Contact or Account not found in this subsidiary.',
      );
    if (contact.accountId !== accountId)
      throw new BadRequestException(
        'The contact must belong to the selected account.',
      );
  }

  private async validateProducts(
    db: Prisma.TransactionClient,
    productIds?: string[],
  ) {
    if (productIds === undefined) return undefined;
    if (!Array.isArray(productIds))
      throw new BadRequestException('Product IDs must be an array.');
    const ids = [...new Set(productIds)];
    if (
      ids.length &&
      (await db.item.count({ where: { id: { in: ids } } })) !== ids.length
    ) {
      throw new NotFoundException('One or more products were not found.');
    }
    return ids;
  }

  async create(dto: CreateOpportunityDto, user: JwtUser) {
    // Résout et valide l'identité avant toute requête, y compris pour une création globale.
    this.accessWhere(user);
    if (!dto.contactId || !dto.accountId) {
      throw new BadRequestException('Contact ID and Account ID are required.');
    }
    const scope = resolveScopeContext(user);
    return this.prisma.$transaction(async (tx) => {
      // La filiale cible découle du compte autorisé, jamais d'une propriété libre du corps.
      const account = await tx.account.findUnique({
        where: withSubsidiaryScope({ id: dto.accountId }, scope),
        select: { id: true, subsidiaryId: true },
      });
      if (!account)
        throw new NotFoundException('Account not found in this subsidiary.');
      await this.validateReferences(
        tx,
        dto.contactId,
        dto.accountId,
        account.subsidiaryId,
      );
      const productIds = await this.validateProducts(tx, dto.productIds);
      const opportunity = await tx.opportunity.create({
        data: {
          id: generateId(ID_PREFIXES.OPPORTUNITY),
          opportunityName: dto.opportunityName,
          opportunityValue: dto.opportunityValue,
          closeDate: new Date(dto.closeDate),
          stage: dto.stage,
          sourceOpportunity: dto.sourceOpportunity,
          contactId: dto.contactId,
          accountId: dto.accountId,
          userId: user.id,
          subsidiaryId: account.subsidiaryId,
          products: productIds
            ? {
                create: productIds.map((productId) => ({
                  id: generateId(ID_PREFIXES.OPPORTUNITYPRODUCT),
                  productId,
                })),
              }
            : undefined,
        },
        include: detailRelations,
      });
      return this.toResponse(opportunity);
    });
  }

  async findAll(user: JwtUser, paginationQuery: PaginationQueryDto = {}) {
    const where = this.accessWhere(user);
    if (paginationQuery.search)
      where.opportunityName = {
        contains: paginationQuery.search,
        mode: 'insensitive',
      };
    const result = await paginate<OpportunityWithProducts>(
      {
        findMany: (args) =>
          this.prisma.opportunity.findMany({ ...args, include: listRelations }),
        count: (args) => this.prisma.opportunity.count(args),
      },
      {
        where,
        orderBy: { closeDate: 'desc' },
      },
      paginationQuery,
    );
    return {
      ...result,
      data: result.data.map((opportunity) => this.toResponse(opportunity)),
    };
  }

  async findOne(id: string, user: JwtUser) {
    return this.toResponse(await this.findAccessible(id, user));
  }

  async update(id: string, dto: UpdateOpportunityDto, user: JwtUser) {
    const accessWhere = this.accessWhere(user);
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.findAccessible(id, user, tx);
      const contactId = dto.contactId ?? existing.contactId;
      const accountId = dto.accountId ?? existing.accountId;
      await this.validateReferences(
        tx,
        contactId,
        accountId,
        existing.subsidiaryId,
      );
      const productIds = await this.validateProducts(tx, dto.productIds);
      const opportunity = await tx.opportunity.update({
        where: { ...accessWhere, id },
        data: {
          opportunityName: dto.opportunityName,
          opportunityValue: dto.opportunityValue,
          closeDate:
            dto.closeDate === undefined ? undefined : new Date(dto.closeDate),
          stage: dto.stage,
          sourceOpportunity: dto.sourceOpportunity,
          contactId,
          accountId,
          products: productIds
            ? {
                deleteMany: {},
                create: productIds.map((productId) => ({
                  id: generateId(ID_PREFIXES.OPPORTUNITYPRODUCT),
                  productId,
                })),
              }
            : undefined,
        },
        include: detailRelations,
      });
      return this.toResponse(opportunity);
    });
  }

  async remove(id: string, user: JwtUser) {
    await this.findAccessible(id, user);
    const opportunity = await this.prisma.opportunity.delete({
      where: { ...this.accessWhere(user), id },
      include: listRelations,
    });
    return this.toResponse(opportunity);
  }
}
