import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete, Query } from '@nestjs/common';
import { PrefinancementService } from './prefinancement.service';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('finance/prefinancement')
export class PrefinancementController {
    constructor(private readonly prefenancementService: PrefinancementService) {}

    // --- Account Routes ---
    @Post('account')
    createAccount(@Body() createDto: {
        accountName: string;
        initialBalance?: number;
        subsidiaryId: string;
    }, @CurrentUser() user: User) {
        return this.prefenancementService.createAccount(createDto);
    }

    @Get('account')
    findAccount(@CurrentUser() user: User, @Query('subsidiaryId') subsidiaryId?: string) {
        return this.prefenancementService.findAccount(subsidiaryId);
    }

    @Patch('account')
    async updateAccount(
        @Body() updateDto: {
            accountName?: string;
            initialBalance?: number;
            subsidiaryId?: string;
        },
        @CurrentUser() user: User
    ) {
        // Note: This would need the account ID for a real update
        // For now, we'll use find to get the first account
        const account = await this.prefenancementService.findAccount(updateDto.subsidiaryId || user.subsidiaryId);
        if (account) {
            return this.prefenancementService.updateAccount(account.id, updateDto);
        }
        throw new Error('No account found');
    }

    // --- Transaction Routes ---
    @Post('transactions')
    createTransaction(@Body() createDto: {
        date: string;
        description: string;
        amount: number;
        type: 'CREDIT' | 'DEBIT';
        category: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
        referenceNumber?: string;
        relatedOrderId?: string;
        notes?: string;
        subsidiaryId: string;
        createdBy: string;
    }, @CurrentUser() user: User) {
        return this.prefenancementService.createTransaction({
            ...createDto,
            createdBy: user.id,
        });
    }

    @Get('transactions')
    findTransactions(
        @CurrentUser() user: User,
        @Query('subsidiaryId') subsidiaryId?: string,
        @Query('type') type?: 'CREDIT' | 'DEBIT',
        @Query('category') category?: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE',
        @Query('status') status?: 'VALIDE' | 'EN_ATTENTE' | 'ANNULE',
        @Query('search') search?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.prefenancementService.findTransactions({
            subsidiaryId: subsidiaryId || user.subsidiaryId,
            type,
            category,
            status,
            search,
            startDate,
            endDate,
        });
    }

    @Get('transactions/:id')
    findTransactionById(@Param('id') id: string, @CurrentUser() user: User) {
        return this.prefenancementService.findTransactionById(id);
    }

    @Patch('transactions/:id')
    updateTransaction(
        @Param('id') id: string,
        @Body() updateDto: {
            date?: string;
            description?: string;
            amount?: number;
            type?: 'CREDIT' | 'DEBIT';
            category?: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
            referenceNumber?: string;
            relatedOrderId?: string;
            notes?: string;
        },
        @CurrentUser() user: User
    ) {
        return this.prefenancementService.updateTransaction(id, updateDto);
    }

    @Patch('transactions/:id/validate')
    validateTransaction(@Param('id') id: string, @CurrentUser() user: User) {
        return this.prefenancementService.validateTransaction(id);
    }

    @Patch('transactions/:id/cancel')
    cancelTransaction(@Param('id') id: string, @CurrentUser() user: User) {
        return this.prefenancementService.cancelTransaction(id);
    }

    @Delete('transactions/:id')
    deleteTransaction(@Param('id') id: string, @CurrentUser() user: User) {
        return this.prefenancementService.deleteTransaction(id);
    }

    // --- Statistics Route ---
    @Get('statistics')
    getStatistics(@CurrentUser() user: User, @Query('subsidiaryId') subsidiaryId?: string) {
        return this.prefenancementService.getStatistics(subsidiaryId || user.subsidiaryId);
    }
}
