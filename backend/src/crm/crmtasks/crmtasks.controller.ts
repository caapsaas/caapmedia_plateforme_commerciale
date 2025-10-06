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
import { CrmtasksService } from './crmtasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('crm/tasks')
export class CrmtasksController {
  constructor(private readonly crmtasksService: CrmtasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
    return this.crmtasksService.create(createTaskDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.crmtasksService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.crmtasksService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @CurrentUser() user: User) {
    return this.crmtasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.crmtasksService.remove(id, user);
  }
}