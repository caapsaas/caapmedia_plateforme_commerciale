import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller'; // Renamed for clarity
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  
  controllers: [AccountsController],
  providers: [AccountsService, PrismaService],
})
export class AccountsModule {}
