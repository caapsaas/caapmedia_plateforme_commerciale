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
import {  UserRole } from '@prisma/client';
import { ContactLoginDto } from './dto/contact-login.dto';

@Controller('crm/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // --- Routes pour le portail client (publiques ou avec leur propre garde) ---

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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getContactProfile(@CurrentUser() contact: any) {
    // Note: Le guard doit être capable d'identifier un 'Contact'
    return this.contactsService.getContactProfile(contact);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  getContactOrders(@CurrentUser() contact: any) {
    // Note: Le guard doit être capable d'identifier un 'Contact'
    return this.contactsService.getContactOrders(contact.id);
  }


  // --- Routes existantes pour les employés (gardées) ---

  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    // This endpoint is now public and does not require authentication.
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  findAll(@CurrentUser() user: User) {
    return this.contactsService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.contactsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateContactDto: UpdateContactDto,
    @CurrentUser() user: User,
  ) {
    return this.contactsService.update(id, updateContactDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.contactsService.remove(id, user);
  }
}
