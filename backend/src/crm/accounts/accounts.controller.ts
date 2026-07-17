import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  } from '@nestjs/common';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { CurrentUser, Roles } from 'src/common/auth/role/role.decorator';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
//import { ApiTags } from '@nestjs/swagger';

@Controller('crm/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  create(@Body() createAccountDto: CreateAccountDto, @CurrentUser() user: User) {
    // Si un utilisateur est connecté, le service l'utilisera pour assigner le commercial et la filiale.
    // Le DTO peut toujours contenir un subsidiaryId pour les admins créant des comptes dans d'autres filiales.
    return this.accountsService.create(createAccountDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  findAll(@CurrentUser() user: User) {
    return this.accountsService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.accountsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto, @CurrentUser() user: User) {
    return this.accountsService.update(id, updateAccountDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.accountsService.remove(id, user);
  }
}


