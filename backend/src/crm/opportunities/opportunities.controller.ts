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
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { CurrentUser, Roles } from 'src/common/auth/role/role.decorator';
import { type User, UserRole } from '@prisma/client';
import { RoleGuard } from 'src/common/auth/role/role.guard';

@Controller('crm/opportunities')
@UseGuards(JwtAuthGuard, RoleGuard)
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  create(
    @Body() createOpportunityDto: CreateOpportunityDto,
    @CurrentUser() user: User,
  ) {
    return this.opportunitiesService.create(createOpportunityDto, user);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findAll(@CurrentUser() user: User) {
    return this.opportunitiesService.findAll(user);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.opportunitiesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOpportunityDto: UpdateOpportunityDto,
    @CurrentUser() user: User,
  ) {
    return this.opportunitiesService.update(id, updateOpportunityDto, user);
  }

  @Delete(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.opportunitiesService.remove(id, user);
  }
}


