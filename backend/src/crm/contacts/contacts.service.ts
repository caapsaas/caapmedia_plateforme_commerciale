import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ContactLoginDto } from './dto/contact-login.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async create(createContactDto: CreateContactDto) {
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        email: createContactDto.email,
        subsidiaryId: createContactDto.subsidiaryId,
      },
    });

    if (existingContact) {
      throw new ConflictException(
        `A contact with email "${createContactDto.email}" already exists in this subsidiary.`,
      );
    }

    // Générer un mot de passe temporaire pour le portail client
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    return this.prisma.contact.create({
      data: {
        ...createContactDto,
        since: new Date(),
        passwordHash,
      },
    });
  }

  async findAll(user: User) {
    const where: Prisma.ContactWhereInput = {
      subsidiaryId: user.subsidiaryId,
    };

    // Si l'utilisateur est un commercial, il ne voit que ses propres contacts
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
      (user.userRole === UserRole.COMMERCIAL && contact.salesRepId !== user.id)
    ) {
      throw new ForbiddenException('You are not allowed to view this contact.');
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits

    if (updateContactDto.email) {
      const existing = await this.prisma.contact.findFirst({
        where: { email: updateContactDto.email, id: { not: id }, subsidiaryId: user.subsidiaryId },
      });
      if (existing) throw new ConflictException('This email is already in use by another contact.');
    }

    return this.prisma.contact.update({
      where: { id },
      data: updateContactDto,
    });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    return this.prisma.contact.delete({ where: { id } });
  }

  // --- Client (Contact) Authentication & Portal ---

  async loginContact(contactLoginDto: ContactLoginDto) {
    const { email, password } = contactLoginDto;

    const contact = await this.prisma.contact.findUnique({
      where: { email },
    });

    if (!contact || !contact.passwordHash) {
      throw new UnauthorizedException('Invalid credentials or portal access not enabled.');
    }

    const isPasswordMatching = await bcrypt.compare(password, contact.passwordHash);

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
}
