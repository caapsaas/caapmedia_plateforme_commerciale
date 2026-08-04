import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { CurrentUser, Roles } from 'src/common/auth/role/role.decorator';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { RegisterContactDto } from './dto/register-contact.dto';
import { ContactLoginDto } from './dto/contact-login.dto';
import { ContactJwtAuthGuard } from 'src/common/auth/jwt/contact-jwt.guard';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@Controller('crm/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // --- Routes pour le portail client (publiques ou avec leur propre garde) ---

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerContact(@Body() registerContactDto: RegisterContactDto) {
    // Route publique pour l'auto-enregistrement d'un contact
    return this.contactsService.register(registerContactDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginContact(@Body() contactLoginDto: ContactLoginDto) {
    return this.contactsService.loginContact(contactLoginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logoutContact() {
    return this.contactsService.logoutContact();
  }

  @UseGuards(ContactJwtAuthGuard)
  @Get('profile')
  getContactProfile(@CurrentUser() contact: any) {
    // Note: Le guard doit être capable d'identifier un 'Contact'
    return this.contactsService.getContactProfile(contact);
  }

  @UseGuards(ContactJwtAuthGuard)
  @Get('orders')
  getContactOrders(
    @CurrentUser() contact: any,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    // Note: Le guard doit être capable d'identifier un 'Contact'
    return this.contactsService.getContactOrders(contact.id, paginationQuery);
  }

  // --- Routes existantes pour les employés (gardées) ---

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
  )
  create(
    @Body() createContactDto: CreateContactDto,
    @CurrentUser() user: User,
  ) {
    // Route interne pour la création de contact par un employé
    return this.contactsService.create(createContactDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
  )
  findAll(
    @CurrentUser() user: User,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('subsidiaryId') filterSubsidiaryId?: string,
    @Query('salesRepId') filterSalesRepId?: string,
  ) {
    return this.contactsService.findAll(
      user,
      paginationQuery,
      filterSubsidiaryId,
      filterSalesRepId,
    );
  }

  // Recherche globale (Chantier 6) : DOIT être déclarée avant ':id' pour que
  // Nest ne capture pas "search" comme un paramètre :id.
  @Get('search')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
  )
  searchGlobal(
    @Query('q') query: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.contactsService.searchGlobal(query, paginationQuery);
  }

  @Get('public/:id')
  // Endpoint public pour récupérer les informations de base d'un contact
  findPublic(@Param('id') id: string) {
    return this.contactsService.findPublic(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
  )
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contactsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
  )
  update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @CurrentUser() user: User,
  ) {
    return this.contactsService.update(id, updateContactDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
  )
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contactsService.remove(id, user);
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
  )
  @HttpCode(HttpStatus.OK)
  resetPassword(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contactsService.resetContactPassword(id, user);
  }

  @Post(':id/enable-portal')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
  )
  @HttpCode(HttpStatus.OK)
  enablePortalAccess(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contactsService.enablePortalAccess(id, user);
  }
}
