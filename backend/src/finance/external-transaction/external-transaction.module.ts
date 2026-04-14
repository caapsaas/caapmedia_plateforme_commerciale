import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalTransactionService } from './external-transaction.service';
import { ExternalTransactionController } from './external-transaction.controller';

@Module({
  imports: [],
  controllers: [ExternalTransactionController],
  providers: [ExternalTransactionService],
  exports: [ExternalTransactionService],
})
export class ExternalTransactionModule {}
