import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AttendanceRecordService } from './attendancerecord.service';
import { AttendanceRecordController } from './attendancerecord.controller';
import { AttendanceCheckInController } from './controllers/attendance-checkin.controller';
import { AttendanceQrDailyService } from './services/attendance-qr-daily.service';
import { AttendanceGeolocationService } from './services/attendance-geolocation.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AttendanceRecordController, AttendanceCheckInController],
  providers: [
    AttendanceRecordService,
    AttendanceQrDailyService,
    AttendanceGeolocationService,
  ],
  exports: [
    AttendanceRecordService,
    AttendanceQrDailyService,
    AttendanceGeolocationService,
  ],
})
export class AttendancerecordModule {}
