// src/crm/leads/leads.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { User, LeadStatus, OpportunityStage, OpportunitySource, Account, UserRole } from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { ContactsService } from '../contacts/contacts.service';
import { CreateContactDto } from '../contacts/dto/create-contact.dto';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService, 
    private accountsService: AccountsService,
    private contactsService: ContactsService, // Injecter ContactsService
  ) {}

  async create(createLeadDto: CreateLeadDto, user: User) {
    // Récupérer l'utilisateur complet depuis la base de données pour s'assurer que les rôles sont à jour
    const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!fullUser) {
      throw new NotFoundException(`User with ID "${user.id}" not found.`);
    }

    let finalSalesRepId: string | null = null;

    if (fullUser.userRole === UserRole.ADMIN) {
      // Un ADMIN peut assigner la piste à n'importe quel employé (ou à personne).
      // Si un salesRepId est fourni, on l'utilise. Sinon, il reste null.
      if (createLeadDto.salesRepId) {
        const employeeExists = await this.prisma.employee.findUnique({ where: { id: createLeadDto.salesRepId }});
        if (!employeeExists) {
          throw new NotFoundException(`Sales representative with ID "${createLeadDto.salesRepId}" not found.`);
        }
        finalSalesRepId = createLeadDto.salesRepId;
      }
    } else {
      // Un non-ADMIN (ex: COMMERCIAL) doit être un employé et ne peut assigner la piste qu'à lui-même.
      if (createLeadDto.salesRepId) {
        throw new ForbiddenException('You are not allowed to assign leads to other representatives.');
      }
      const employee = await this.prisma.employee.findUnique({
        where: { email: fullUser.email },
      });

      if (!employee) {
        throw new NotFoundException(
          `Employee record not found for user "${fullUser.email}". Non-admin users must be employees to create leads.`,
        );
      }
      finalSalesRepId = employee.id;
    }

    // Vérifier si une piste avec cet email existe déjà
    const existingLead = await this.prisma.lead.findUnique({
      where: { email: createLeadDto.email },
    });

    if (existingLead) {
      throw new ConflictException(`A lead with the email "${createLeadDto.email}" already exists.`);
    }

    return this.prisma.lead.create({
      data: {
        ...createLeadDto,
        subsidiaryId: fullUser.subsidiaryId,
        salesRepId: finalSalesRepId,
      },
    });
  }

  async findAll(user: User) {
    return this.prisma.lead.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { leadName: 'asc' },
    });
  }

  async findOne(id: string, user: User) {
    const lead = await this.prisma.lead.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found.`);
    }
    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et l'appartenance
    return this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
    });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et l'appartenance
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

    let salesRepId: string | null = null;

    // Si l'utilisateur n'est pas un admin, il doit être un employé pour convertir.
    if (fullUser.userRole !== UserRole.ADMIN) {
      const employee = await this.prisma.employee.findUnique({
        where: { email: fullUser.email },
      });

      if (!employee) {
        throw new NotFoundException(
          `Sales representative with email "${user.email}" not found. Cannot convert lead.`,
        );
      }
      salesRepId = employee.id;
    }

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
            salesRepId: salesRepId ?? undefined, // CORRECTION: Convertit null en undefined pour correspondre au DTO
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
