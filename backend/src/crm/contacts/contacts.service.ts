import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { EmailService } from 'src/common/utils/email/email.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Prisma, User, UserRole, ContactStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ContactLoginDto } from './dto/contact-login.dto';
import { RegisterContactDto } from './dto/register-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async create(createContactDto: CreateContactDto, user: User) {
    // Le client est une entité globale (Chantier 6) : l'email est unique dans
    // toute l'entreprise, pas seulement dans la filiale courante. Si le client
    // existe déjà (potentiellement dans une autre filiale), on ne le recrée pas
    // en doublon — on renvoie ses infos pour proposer un rattachement direct.
    const existingContact = await this.prisma.contact.findUnique({
      where: { email: createContactDto.email },
      select: {
        id: true,
        contactName: true,
        company: true,
        email: true,
        phone: true,
        subsidiaryId: true,
        subsidiary: { select: { subsidiaryName: true } },
      },
    });

    if (existingContact) {
      throw new ConflictException({
        message: `Un client avec l'email "${createContactDto.email}" existe déjà.`,
        existingContact,
      });
    }

    // Générer un mot de passe temporaire pour le portail client
    const tempPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newContact = await this.prisma.contact.create({
      data: {
        ...createContactDto,
        // Si accountId est une chaîne vide, on le remplace par undefined
        // pour que Prisma ne tente pas de créer une relation invalide.
        accountId: createContactDto.accountId || null,
        subsidiaryId: user.subsidiaryId,
        salesRepId: user.id,
        since: createContactDto.since
          ? new Date(createContactDto.since)
          : new Date(),
        passwordHash,
        isVerified: true, // Le contact est vérifié automatiquement lors de la création
      },
    });

    // Envoyer un email avec les identifiants de connexion
    await this.emailService.sendWelcomeEmail(
      createContactDto.email,
      tempPassword,
      createContactDto.contactName,
    );

    return {
      ...newContact,
      tempPassword, // Retourner le mot de passe temporaire pour le développement
      message:
        'Contact créé avec succès. Un email avec les identifiants de connexion a été envoyé.',
    };
  }

  async findAll(user: User) {
    const where: Prisma.ContactWhereInput = {
      subsidiaryId: user.subsidiaryId,
    };

    // Seul le commercial a une vue restreinte à ses propres contacts.
    if (user.userRole === UserRole.COMMERCIAL) {
      where.salesRepId = user.id;
    }

    return this.prisma.contact.findMany({
      where,
      include: {
        salesRep: { select: { userName: true } },
        account: { select: { accountName: true } },
        _count: { select: { opportunities: true, orders: true } },
      },
      orderBy: { contactName: 'asc' },
    });
  }

  /**
   * Recherche globale de clients par email/téléphone (Chantier 6), sans filtre
   * de filiale — permet à un commercial de retrouver un client déjà créé dans
   * une autre filiale pour le rattacher à une nouvelle commande.
   */
  async searchGlobal(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.prisma.contact.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { contactName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        contactName: true,
        company: true,
        email: true,
        phone: true,
        subsidiaryId: true,
        subsidiary: { select: { subsidiaryName: true } },
      },
      take: 10,
    });
  }

  async findOne(id: string, user: User) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        salesRep: { select: { userName: true, email: true } },
        account: true,
        opportunities: { orderBy: { closeDate: 'desc' } },
        orders: { orderBy: { orderDate: 'desc' } },
        crmTasks: { orderBy: { dueDate: 'asc' } },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found.`);
    }

    // Vérifier que l'utilisateur a le droit de voir ce contact
    if (
      contact.subsidiaryId !== user.subsidiaryId ||
      (user.userRole === UserRole.COMMERCIAL && contact.salesRepId !== user.id) // Seul le commercial est restreint
    ) {
      throw new ForbiddenException('You are not allowed to view this contact.');
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, user: User) {
    // 1. Vérifier l'existence et les droits d'accès au contact.
    await this.findOne(id, user);

    // 2. Séparer les clés relationnelles et les champs non modifiables des autres données.
    const {
      accountId,
      salesRepId,
      id: dtoId, // Renommer pour éviter le conflit avec le paramètre 'id'
      _count,
      account,
      salesRep,
      subsidiaryId,
      ...otherData
    } = updateContactDto as any;

    // 3. Vérifier l'unicité de l'email si celui-ci est modifié (email globalement
    // unique, Chantier 6 — pas seulement au sein de la filiale).
    if (otherData.email) {
      const existing = await this.prisma.contact.findFirst({
        where: {
          email: otherData.email,
          id: { not: id },
        },
      });
      if (existing)
        throw new ConflictException(
          'This email is already in use by another contact.',
        );
    }

    // 4. Construire l'objet de données pour la mise à jour Prisma.
    const data: Prisma.ContactUpdateInput = { ...otherData };
    // Correction: S'assurer que le champ 'since' est un objet Date si fourni.
    if (data.since && typeof data.since === 'string') {
      data.since = new Date(data.since);
    }

    if (accountId !== undefined) {
      data.account = accountId
        ? { connect: { id: accountId } }
        : { disconnect: true };
    }
    if (salesRepId !== undefined) {
      data.salesRep = salesRepId
        ? { connect: { id: salesRepId } }
        : { disconnect: true };
    }

    // 5. Effectuer la mise à jour.
    return this.prisma.contact.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    return this.prisma.contact.delete({ where: { id } });
  }

  // --- Client (Contact) Authentication & Portal ---

  async register(registerContactDto: RegisterContactDto) {
    const { email, password, ...rest } = registerContactDto;

    const existingContact = await this.prisma.contact.findFirst({
      where: {
        email: email,
      },
    });

    if (existingContact) {
      throw new ConflictException(
        `A contact with email "${email}" already exists in this subsidiary.`,
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newContact = await this.prisma.contact.create({
      data: {
        ...rest,
        email,
        since: registerContactDto.since
          ? new Date(registerContactDto.since)
          : new Date(),
        status: ContactStatus.ACTIVE,
        passwordHash,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = newContact;
    return result;
  }

  async loginContact(contactLoginDto: ContactLoginDto) {
    const { email, password } = contactLoginDto;

    const contact = await this.prisma.contact.findUnique({
      where: { email },
    });

    if (!contact || !contact.passwordHash) {
      throw new UnauthorizedException(
        'Invalid credentials or portal access not enabled.',
      );
    }

    // Vérification du statut du compte
    if (contact.status !== ContactStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Your account is not active. Please contact support.',
      );
    }

    const isPasswordMatching = await bcrypt.compare(
      password,
      contact.passwordHash,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = {
      sub: contact.id,
      email: contact.email,
      type: 'contact', // Pour différencier d'un JWT d'employé
    };

    return {
      access_token: this.jwtService.sign(payload),
      contact: contact,
    };
  }

  async logoutContact() {
    // For stateless JWT, logout is a client-side operation (deleting the token).
    // This server endpoint is useful for consistency and potential future logging.
    return {
      message: 'Contact successfully logged out.',
    };
  }

  async getContactProfile(contact: any) {
    // Le guard et le décorateur fournissent l'objet contact.
    // On s'assure de ne pas renvoyer le hash du mot de passe.
    const { passwordHash, ...result } = contact;
    return result;
  }

  async getContactOrders(contactId: string) {
    // On part du contact pour trouver ses commandes, ce qui est plus robuste.
    const contactWithOrders = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        orders: {
          orderBy: { orderDate: 'desc' },
        },
      },
    });

    return contactWithOrders?.orders || [];
  }

  async resetContactPassword(contactId: string, user: User) {
    // Vérifier que le contact existe et que l'utilisateur a les droits
    const contact = await this.findOne(contactId, user);

    // Générer un nouveau mot de passe temporaire
    const tempPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Mettre à jour le contact avec le nouveau mot de passe
    const updatedContact = await this.prisma.contact.update({
      where: { id: contactId },
      data: {
        passwordHash,
        isVerified: true,
      },
    });

    // Envoyer un email avec le nouveau mot de passe
    await this.emailService.sendPasswordResetEmail(
      contact.email,
      tempPassword,
      contact.contactName,
    );

    return {
      ...updatedContact,
      tempPassword, // Retourner le mot de passe temporaire pour le développement
      message:
        'Mot de passe réinitialisé avec succès. Un email avec les nouveaux identifiants a été envoyé.',
    };
  }

  async enablePortalAccess(contactId: string, user: User) {
    // Vérifier que le contact existe et que l'utilisateur a les droits
    const contact = await this.findOne(contactId, user);

    if (contact.passwordHash) {
      throw new ConflictException(
        'Ce contact a déjà un accès au portail activé.',
      );
    }

    // Générer un mot de passe temporaire
    const tempPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Activer l'accès au portail
    const updatedContact = await this.prisma.contact.update({
      where: { id: contactId },
      data: {
        passwordHash,
        isVerified: true,
        status: ContactStatus.ACTIVE,
      },
    });

    // Envoyer un email avec les identifiants
    await this.emailService.sendWelcomeEmail(
      contact.email,
      tempPassword,
      contact.contactName,
    );

    return {
      ...updatedContact,
      tempPassword,
      message:
        'Accès au portail activé avec succès. Un email avec les identifiants de connexion a été envoyé.',
    };
  }

  /**
   * Récupère les informations publiques d'un contact (sans authentification).
   * @param id - L'ID du contact.
   * @returns Les informations de base du contact.
   */
  async findPublic(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: {
        id: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        company: true,
        status: true,
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found.`);
    }

    return contact;
  }
}
