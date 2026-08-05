import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import type { User } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@Controller('crm/interactions')
@UseGuards(JwtAuthGuard, RoleGuard)
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY)
  create(
    @Body() createInteractionDto: CreateInteractionDto,
    @CurrentUser() user: User,
  ) {
    return this.interactionsService.create(createInteractionDto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY)
  findAll(
    @CurrentUser() user: User,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.interactionsService.findAll(user, paginationQuery);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInteractionDto: UpdateInteractionDto,
    @CurrentUser() user: User,
  ) {
    return this.interactionsService.update(id, updateInteractionDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.SECRETARY)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.interactionsService.remove(id, user);
  }
}
