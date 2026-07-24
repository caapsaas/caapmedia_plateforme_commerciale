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
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import type { User } from '@prisma/client';

@Controller('crm/contracts')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY)
  create(
    @Body() createContractDto: CreateContractDto,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.create(createContractDto, user);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findAll(@CurrentUser() user: User) {
    return this.contractsService.findAll(user);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.contractsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContractDto: UpdateContractDto,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.update(id, updateContractDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.contractsService.remove(id, user);
  }
}
