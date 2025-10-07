// src/crm/leads/leads.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { User, LeadStatus, ContactStatus, OpportunityStage, OpportunitySource, Account } from '@prisma/client';
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
    return this.prisma.lead.create({
      data: {
        ...createLeadDto,
        subsidiaryId: user.subsidiaryId,
        salesRepId: user.id, // Assigner la piste au commercial qui la crée
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
    const lead = await this.findOne(id, user);

    if (lead.status !== LeadStatus.QUALIFIED) {
      throw new BadRequestException('Only qualified leads can be converted.');
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
            subsidiaryId: user.subsidiaryId,
            salesRepId: user.id,
        }, user);
      } catch (error) {
        if (error instanceof ConflictException) {
          // Le compte existe déjà, nous le récupérons.
          const existingAccount = await tx.account.findFirst({ where: { accountName: lead.company, subsidiaryId: user.subsidiaryId }});
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
      const contact = await this.contactsService.create(contactDto, user);

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
          userId: user.id,
          subsidiaryId: user.subsidiaryId,
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
