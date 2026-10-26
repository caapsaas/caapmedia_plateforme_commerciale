import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProformasService } from './proformas.service';
import { CreateProformaDto } from './dto/create-proforma.dto';
import { UpdateProformaDto } from './dto/update-proforma.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { CurrentUser, Roles } from '../../common/auth/role/role.decorator';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { UserRole, ProformaStatus } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@Controller('crm/proformas')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.COMMERCIAL,
  UserRole.SECRETARY,
  UserRole.FINANCIAL_DIRECTOR,
)
export class ProformasController {
  constructor(private readonly proformasService: ProformasService) {}

  @Post()
  create(
    @Body() createProformaDto: CreateProformaDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.proformasService.create(createProformaDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('status') status?: ProformaStatus,
  ) {
    return this.proformasService.findAll(user, paginationQuery, status);
  }

  @Get('status-counts')
  getStatusCounts(@CurrentUser() user: JwtUser) {
    return this.proformasService.getStatusCounts(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.proformasService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProformaDto: UpdateProformaDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.proformasService.update(id, updateProformaDto, user);
  }

  @Post(':id/send')
  send(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.proformasService.send(id, user);
  }

  @Post(':id/mark-viewed')
  markAsViewed(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.proformasService.markAsViewed(id, user);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.proformasService.accept(id, user);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.proformasService.reject(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.proformasService.remove(id, user);
  }
}
