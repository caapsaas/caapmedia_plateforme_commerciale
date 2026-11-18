import {
  Controller,
  NotFoundException,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
  Query,
} from '@nestjs/common';
import { PrefinancementService } from './prefinancement.service';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { ActiveRoles, CurrentUser } from 'src/common/auth/role/role.decorator';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { UserRole } from '@prisma/client';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { financeSubsidiaryId } from '../finance-scope';
import { FindPrefinancementTransactionsDto } from './dto/find-prefinancement-transactions.dto';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('finance/prefinancement')
export class PrefinancementController {
  constructor(private readonly prefenancementService: PrefinancementService) {}

  // --- Account Routes ---
  @ActiveRoles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  @Post('account')
  createAccount(
    @Body()
    createDto: {
      accountName: string;
      initialBalance?: number;
      subsidiaryId: string;
    },
    @CurrentUser() user: JwtUser,
  ) {
    return this.prefenancementService.createAccount({
      ...createDto,
      subsidiaryId: user.subsidiaryId,
    });
  }

  @Get('account')
  findAccount(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    return this.prefenancementService.findAccount(
      financeSubsidiaryId(user, subsidiaryId ?? user.subsidiaryId),
    );
  }

  @ActiveRoles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  @Patch('account')
  async updateAccount(
    @Body()
    updateDto: {
      accountName?: string;
      initialBalance?: number;
      subsidiaryId?: string;
    },
    @CurrentUser() user: JwtUser,
  ) {
    const account = await this.prefenancementService.findAccount(
      user.subsidiaryId,
    );
    if (!account)
      throw new NotFoundException('Compte de préfinancement introuvable.');
    return this.prefenancementService.updateAccount(
      account.id,
      updateDto,
      user.subsidiaryId,
    );
  }

  // --- Transaction Routes ---
  @ActiveRoles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  @Post('transactions')
  createTransaction(
    @Body()
    createDto: {
      date: string;
      description: string;
      amount: number;
      type: 'CREDIT' | 'DEBIT';
      category:
        | 'MATERIELS_PREMIER'
        | 'MAIN_D_OEUVRE'
        | 'ENERGIE'
        | 'TRANSPORT'
        | 'AUTRE';
      referenceNumber?: string;
      relatedOrderId?: string;
      notes?: string;
      subsidiaryId: string;
      createdBy: string;
    },
    @CurrentUser() user: JwtUser,
  ) {
    return this.prefenancementService.createTransaction({
      ...createDto,
      createdBy: user.id,
      subsidiaryId: user.subsidiaryId,
    });
  }

  @Get('transactions')
  findTransactions(
    @CurrentUser() user: JwtUser,
    @Query() query: FindPrefinancementTransactionsDto,
  ) {
    return this.prefenancementService.findTransactions({
      ...query,
      subsidiaryId: financeSubsidiaryId(
        user,
        query.subsidiaryId ?? user.subsidiaryId,
      ),
    });
  }

  @Get('transactions/:id')
  findTransactionById(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.prefenancementService.findTransactionById(
      id,
      financeSubsidiaryId(user),
    );
  }

  @ActiveRoles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  @Patch('transactions/:id')
  updateTransaction(
    @Param('id') id: string,
    @Body()
    updateDto: {
      date?: string;
      description?: string;
      amount?: number;
      type?: 'CREDIT' | 'DEBIT';
      category?:
        | 'MATERIELS_PREMIER'
        | 'MAIN_D_OEUVRE'
        | 'ENERGIE'
        | 'TRANSPORT'
        | 'AUTRE';
      referenceNumber?: string;
      relatedOrderId?: string;
      notes?: string;
    },
    @CurrentUser() user: JwtUser,
  ) {
    return this.prefenancementService.updateTransaction(
      id,
      updateDto,
      user.subsidiaryId,
    );
  }

  @ActiveRoles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  @Patch('transactions/:id/validate')
  validateTransaction(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.prefenancementService.validateTransaction(
      id,
      user.subsidiaryId,
    );
  }

  @ActiveRoles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  @Patch('transactions/:id/cancel')
  cancelTransaction(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.prefenancementService.cancelTransaction(id, user.subsidiaryId);
  }

  @ActiveRoles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
  @Delete('transactions/:id')
  deleteTransaction(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.prefenancementService.deleteTransaction(id, user.subsidiaryId);
  }

  // --- Statistics Route ---
  @Get('statistics')
  getStatistics(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    return this.prefenancementService.getStatistics(
      financeSubsidiaryId(user, subsidiaryId ?? user.subsidiaryId) ??
        user.subsidiaryId,
    );
  }
}
