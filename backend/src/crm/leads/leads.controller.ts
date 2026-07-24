// src/crm/leads/leads.controller.ts
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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { PublicQuoteRequestDto } from './dto/public-quote-request.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser, Roles } from '../../common/auth/role/role.decorator';
import { type User, UserRole } from '@prisma/client';
import { RoleGuard } from 'src/common/auth/role/role.guard';

@Controller('crm/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('quote-request')
  createPublicQuoteRequest(@Body() publicQuoteRequestDto: PublicQuoteRequestDto) {
    return this.leadsService.createPublicLead(publicQuoteRequestDto);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: User) {
    return this.leadsService.create(createLeadDto, user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findAll(@CurrentUser() user: User) {
    return this.leadsService.findAll(user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leadsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: User,
  ) {
    return this.leadsService.update(id, updateLeadDto);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Delete(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leadsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post(':id/convert')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  convert(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leadsService.convert(id, user);
  }
}


