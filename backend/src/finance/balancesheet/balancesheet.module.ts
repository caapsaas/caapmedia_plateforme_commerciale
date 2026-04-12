import { Module } from '@nestjs/common';
import { BalancesheetService } from './balancesheet.service';
import { BalancesheetController } from './balancesheet.controller';

@Module({
  providers: [BalancesheetService],
  controllers: [BalancesheetController]
})
export class BalancesheetModule {}
