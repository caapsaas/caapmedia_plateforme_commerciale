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

@Controller('crm/proformas')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY, UserRole.FINANCIAL_DIRECTOR)
export class ProformasController {
  constructor(private readonly proformasService: ProformasService) {}

  @Post()
  create(@Body() createProformaDto: CreateProformaDto, @CurrentUser() user: User) {
    return this.proformasService.create(createProformaDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query('status') status?: ProformaStatus) {
    return this.proformasService.findAll(user.subsidiaryId, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.proformasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProformaDto: UpdateProformaDto,
  ) {
    return this.proformasService.update(id, updateProformaDto);
  }

  @Post(':id/send')
  send(@Param('id', ParseUUIDPipe) id: string) {
    return this.proformasService.send(id);
  }

  @Post(':id/mark-viewed')
  markAsViewed(@Param('id', ParseUUIDPipe) id: string) {
    return this.proformasService.markAsViewed(id);
  }

  @Post(':id/accept')
  accept(@Param('id', ParseUUIDPipe) id: string) {
    return this.proformasService.accept(id);
  }

  @Post(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.proformasService.reject(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.proformasService.remove(id);
  }
}
