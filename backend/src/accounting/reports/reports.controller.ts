import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { AccountingAccessGuard } from 'src/accounting-access/accounting-access.guard';

@UseGuards(JwtAuthGuard, AccountingAccessGuard)
@Controller('accounting/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('grand-livre/:fiscalYearId')
  getGrandLivre(
    @Param('fiscalYearId') fiscalYearId: string,
    @Req() req: any,
    @Query('accountNumber') accountNumber?: string,
    @Query('journalCode') journalCode?: string,
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getGrandLivre(
      req.user,
      fiscalYearId,
      accountNumber,
      journalCode,
      subsidiaryId,
      startDate,
      endDate,
    );
  }

  @Get('balance/:fiscalYearId')
  getBalance(
    @Param('fiscalYearId') fiscalYearId: string,
    @Req() req: any,
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getBalanceGenerale(
      req.user,
      fiscalYearId,
      subsidiaryId,
      startDate,
      endDate,
    );
  }

  @Get('journal-centralisateur/:fiscalYearId')
  getJournalCentralisateur(
    @Param('fiscalYearId') fiscalYearId: string,
    @Req() req: any,
    @Query('journalCode') journalCode?: string,
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getJournalCentralisateur(
      req.user,
      fiscalYearId,
      journalCode,
      subsidiaryId,
      startDate,
      endDate,
    );
  }

  @Get('states/:fiscalYearId')
  getSyscohadaStatements(
    @Param('fiscalYearId') fiscalYearId: string,
    @Req() req: any,
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    return this.reportsService.getSyscohadaStatements(
      req.user,
      fiscalYearId,
      subsidiaryId,
    );
  }
}
