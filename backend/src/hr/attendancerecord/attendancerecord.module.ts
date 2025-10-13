import { Module } from '@nestjs/common';
import { AttendanceRecordService } from './attendancerecord.service';
import { AttendanceRecordController } from './attendancerecord.controller';

@Module({
  controllers: [AttendanceRecordController],
  providers: [AttendanceRecordService],
  exports: [AttendanceRecordService], // On exporte le service pour qu'il soit utilisable ailleurs
})
export class AttendancerecordModule {}
