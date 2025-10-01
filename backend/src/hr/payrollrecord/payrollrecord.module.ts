import { Module } from '@nestjs/common';
import { PayrollRecordService } from './payrollrecord.service';
import { PayrollrecordController } from './payrollrecord.controller';
import { PrismaService } from '../../common/utils/prisma/prisma.service';

@Module({
   // On importe le PrismaModule, pas les services directement
  controllers: [PayrollrecordController],
  providers: [PayrollRecordService,PrismaService]
})
export class PayrollrecordModule {}
