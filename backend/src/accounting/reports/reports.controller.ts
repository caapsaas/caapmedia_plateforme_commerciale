import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('grand-livre/:fiscalYearId')
  getGrandLivre(
    @Param('fiscalYearId') fiscalYearId: string,
    @Req() req: any,
    @Query('accountNumber') accountNumber?: string,
    @Query('journalCode') journalCode?: string,
  ) {
    return this.reportsService.getGrandLivre(
      req.user,
      fiscalYearId,
      accountNumber,
      journalCode,
    );
  }

  @Get('balance/:fiscalYearId')
  getBalance(@Param('fiscalYearId') fiscalYearId: string, @Req() req: any) {
    return this.reportsService.getBalanceGenerale(req.user, fiscalYearId);
  }

  @Get('journal-centralisateur/:fiscalYearId')
  getJournalCentralisateur(
    @Param('fiscalYearId') fiscalYearId: string,
    @Req() req: any,
    @Query('journalCode') journalCode?: string,
  ) {
    return this.reportsService.getJournalCentralisateur(
      req.user,
      fiscalYearId,
      journalCode,
    );
  }

  @Get('states/:fiscalYearId')
  getSyscohadaStatements(
    @Param('fiscalYearId') fiscalYearId: string,
    @Req() req: any,
  ) {
    return this.reportsService.getSyscohadaStatements(req.user, fiscalYearId);
  }
}
