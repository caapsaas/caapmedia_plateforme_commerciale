import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { User, UserRole, Prisma } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContractDto: CreateContractDto, user: User) {
    // Assurer que le client appartient à la même filiale
    const client = await this.prisma.contact.findUnique({
      where: { id: createContractDto.clientId },
    });
    if (!client || client.subsidiaryId !== user.subsidiaryId) {
      throw new ForbiddenException(
        'Client not found or does not belong to your subsidiary.',
      );
    }

    return this.prisma.contract.create({
      data: {
        ...createContractDto,
        // Convertir les chaînes de dates en objets Date pour Prisma
        startDate: new Date(createContractDto.startDate),
        endDate: new Date(createContractDto.endDate),
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAll(user: User) {
    const isSuperAdmin = user.userRole === UserRole.SUPER_ADMIN;
    const where: Prisma.ContractWhereInput = isSuperAdmin
      ? {}
      : { subsidiaryId: user.subsidiaryId };

    if (!isSuperAdmin && user.userRole === UserRole.COMMERCIAL) {
      where.client = { salesRepId: user.id };
    }

    return this.prisma.contract.findMany({
      where,
      include: {
        client: true, // Inclure les informations du client
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findOne(id: string, user: User) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID "${id}" not found.`);
    }

    // Vérifier que l'utilisateur a le droit de voir ce contrat
    if (contract.subsidiaryId !== user.subsidiaryId) {
      throw new ForbiddenException(
        'You are not allowed to view this contract.',
      );
    }

    return contract;
  }

  async update(id: string, updateContractDto: UpdateContractDto, user: User) {
    // 1. Vérifier que le contrat existe et que l'utilisateur a les droits.
    await this.findOne(id, user);

    // 2. Séparer les clés relationnelles et les champs non modifiables des autres données.
    const {
      clientId,
      startDate,
      endDate,
      // Exclure les champs non modifiables
      id: dtoId,
      client,
      subsidiaryId,
      ...otherData
    } = updateContractDto as any;

    // 3. Construire l'objet de données pour la mise à jour Prisma.
    const data: Prisma.ContractUpdateInput = { ...otherData };
    if (clientId) data.client = { connect: { id: clientId } };
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);

    // 4. Effectuer la mise à jour.
    return this.prisma.contract.update({ where: { id }, data });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les permissions
    return this.prisma.contract.delete({ where: { id } });
  }
}
