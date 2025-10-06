// src/crm/leads/leads.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser } from '../../common/auth/role/role.decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtAuthGuard) // Protège toutes les routes de ce contrôleur
@Controller('crm/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: User) {
    return this.leadsService.create(createLeadDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.leadsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.leadsService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto, @CurrentUser() user: User) {
    return this.leadsService.update(id, updateLeadDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.leadsService.remove(id, user);
  }

  @Post(':id/convert')
  convert(@Param('id') id: string, @CurrentUser() user: User) {
    return this.leadsService.convert(id, user);
  }
}
