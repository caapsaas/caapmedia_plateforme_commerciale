import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { PeriodsService } from './periods.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.periodsService.findAll(req.user);
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @Req() req: any) {
    return this.periodsService.close(id, req.user);
  }
}
