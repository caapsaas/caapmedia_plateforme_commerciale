import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
  Query,
} from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { CurrentUser, Roles } from 'src/common/auth/role/role.decorator';

import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { UpdateTreasuryAccountDto } from './dto/update-treasury-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { CounterpartyType, UserRole } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';

// Aucune restriction de rôle n'existait ici avant (JwtAuthGuard seul) :
// n'importe quel utilisateur authentifié (caissier, RH...) pouvait lire les
// soldes/transactions de trésorerie en appelant l'API directement, même sans
// passer par la sidebar. Consommateurs frontend vérifiés (Configuration,
// Analytics, Disbursement, Finance) : tous déjà réservés à
// ADMIN/SUPER_ADMIN/FINANCIAL_DIRECTOR — aucun rôle légitime exclu ici.
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR)
@Controller('finance/treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  // --- Treasury Accounts Routes ---
  @Post('accounts')
  createAccount(
    @Body() createDto: CreateTreasuryAccountDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.treasuryService.createAccount(createDto, user);
  }

  @Get('accounts')
  findAllAccounts(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    return this.treasuryService.findAllAccounts(user, subsidiaryId);
  }

  @Get('accounts/:id')
  findOneAccount(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.treasuryService.findOneAccount(id, user);
  }

  @Patch('accounts/:id')
  updateAccount(
    @Param('id') id: string,
    @Body() updateDto: UpdateTreasuryAccountDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.treasuryService.updateAccount(id, updateDto, user);
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.treasuryService.deleteAccount(id, user);
  }

  // --- Income and Expense Transaction Routes ---
  @Post('incomes')
  createIncomeTransaction(
    @Body() createDto: CreateFinancialTransactionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.treasuryService.createIncomeTransaction(createDto, user);
  }

  @Post('expenses')
  createExpenseTransaction(
    @Body() createDto: CreateFinancialTransactionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.treasuryService.createExpenseTransaction(createDto, user);
  }

  // --- Décaissement typé (Coffre-fort / Banque / Caisse dépense) + virement ---
  @Post('disbursement')
  createDisbursement(
    @Body() createDto: CreateDisbursementDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.treasuryService.createDisbursement(createDto, user);
  }

  @Get('counterparties')
  findAllCounterparties(
    @CurrentUser() user: JwtUser,
    @Query('type') type?: CounterpartyType,
  ) {
    return this.treasuryService.findAllCounterparties(user, type);
  }

  @Get('cashiers')
  findEligibleCashiers(@CurrentUser() user: JwtUser) {
    return this.treasuryService.findEligibleCashiers(user);
  }

  @Get('accounts/:id/transactions')
  findAccountTransactions(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.treasuryService.findAccountTransactions(
      id,
      user,
      paginationQuery,
      startDate,
      endDate,
    );
  }

  @Get('transactions')
  findAllTransactions(
    @CurrentUser() user: JwtUser,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    return this.treasuryService.findAllTransactions(
      user,
      subsidiaryId,
      paginationQuery,
    );
  }

  @Delete('transactions/:id')
  deleteTransaction(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.treasuryService.deleteTransaction(id, user);
  }

  @Patch('transaction/:id/status')
  updateTransactionStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionStatusDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.treasuryService.updateTransactionStatus(id, updateDto, user);
  }
}
