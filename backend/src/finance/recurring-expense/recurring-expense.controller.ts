import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecurringExpenseService } from './recurring-expense.service';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance/recurring-expenses')
export class RecurringExpenseController {
  constructor(
    private readonly recurringExpenseService: RecurringExpenseService,
  ) {}

  @Post()
  create(
    @Body() createDto: CreateRecurringExpenseDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.recurringExpenseService.create(createDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.recurringExpenseService.findAll(user, paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.recurringExpenseService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRecurringExpenseDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.recurringExpenseService.update(id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.recurringExpenseService.remove(id, user);
  }
}
