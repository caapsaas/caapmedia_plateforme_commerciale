import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete, Query } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import type { User } from '@prisma/client';
import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { UpdateTreasuryAccountDto } from './dto/update-treasury-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';


@UseGuards(JwtAuthGuard)
@Controller('finance/treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  // --- Treasury Accounts Routes ---
  @Post('accounts')
  createAccount(@Body() createDto: CreateTreasuryAccountDto, @CurrentUser() user: User) {
    return this.treasuryService.createAccount(createDto, user);
  }

  @Get('accounts')
  findAllAccounts(@CurrentUser() user: User, @Query('subsidiaryId') subsidiaryId?: string) {
    return this.treasuryService.findAllAccounts(user, subsidiaryId);
  }

  @Get('accounts/:id')
  findOneAccount(@Param('id') id: string, @CurrentUser() user: User) {
    return this.treasuryService.findOneAccount(id, user);
  }

  @Patch('accounts/:id')
  updateAccount(@Param('id') id: string, @Body() updateDto: UpdateTreasuryAccountDto, @CurrentUser() user: User) {
    return this.treasuryService.updateAccount(id, updateDto, user);
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id') id: string, @CurrentUser() user: User) {
    return this.treasuryService.deleteAccount(id, user);
  }

  // --- Income and Expense Transaction Routes ---
  @Post('incomes')
  createIncomeTransaction(@Body() createDto: CreateFinancialTransactionDto, @CurrentUser() user: User) {
    return this.treasuryService.createIncomeTransaction(createDto, user);
  }

  @Post('expenses')
  createExpenseTransaction(@Body() createDto: CreateFinancialTransactionDto, @CurrentUser() user: User) {
    return this.treasuryService.createExpenseTransaction(createDto, user);
  }

  @Get('transactions')
  findAllTransactions(@CurrentUser() user: User, @Query('subsidiaryId') subsidiaryId?: string) {
    return this.treasuryService.findAllTransactions(user, subsidiaryId);
  }


  @Delete('transactions/:id')
  deleteTransaction(@Param('id') id: string, @CurrentUser() user: User) {
    return this.treasuryService.deleteTransaction(id, user);
  }
}
