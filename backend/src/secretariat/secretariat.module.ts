import { Module } from '@nestjs/common';
import { SecretariatService } from './secretariat.service';
import { SecretariatController } from './secretariat.controller';
import { LoggerService } from '../common/utils/logger/logger.service';

@Module({
  imports: [],
  controllers: [SecretariatController],
  providers: [SecretariatService, LoggerService],
})
export class SecretariatModule {}
