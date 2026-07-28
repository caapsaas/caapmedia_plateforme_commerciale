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

@UseGuards(JwtAuthGuard, AccountingAccessGuard)
@Controller('accounting/immobilisations')
export class ImmobilisationsController {
  constructor(
    private readonly immobilisationsService: ImmobilisationsService,
  ) {}

  @Get()
  findAll(@Req() req: any, @Query('subsidiaryId') subsidiaryId?: string) {
    return this.immobilisationsService.findAll(req.user, subsidiaryId);
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
