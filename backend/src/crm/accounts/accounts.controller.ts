import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
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
  // Le guard est retiré pour rendre la route publique.
  // L'utilisateur est optionnel : il sera présent si un employé est connecté, sinon undefined.
  create(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() user?: User,
  ) {
    return this.accountsService.create(createAccountDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  findAll(@CurrentUser() user: User) {
    return this.accountsService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.accountsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAccountDto: UpdateAccountDto, @CurrentUser() user: User) {
    return this.accountsService.update(id, updateAccountDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.accountsService.remove(id, user);
  }
}
