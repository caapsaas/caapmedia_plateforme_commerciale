import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ImmobilisationsService } from './immobilisations.service';
import { DisposeFixedAssetDto } from './dto/dispose-fixed-asset.dto';
import { GenerateDepreciationDto } from './dto/generate-depreciation.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { AccountingAccessGuard } from 'src/accounting-access/accounting-access.guard';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard, AccountingAccessGuard)
@Controller('accounting/immobilisations')
export class ImmobilisationsController {
  constructor(
    private readonly immobilisationsService: ImmobilisationsService,
  ) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('subsidiaryId') subsidiaryId: string | undefined,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.immobilisationsService.findAll(
      req.user,
      subsidiaryId,
      paginationQuery,
    );
  }

  @Post('generate-depreciation')
  generateAnnualDepreciation(
    @Body() dto: GenerateDepreciationDto,
    @Req() req: any,
  ) {
    return this.immobilisationsService.generateAnnualDepreciation(
      req.user,
      dto.year,
      dto.subsidiaryId,
    );
  }

  @Post(':id/dispose')
  dispose(
    @Param('id') id: string,
    @Body() dto: DisposeFixedAssetDto,
    @Req() req: any,
  ) {
    return this.immobilisationsService.dispose(id, dto, req.user);
  }
}
