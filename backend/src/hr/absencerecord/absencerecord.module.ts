import { Module } from '@nestjs/common';
import { AbsenceRecordService } from './absencerecord.service';
import { AbsencerecordController } from './absencerecord.controller';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  providers: [AbsenceRecordService, PrismaService],
  controllers: [AbsencerecordController],
  exports: [AbsenceRecordService],
})
export class AbsencerecordModule {}
