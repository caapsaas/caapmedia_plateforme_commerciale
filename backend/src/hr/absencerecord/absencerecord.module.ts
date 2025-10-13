import { Module } from '@nestjs/common';
import { AbsenceRecordService } from './absencerecord.service';
import { AbsencerecordController } from './absencerecord.controller';

@Module({
  providers: [AbsenceRecordService],
  controllers: [AbsencerecordController],
  exports: [AbsenceRecordService],
})
export class AbsencerecordModule {}
