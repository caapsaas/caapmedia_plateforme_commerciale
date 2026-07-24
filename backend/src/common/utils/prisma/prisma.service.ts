import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'] as Prisma.LogLevel[], // Active les logs Prisma
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onApplicationShutdown(signal?: string) {
    await this.$disconnect();
  }
}
