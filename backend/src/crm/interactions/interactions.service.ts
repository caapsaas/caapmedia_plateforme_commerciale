import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { User, UserRole, Prisma } from '@prisma/client';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInteractionDto: CreateInteractionDto, user: User) {
    // Vérifier que le contact existe et appartient à la même filiale
    const contact = await this.prisma.contact.findUnique({
      where: { id: createInteractionDto.contactId },
    });

    if (!contact || contact.subsidiaryId !== user.subsidiaryId) {
      throw new ForbiddenException(
        'Contact not found or does not belong to your subsidiary.',
      );
    }

    return this.prisma.interaction.create({
      data: {
        id: generateId(ID_PREFIXES.INTERACTION),
        notes: createInteractionDto.notes,
        contactId: createInteractionDto.contactId,
        userId: user.id,
        typeInteractions: createInteractionDto.type, // Mapper 'type' du DTO vers 'typeInteractions' du modèle
        interactionDate: new Date(), // Ajouter la date de l'interaction
      },
    });
  }

  async findAll(user: User) {
    const isSuperAdmin = user.userRole === UserRole.SUPER_ADMIN;
    const contactWhere: Prisma.ContactWhereInput = isSuperAdmin
      ? {}
      : { subsidiaryId: user.subsidiaryId };

    if (!isSuperAdmin && user.userRole === UserRole.COMMERCIAL) {
      contactWhere.salesRepId = { equals: user.id };
    }

    const where: Prisma.InteractionWhereInput = {
      contact: contactWhere,
    };

    return this.prisma.interaction.findMany({
      where: where, // Propriété explicite pour éviter l'erreur de shorthand
      include: {
        user: {
          select: {
            // Sélection de champs existants dans User (ajustez selon votre schéma Prisma)
            id: true,
            email: true, // Ou 'firstName', 'lastName' si disponibles
          },
        },
        contact: { select: { contactName: true } }, // Inclure le nom du contact
      },
      orderBy: {
        interactionDate: 'desc',
      },
    });
  }

  async findOne(id: string, user: User) {
    const interaction = await this.prisma.interaction.findUnique({
      where: { id },
      include: {
        contact: true, // Nécessaire pour les vérifications de permissions
      },
    });

    if (!interaction) {
      throw new NotFoundException(`Interaction with ID "${id}" not found.`);
    }

    // Vérifier que l'interaction appartient à la filiale de l'utilisateur
    if (interaction.contact.subsidiaryId !== user.subsidiaryId) {
      // Lancer NotFound pour ne pas révéler l'existence de la ressource
      throw new NotFoundException(`Interaction with ID "${id}" not found.`);
    }

    // Un commercial ne peut voir que les interactions liées à ses propres contacts
    if (
      user.userRole === UserRole.COMMERCIAL &&
      interaction.contact.salesRepId !== user.id
    ) {
      throw new ForbiddenException(
        'You are not allowed to view this interaction.',
      );
    }

    return interaction;
  }

  async remove(id: string, user: User) {
    const interaction = await this.findOne(id, user); // Vérifie l'existence et l'appartenance

    // Seul l'admin ou le créateur de l'interaction peut la supprimer
    if (user.userRole !== UserRole.ADMIN && interaction.userId !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to delete this interaction.',
      );
    }

    return this.prisma.interaction.delete({ where: { id } });
  }

  async update(
    id: string,
    updateInteractionDto: UpdateInteractionDto,
    user: User,
  ) {
    // findOne vérifie que l'utilisateur a le droit de voir l'interaction.
    await this.findOne(id, user);
    return this.prisma.interaction.update({
      where: { id },
      data: updateInteractionDto,
    });

    // Mapper explicitement les champs du DTO pour éviter les erreurs de type.
    const dataToUpdate: Prisma.InteractionUpdateInput = {};
    if (updateInteractionDto.notes !== undefined) {
      dataToUpdate.notes = updateInteractionDto.notes;
    }
    if (updateInteractionDto.type !== undefined) {
      dataToUpdate.typeInteractions = updateInteractionDto.type;
    }
    // On ne permet pas de changer le contactId d'une interaction existante.

    return this.prisma.interaction.update({
      where: { id },
      data: dataToUpdate,
    });
  }
}
