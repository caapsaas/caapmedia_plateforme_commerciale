import { Module } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { FileUploadService } from './file-upload.service';

@Module({
  providers: [LoggerService, FileUploadService],
  exports: [LoggerService, FileUploadService],
})
export class UtilsModule {}
