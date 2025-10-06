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

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto, user?: User) {
    // Déterminer l'ID de la filiale. Il doit être fourni soit par l'utilisateur connecté, soit dans le DTO.
    const subsidiaryId = user?.subsidiaryId || createAccountDto.subsidiaryId;

    if (!subsidiaryId) {
      throw new BadRequestException(
        'Subsidiary ID must be provided either by being logged in or in the request body.',
      );
    }

    // Vérifier que la filiale existe
    const subsidiaryExists = await this.prisma.subsidiary.findUnique({ where: { id: subsidiaryId } });
    if (!subsidiaryExists) {
      throw new NotFoundException(`Subsidiary with ID "${subsidiaryId}" not found.`);
    }

    if (!createAccountDto.accountName) {
      throw new BadRequestException('Account name is required to create an account.');
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
        ...createAccountDto,
        subsidiaryId: subsidiaryId,
        // Si un employé crée le compte, il lui est assigné par défaut.
        salesRepId: user?.id,
      },
    });
  }

  async findAll(user: User) {
    const where: Prisma.AccountWhereInput = {
      subsidiaryId: user.subsidiaryId,
    };

    // Un commercial ne voit que les comptes qui lui sont assignés.
    // Un admin voit tous les comptes de la filiale.
    if (user.userRole === UserRole.COMMERCIAL) {
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
      (user.userRole === UserRole.COMMERCIAL && account.salesRepId !== user.id)
    ) {
      throw new ForbiddenException('You are not allowed to view this account.');
    }

    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    return this.prisma.account.update({
      where: { id },
      data: updateAccountDto,
    });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    return this.prisma.account.delete({ where: { id } });
  }
}
