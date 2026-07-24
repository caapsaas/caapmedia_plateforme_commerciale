// src/crm/leads/leads.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { PublicQuoteRequestDto } from './dto/public-quote-request.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import {
  User,
  LeadStatus,
  OpportunityStage,
  OpportunitySource,
  Account,
  UserRole,
  Prisma,
} from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { ContactsService } from '../contacts/contacts.service';
import { CreateContactDto } from '../contacts/dto/create-contact.dto';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly contactsService: ContactsService, // Injecter ContactsService
  ) {}

  async create(createLeadDto: CreateLeadDto, user: User) {
    // Récupérer l'utilisateur complet depuis la base pour s'assurer que les rôles sont à jour
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!fullUser) {
      throw new NotFoundException(`User with ID "${user.id}" not found.`);
    }

    // Par défaut, une piste n'est pas assignée, sauf si un commercial la crée pour lui-même ou qu'un admin l'assigne.
    let finalSalesRepId: string | null = null;

    if (fullUser.userRole === UserRole.ADMIN && createLeadDto.salesRepId) {
      // Vérifier que l'utilisateur assigné comme commercial existe bien
      const salesRepExists = await this.prisma.user.findUnique({
        where: { id: createLeadDto.salesRepId },
      });
      if (!salesRepExists) {
        throw new NotFoundException(
          `Sales representative with ID "${createLeadDto.salesRepId}" not found.`,
        );
      }
      finalSalesRepId = createLeadDto.salesRepId;
    } else if (fullUser.userRole !== UserRole.ADMIN) {
      // Si ce n'est pas un admin, la piste est assignée à l'utilisateur qui la crée (ex: un commercial).
      finalSalesRepId = user.id;
    }

    // Vérifier si une piste avec cet email existe déjà
    const existingLead = await this.prisma.lead.findUnique({
      where: { email: createLeadDto.email },
    });

    if (existingLead) {
      throw new ConflictException(
        `A lead with the email "${createLeadDto.email}" already exists.`,
      );
    }

    // Créer la piste
    return this.prisma.lead.create({
      data: {
        ...createLeadDto, // Garde les autres champs du DTO
        subsidiaryId: fullUser.subsidiaryId,
        salesRepId: finalSalesRepId, // Applique le commercial correctement assigné
      },
    });
  }

  async findAll(user: User) {
    const isSuperAdmin = user.userRole === UserRole.SUPER_ADMIN;
    const where: Prisma.LeadWhereInput = isSuperAdmin
      ? {}
      : { subsidiaryId: user.subsidiaryId };

    if (!isSuperAdmin) {
      const privilegedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SECRETARY];
      if (!privilegedRoles.includes(user.userRole)) {
        where.OR = [{ salesRepId: user.id }, { salesRepId: null }];
      }
    }

    return this.prisma.lead.findMany({
      where,
      orderBy: { leadName: 'asc' },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found.`);
    }
    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto) {
    const lead = await this.findOne(id);

    if (updateLeadDto.email) {
      const existingLead = await this.prisma.lead.findUnique({
        where: { email: updateLeadDto.email },
      });
      if (existingLead && existingLead.id !== id) {
        throw new ConflictException(
          `A lead with email "${updateLeadDto.email}" already exists.`,
        );
      }
    }

    return this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // juste vérifier que ça existe
    await this.prisma.lead.delete({ where: { id } });
    return { message: `Lead with ID "${id}" deleted successfully.` };
  }

  /**
   * Convertit une piste qualifiée en Contact, Compte et Opportunité.
   */
  // ====================== CONVERT ======================
  async convert(id: string, user: User) {
    // Récupère l'utilisateur et la lead
    const [fullUser, lead] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: user.id } }),
      this.prisma.lead.findUnique({ where: { id } }),
    ]);

    if (!fullUser)
      throw new NotFoundException(`User with ID "${user.id}" not found.`);
    if (!lead) throw new NotFoundException(`Lead with ID "${id}" not found.`);
    if (lead.status !== LeadStatus.QUALIFIED)
      throw new BadRequestException('Only qualified leads can be converted.');

    const salesRepId = lead.salesRepId ?? fullUser.id;

    return this.prisma.$transaction(async (tx) => {
      // 1. Créer le compte
      let account: Account;
      try {
        account = await this.accountsService.create(
          {
            accountName: lead.leadName,
            industry: lead.company,
            phone: lead.phone,
            address: 'Unknown',
            subsidiaryId: fullUser.subsidiaryId,
            salesRepId: lead.salesRepId ?? undefined, // Convertit null en undefined
          },
          user,
        ); // On peut passer l'objet user directement
      } catch (error) {
        if (error instanceof ConflictException) {
          const existingAccount = await tx.account.findFirst({
            where: {
              accountName: lead.leadName,
              subsidiaryId: fullUser.subsidiaryId,
            },
          });
          if (!existingAccount)
            throw new NotFoundException(
              `Failed to find existing account for company "${lead.company}" after conflict.`,
            );
          account = existingAccount;
        } else {
          throw error;
        }
      }

      // 2. Créer le contact
      const contactDto: CreateContactDto = {
        contactName: lead.leadName,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        address: 'Unknown',
        accountId: account.id,
      };
      const contact = await this.contactsService.create(contactDto, fullUser);

      // 3. Créer l'opportunité
      const opportunity = await tx.opportunity.create({
        data: {
          opportunityName: `Opportunity from ${lead.leadName}`,
          opportunityValue: 0,
          closeDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          stage: OpportunityStage.QUALIFICATION,
          sourceOpportunity: OpportunitySource.MANUAL,
          contactId: contact.id,
          accountId: account.id,
          userId: fullUser.id,
          subsidiaryId: fullUser.subsidiaryId,
        },
      });

      // 4. Supprimer la lead convertie
      await tx.lead.delete({ where: { id: lead.id } });

      return {
        message: 'Lead converted successfully.',
        contact,
        account,
        opportunity,
      };
    });
  }
}
