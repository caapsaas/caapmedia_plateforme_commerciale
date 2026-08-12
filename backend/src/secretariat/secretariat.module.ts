import { Module } from '@nestjs/common';
import { SecretariatService } from './secretariat.service';
import { SecretariatController } from './secretariat.controller';
import { LoggerService } from '../common/utils/logger/logger.service';
import { EmailService } from '../common/utils/email/email.service';

@Module({
  imports: [],
  controllers: [SecretariatController],
  providers: [SecretariatService, LoggerService, EmailService],
})
export class SecretariatModule {}
