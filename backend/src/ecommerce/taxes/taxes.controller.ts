import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/create-taxe.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Controller('ecommerce/taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createTaxDto: CreateTaxDto) {
    return this.taxesService.create(createTaxDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.taxesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.taxesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateTaxDto: UpdateTaxDto) {
    return this.taxesService.update(id, updateTaxDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.taxesService.remove(id);
  }
}
