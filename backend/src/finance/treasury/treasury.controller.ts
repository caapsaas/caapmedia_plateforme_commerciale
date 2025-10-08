import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import type { User } from '@prisma/client';
import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';

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
  findAllAccounts(@CurrentUser() user: User) {
    return this.treasuryService.findAllAccounts(user);
  }

  // --- Financial Transactions Routes ---
  @Post('transactions')
  createTransaction(@Body() createDto: CreateFinancialTransactionDto, @CurrentUser() user: User) {
    return this.treasuryService.createTransaction(createDto, user);
  }

  @Get('transactions')
  findAllTransactions(@CurrentUser() user: User) {
    return this.treasuryService.findAllTransactions(user);
  }

  @Patch('transactions/:id/status')
  updateTransactionStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateFinancialTransactionDto,
    @CurrentUser() user: User,
  ) {
    return this.treasuryService.updateTransactionStatus(id, updateDto, user);
  }
}
