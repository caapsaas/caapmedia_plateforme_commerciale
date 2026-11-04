import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrivateDocumentsController } from './private-documents.controller';
import { PrivateDocumentsService } from './private-documents.service';

@Module({
  imports: [AuthModule],
  controllers: [PrivateDocumentsController],
  providers: [PrivateDocumentsService],
  exports: [PrivateDocumentsService],
})
export class PrivateDocumentsModule {}
