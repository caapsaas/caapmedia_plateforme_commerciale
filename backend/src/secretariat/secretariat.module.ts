import { Module } from '@nestjs/common';
import { SecretariatService } from './secretariat.service';
import { SecretariatController } from './secretariat.controller';
import { PrismaService } from '../common/utils/prisma/prisma.service';
import { LoggerService } from '../common/utils/logger/logger.service';

@Module({
  imports: [],
  controllers: [SecretariatController],
  providers: [SecretariatService, PrismaService, LoggerService],
})
export class SecretariatModule {}
