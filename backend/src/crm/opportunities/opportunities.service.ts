import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { Prisma, User, UserRole } from '@prisma/client';

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOpportunityDto: CreateOpportunityDto, user: User) {
    const { productIds, ...opportunityData } = createOpportunityDto;

    // Vérifier que le contact et le compte existent et appartiennent à la filiale
    const [contact, account] = await Promise.all([
      this.prisma.contact.findFirst({
        where: { id: opportunityData.contactId, subsidiaryId: user.subsidiaryId },
      }),
      this.prisma.account.findFirst({
        where: { id: opportunityData.accountId, subsidiaryId: user.subsidiaryId },
      }),
    ]);

    if (!contact || !account) {
      throw new NotFoundException(
        'Contact or Account not found in this subsidiary.',
      );
    }

    return this.prisma.opportunity.create({
      data: {
        ...opportunityData,
        userId: user.id,
        subsidiaryId: user.subsidiaryId,
        products: productIds
          ? {
              create: productIds.map((id) => ({
                product: { connect: { id } },
              })),
            }
          : undefined,
      },
      include: { products: { include: { product: true } } },
    });
  }

  async findAll(user: User) {
    const where: Prisma.OpportunityWhereInput = {
      subsidiaryId: user.subsidiaryId,
    };

    // Un ADMIN voit toutes les opportunités de la filiale, les autres ne voient que les leurs.
    if (user.userRole !== UserRole.ADMIN) {
      where.userId = user.id;
    }

    return this.prisma.opportunity.findMany({
      where,
      include: {
        contact: { select: { contactName: true } },
        account: { select: { accountName: true } },
        user: { select: { userName: true } },
      },
      orderBy: { closeDate: 'desc' },
    });
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

    if (opportunity.subsidiaryId !== user.subsidiaryId) {
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

    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...opportunityData,
        products: productIds
          ? {
              set: productIds.map((id) => ({
                id: id,
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
