import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

// Banque physique (institution) référencée par les comptes de trésorerie de
// type BANQUE — pas de portée filiale : une banque est un tiers global,
// comme sur gmo (Backend_GMO/src/finance/bank). Les comptes bancaires qui la
// référencent sont, eux, toujours rattachés à la filiale siège (voir
// TreasuryService.createAccount).
@Injectable()
export class BankService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBankDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to create banks.',
    );

    const existing = await this.prisma.bank.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Une banque nommée "${dto.name}" existe déjà.`,
      );
    }

    return this.prisma.bank.create({
      data: { id: generateId(ID_PREFIXES.BANK), ...dto },
    });
  }

  async findAll() {
    return this.prisma.bank.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const bank = await this.prisma.bank.findUnique({ where: { id } });
    if (!bank) {
      throw new NotFoundException(`Banque avec l'ID "${id}" introuvable.`);
    }
    return bank;
  }

  async update(id: string, dto: UpdateBankDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to update banks.',
    );
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.bank.findUnique({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Une banque nommée "${dto.name}" existe déjà.`,
        );
      }
    }

    return this.prisma.bank.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to delete banks.',
    );

    const bank = await this.prisma.bank.findUnique({
      where: { id },
      include: { _count: { select: { accounts: true } } },
    });
    if (!bank) {
      throw new NotFoundException(`Banque avec l'ID "${id}" introuvable.`);
    }
    if (bank._count.accounts > 0) {
      throw new BadRequestException(
        `Impossible de supprimer "${bank.name}" : ${bank._count.accounts} compte(s) de trésorerie la référencent encore.`,
      );
    }

    return this.prisma.bank.delete({ where: { id } });
  }
}
