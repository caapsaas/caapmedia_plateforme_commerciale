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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExpensesService } from './expense.service';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { PayExpenseDto } from './dto/pay-expense.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.expensesService.create(createExpenseDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    return this.expensesService.findAll(user, paginationQuery, subsidiaryId);
  }

  @Get('payable')
  findPayable(
    @CurrentUser() user: JwtUser,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.expensesService.findPayable(user, pagination);
  }

  @Post(':id/proof')
  @UseInterceptors(FileInterceptor('file'))
  attachProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
  ) {
    return this.expensesService.attachProof(id, file, user);
  }

  @Patch(':id/confirm-invoice')
  confirmInvoice(
    @Param('id') id: string,
    @Body() dto: { amount: number; description?: string; expenseDate?: string },
    @CurrentUser() user: JwtUser,
  ) {
    return this.expensesService.confirmInvoice(id, dto, user);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.expensesService.approve(id, user);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @CurrentUser() user: JwtUser,
  ) {
    return this.expensesService.reject(id, dto?.reason, user);
  }

  @Post(':id/pay')
  pay(
    @Param('id') id: string,
    @Body() dto: PayExpenseDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.expensesService.pay(id, dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.expensesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.expensesService.update(id, updateExpenseDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.expensesService.remove(id, user);
  }
}
