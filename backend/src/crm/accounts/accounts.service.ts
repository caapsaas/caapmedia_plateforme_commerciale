import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Prisma, User, UserRole } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto, user: User) {
    // Déterminer l'ID de la filiale. Il doit être fourni soit par l'utilisateur connecté, soit dans le DTO.
    const subsidiaryId = user.subsidiaryId || createAccountDto.subsidiaryId;

    if (!subsidiaryId) {
      throw new BadRequestException(
        'Subsidiary ID must be provided either by being logged in or in the request body.',
      );
    }

    // Vérifier que la filiale existe
    const subsidiaryExists = await this.prisma.subsidiary.findUnique({
      where: { id: subsidiaryId },
    });
    if (!subsidiaryExists) {
      throw new NotFoundException(
        `Subsidiary with ID "${subsidiaryId}" not found.`,
      );
    }

    // Vérifier si un compte avec le même nom existe déjà dans la filiale
    const existingAccount = await this.prisma.account.findUnique({
      where: {
        accountName_subsidiaryId: {
          accountName: createAccountDto.accountName,
          subsidiaryId: subsidiaryId,
        },
      },
    });

    if (existingAccount) {
      throw new ConflictException(
        `An account with the name "${createAccountDto.accountName}" already exists in this subsidiary.`,
      );
    }

    return this.prisma.account.create({
      data: {
        id: generateId(ID_PREFIXES.ACCOUNT),
        ...createAccountDto,
        subsidiaryId: subsidiaryId,
      },
    });
  }

  async findAll(user: User) {
    const isSuperAdmin = user.userRole === UserRole.SUPER_ADMIN;
    const where: Prisma.AccountWhereInput = isSuperAdmin
      ? {}
      : { subsidiaryId: user.subsidiaryId };

    if (!isSuperAdmin && user.userRole === UserRole.COMMERCIAL) {
      where.salesRepId = user.id;
    }

    return this.prisma.account.findMany({
      where,
      include: {
        salesRep: { select: { userName: true } },
        _count: { select: { contacts: true, opportunities: true } },
      },
      orderBy: { accountName: 'asc' },
    });
  }

  async findOne(id: string, user: User) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        salesRep: { select: { userName: true, email: true } },
        contacts: { orderBy: { contactName: 'asc' } },
        opportunities: { orderBy: { closeDate: 'desc' } },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${id}" not found.`);
    }

    // Vérifier que l'utilisateur a le droit de voir ce compte
    if (
      account.subsidiaryId !== user.subsidiaryId ||
      (user.userRole === UserRole.COMMERCIAL && // Seul le commercial est restreint
        account.salesRepId !== user.id)
    ) {
      throw new ForbiddenException('You are not allowed to view this account.');
    }

    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto, user: User) {
    // 1. Vérifier l'existence et les droits d'accès au compte.
    const accountToUpdate = await this.findOne(id, user);

    // 2. Séparer salesRepId des autres données pour le traitement relationnel.
    const {
      salesRepId,
      id: dtoId,
      _count,
      ...otherData
    } = updateAccountDto as any; // Cast to any to safely destructure unknown properties

    // 3. Vérifier l'unicité du nom du compte si celui-ci est modifié.
    if (otherData.accountName) {
      const existingAccount = await this.prisma.account.findUnique({
        where: {
          accountName_subsidiaryId: {
            accountName: otherData.accountName,
            subsidiaryId: accountToUpdate.subsidiaryId,
          },
        },
      });
      if (existingAccount && existingAccount.id !== id) {
        throw new ConflictException(
          `An account with the name "${otherData.accountName}" already exists in this subsidiary.`,
        );
      }
    }

    // 4. Construire l'objet de données pour la mise à jour Prisma.
    const data: Prisma.AccountUpdateInput = { ...otherData };
    if (salesRepId !== undefined) {
      data.salesRep = salesRepId
        ? { connect: { id: salesRepId } }
        : { disconnect: true };
    }

    // 5. Effectuer la mise à jour.
    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    return this.prisma.account.delete({ where: { id } });
  }
}
