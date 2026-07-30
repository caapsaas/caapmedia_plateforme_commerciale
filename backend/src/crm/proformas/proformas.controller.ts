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
import type { User } from '@prisma/client';
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
    @CurrentUser() user: User,
  ) {
    return this.proformasService.create(createProformaDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('status') status?: ProformaStatus,
  ) {
    return this.proformasService.findAll(
      user.subsidiaryId,
      paginationQuery,
      status,
    );
  }

  @Get('status-counts')
  getStatusCounts(@CurrentUser() user: User) {
    return this.proformasService.getStatusCounts(user.subsidiaryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proformasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProformaDto: UpdateProformaDto,
  ) {
    return this.proformasService.update(id, updateProformaDto);
  }

  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.proformasService.send(id);
  }

  @Post(':id/mark-viewed')
  markAsViewed(@Param('id') id: string) {
    return this.proformasService.markAsViewed(id);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string) {
    return this.proformasService.accept(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.proformasService.reject(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.proformasService.remove(id);
  }
}
