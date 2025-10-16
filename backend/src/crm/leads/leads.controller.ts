// src/crm/leads/leads.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser, Roles } from '../../common/auth/role/role.decorator';
import { type User, UserRole } from '@prisma/client';
import { RoleGuard } from 'src/common/auth/role/role.guard';

@Controller('crm/leads')
@UseGuards(JwtAuthGuard, RoleGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: User) {
    return this.leadsService.create(createLeadDto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  findAll(@CurrentUser() user: User) {
    return this.leadsService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leadsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateLeadDto: UpdateLeadDto, @CurrentUser() user: User) {
    return this.leadsService.update(id, updateLeadDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leadsService.remove(id, user);
  }

  @Post(':id/convert')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
  convert(@Param('id') id: string, @CurrentUser() user: User) {
    return this.leadsService.convert(id, user);
  }
}
