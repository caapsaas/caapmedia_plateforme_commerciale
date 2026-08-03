import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CrmtasksService } from './crmtasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { CurrentUser, Roles } from 'src/common/auth/role/role.decorator';
import { type User, UserRole } from '@prisma/client';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@Controller('crm/tasks')
@UseGuards(JwtAuthGuard, RoleGuard)
export class CrmtasksController {
  constructor(private readonly crmtasksService: CrmtasksService) {}

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
    return this.crmtasksService.create(createTaskDto, user);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findAll(@CurrentUser() user: User, @Query() paginationQuery: PaginationQueryDto) {
    return this.crmtasksService.findAll(user, paginationQuery);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.crmtasksService.findOne(id, user);
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
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.crmtasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.crmtasksService.remove(id, user);
  }

  @Patch(':id/status')
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.SECRETARY,
    UserRole.FINANCIAL_DIRECTOR,
  )
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.crmtasksService.updateStatus(
      id,
      updateTaskStatusDto.status,
      user,
    );
  }
}
