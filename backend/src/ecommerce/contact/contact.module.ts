import { Module } from '@nestjs/common';
import { StorefrontContactController } from './contact.controller';
import { StorefrontContactService } from './contact.service';

@Module({
  controllers: [StorefrontContactController],
  providers: [StorefrontContactService],
})
export class StorefrontContactModule {}
