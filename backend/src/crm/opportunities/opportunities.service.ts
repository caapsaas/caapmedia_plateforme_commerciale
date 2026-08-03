import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { Prisma, User, UserRole } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { paginate } from 'src/common/pagination/pagination';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOpportunityDto: CreateOpportunityDto, user: User) {
    const { productIds, ...opportunityData } = createOpportunityDto;

    // Valider la présence des IDs requis
    if (!opportunityData.contactId || !opportunityData.accountId) {
      throw new BadRequestException('Contact ID and Account ID are required.');
    }

    // Vérifier que le contact et le compte existent et appartiennent à la filiale
    const [contact, account] = await Promise.all([
      this.prisma.contact.findFirst({
        where: {
          id: opportunityData.contactId,
          subsidiaryId: user.subsidiaryId,
        },
      }),
      this.prisma.account.findFirst({
        where: {
          id: opportunityData.accountId,
          subsidiaryId: user.subsidiaryId,
        },
      }),
    ]);

    if (!contact || !account) {
      throw new NotFoundException(
        'Contact or Account not found in this subsidiary.',
      );
    }

    return this.prisma.opportunity.create({
      data: {
        id: generateId(ID_PREFIXES.OPPORTUNITY),
        ...opportunityData,
        userId: user.id,
        subsidiaryId: user.subsidiaryId,
        products: productIds
          ? {
              create: productIds.map((id) => ({
                id: generateId(ID_PREFIXES.OPPORTUNITYPRODUCT),
                product: { connect: { id } },
              })),
            }
          : undefined,
      },
      include: { products: { include: { product: true } } },
    });
  }

  async findAll(user: User, paginationQuery: PaginationQueryDto = {}) {
    const isSuperAdmin = user.userRole === UserRole.SUPER_ADMIN;
    const where: Prisma.OpportunityWhereInput = isSuperAdmin
      ? {}
      : { subsidiaryId: user.subsidiaryId };

    if (!isSuperAdmin) {
      const privilegedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SECRETARY];
      if (!privilegedRoles.includes(user.userRole)) {
        where.userId = user.id;
      }
    }

    if (paginationQuery.search) {
      where.opportunityName = {
        contains: paginationQuery.search,
        mode: 'insensitive',
      };
    }

    return paginate(
      this.prisma.opportunity,
      {
        where,
        include: {
          contact: { select: { contactName: true } },
          account: { select: { accountName: true } },
          user: { select: { userName: true } },
        },
        orderBy: { closeDate: 'desc' },
      },
      paginationQuery,
    );
  }

  async findOne(id: string, user: User) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        contact: true,
        account: true,
        user: true,
        products: { include: { product: true } },
        crmTasks: true,
      },
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID "${id}" not found.`);
    }

    const privilegedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SECRETARY];
    if (
      opportunity.subsidiaryId !== user.subsidiaryId ||
      (!privilegedRoles.includes(user.userRole) &&
        opportunity.userId !== user.id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this opportunity.',
      );
    }

    return opportunity;
  }

  async update(
    id: string,
    updateOpportunityDto: UpdateOpportunityDto,
    user: User,
  ) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    const { productIds, ...opportunityData } = updateOpportunityDto;

    // La mise à jour des produits se fait en deux étapes :
    // 1. Supprimer les anciennes associations de produits.
    // 2. Créer les nouvelles associations.
    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...opportunityData,
        products: productIds
          ? {
              // Supprime toutes les relations OpportunityProduct existantes pour cette opportunité
              deleteMany: {},
              // Crée de nouvelles relations OpportunityProduct pour chaque productId
              create: productIds.map((productId) => ({
                id: generateId(ID_PREFIXES.OPPORTUNITYPRODUCT),
                product: { connect: { id: productId } },
              })),
            }
          : undefined,
      },
    });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    return this.prisma.opportunity.delete({ where: { id } });
  }
}
