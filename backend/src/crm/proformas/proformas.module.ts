import { Module } from '@nestjs/common';
import { ProformasService } from './proformas.service';
import { ProformasController } from './proformas.controller';

@Module({
  controllers: [ProformasController],
  providers: [ProformasService],
  exports: [ProformasService],
})
export class ProformasModule {}
