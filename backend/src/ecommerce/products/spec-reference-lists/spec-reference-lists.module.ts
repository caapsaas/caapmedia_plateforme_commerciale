import { Module } from '@nestjs/common';
import { SpecReferenceListsController } from './spec-reference-lists.controller';
import { SpecReferenceListsService } from './spec-reference-lists.service';

@Module({
  controllers: [SpecReferenceListsController],
  providers: [SpecReferenceListsService],
})
export class SpecReferenceListsModule {}
