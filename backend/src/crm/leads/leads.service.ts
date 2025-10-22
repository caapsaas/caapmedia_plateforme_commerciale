// src/crm/leads/leads.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { User, LeadStatus, OpportunityStage, OpportunitySource, Account, UserRole, Prisma } from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { ContactsService } from '../contacts/contacts.service';
import { CreateContactDto } from '../contacts/dto/create-contact.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService, 
    private readonly accountsService: AccountsService,
    private readonly contactsService: ContactsService, // Injecter ContactsService
  ) {}

 async create(createLeadDto: CreateLeadDto, user: User) {
  // Récupérer l'utilisateur complet depuis la base pour s'assurer que les rôles sont à jour
  const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
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
      throw new NotFoundException(`Sales representative with ID "${createLeadDto.salesRepId}" not found.`);
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
    throw new ConflictException(`A lead with the email "${createLeadDto.email}" already exists.`);
  }

  // Créer la piste
  return this.prisma.lead.create({
    data: {
      ...createLeadDto,
      subsidiaryId: fullUser.subsidiaryId,
      salesRepId: finalSalesRepId,
    },
  });
}


  async findAll(user: User) {
    const where: Prisma.LeadWhereInput = {
      subsidiaryId: user.subsidiaryId,
    };

    // Les admins et secrétaires voient toutes les pistes de la filiale.
    // Les commerciaux ne voient que les leurs.
    const privilegedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SECRETARY];
    if (!privilegedRoles.includes(user.userRole)) {
      // Un commercial voit ses propres pistes ET les pistes non assignées
      where.OR = [
        { salesRepId: user.id },
        { salesRepId: null }
      ];
    }

    return this.prisma.lead.findMany({
      where,
      orderBy: { leadName: 'asc' },
    });
  }

  async findOne(id: string, user: User) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found.`);
    }
    const privilegedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SECRETARY];
    if (lead.subsidiaryId !== user.subsidiaryId || (!privilegedRoles.includes(user.userRole) && lead.salesRepId !== user.id)) {
      throw new ForbiddenException('You are not allowed to view this lead.');
    }
    return lead;
  }

async update(id: string, updateLeadDto: UpdateLeadDto, user: User) {
  // 1. Vérifier que la piste existe et que l'utilisateur a le droit de la modifier.
  // findOne gère déjà les erreurs NotFoundException et ForbiddenException.
  await this.findOne(id, user);

  // 2. Vérifier l'unicité de l'email si celui-ci est modifié.
  if (updateLeadDto.email) {
    const existingLead = await this.prisma.lead.findUnique({
      where: { email: updateLeadDto.email },
    });
    if (existingLead && existingLead.id !== id) {
      throw new ConflictException(`Une piste avec l'email "${updateLeadDto.email}" existe déjà.`);
    }
  }

  // 3. Si un commercial est assigné, vérifier qu'il existe.
  if (updateLeadDto.salesRepId) {
    const salesRepExists = await this.prisma.user.findUnique({ where: { id: updateLeadDto.salesRepId }});
    if (!salesRepExists) {
      throw new BadRequestException(`Le commercial avec l'ID "${updateLeadDto.salesRepId}" n'a pas été trouvé.`);
    }
  }

  // 4. Effectuer la mise à jour
  return this.prisma.lead.update({
    where: { id },
    data: updateLeadDto,
  });
}




  async remove(id: string, user: User) {
  // Vérifie simplement que la lead existe
  const lead = await this.prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    throw new NotFoundException(`Lead with ID "${id}" not found.`);
    // 1. Vérifier que la piste existe et que l'utilisateur a le droit de la supprimer.
    // findOne gère déjà les erreurs NotFoundException et ForbiddenException.
    await this.findOne(id, user);

    // 2. Effectuer la suppression
    return this.prisma.lead.delete({ where: { id } });
  }

  // Supprime la lead sans aucune vérification de rôle ou d'appartenance
  await this.prisma.lead.delete({ where: { id } });
  return { message: `Lead with ID "${id}" deleted successfully.` };
}


  /**
   * Convertit une piste qualifiée en Contact, Compte et Opportunité.
   */
  async convert(id: string, user: User) {
    // Récupérer l'utilisateur complet et la piste en une seule fois
    const [fullUser, lead] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: user.id } }),
      this.findOne(id, user)
    ]);

    if (!fullUser) {
      throw new NotFoundException(`User with ID "${user.id}" not found.`);
    }

    if (lead.status !== LeadStatus.QUALIFIED) {
      throw new BadRequestException('Only qualified leads can be converted.');
    }

    // Le commercial assigné est celui de la piste, ou l'utilisateur actuel si la piste n'a pas de commercial.
    const salesRepId = lead.salesRepId ?? fullUser.id;

    return this.prisma.$transaction(async (tx) => {
      // 1. Essayer de créer le Compte (Account). Le service gère les doublons.
      let account: Account;
      try {
        account = await this.accountsService.create({
            accountName: lead.company,
            industry: 'Unknown', // Valeur par défaut, à mettre à jour par l'utilisateur
            phone: lead.phone,
            address: 'Unknown', // Valeur par défaut, à mettre à jour par l'utilisateur
            subsidiaryId: fullUser.subsidiaryId,
            salesRepId: salesRepId,
        }, fullUser);
      } catch (error) {
        if (error instanceof ConflictException) {
          // Le compte existe déjà, nous le récupérons.
          const existingAccount = await tx.account.findFirst({ where: { accountName: lead.company, subsidiaryId: fullUser.subsidiaryId }});
          if (!existingAccount) {
            // This case should not happen if the conflict is on the unique index,
            // but it's a good practice to handle it for type safety and robustness.
            throw new NotFoundException(`Failed to find existing account for company "${lead.company}" after conflict.`);
          }
          account = existingAccount;
        } else {
          throw error; // Relancer les autres erreurs (ex: BadRequestException)
        }
      }

      // 2. Créer le Contact
      // Utiliser le service de contacts pour centraliser la logique de création
      const contactDto: CreateContactDto = {
        contactName: lead.leadName,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        address: 'Unknown', // L'adresse n'existe pas sur le modèle Lead
        accountId: account.id,
      };
      // La méthode `create` du service gère le hashage du mot de passe et l'assignation
      const contact = await this.contactsService.create(contactDto, fullUser);

      // 3. Créer l'Opportunité
      const opportunity = await tx.opportunity.create({
        data: {
          opportunityName: `Opportunity from ${lead.leadName}`,
          opportunityValue: 0, // A estimer plus tard
          closeDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Ex: 30 jours
          stage: OpportunityStage.QUALIFICATION,
          sourceOpportunity: OpportunitySource.MANUAL, // ou une autre source si la piste vient du web
          contactId: contact.id,
          accountId: account.id,
          userId: fullUser.id,
          subsidiaryId: fullUser.subsidiaryId,
        },
      });

      // 4. Supprimer la piste convertie
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
