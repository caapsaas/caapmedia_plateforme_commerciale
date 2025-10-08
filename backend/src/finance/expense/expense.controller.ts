import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser } from '../../common/auth/role/role.decorator';
import type { User }  from '@prisma/client';


@UseGuards(JwtAuthGuard)
@Controller('finance/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser() user: User) {
    return this.expensesService.create(createExpenseDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.expensesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.expensesService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto, @CurrentUser() user: User) {
    return this.expensesService.update(id, updateExpenseDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.expensesService.remove(id, user);
  }
}
