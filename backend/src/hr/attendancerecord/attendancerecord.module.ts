import { Module } from '@nestjs/common';
import { AttendanceRecordService } from './attendancerecord.service';
import { AttendanceRecordController } from './attendancerecord.controller';
import { DynamicTokenService } from './services/dynamic-token.service';
import { PointageController } from './controllers/pointage.controller';
import { DynamicTokenController } from './controllers/dynamic-token.controller';
import { AttendanceSecurityService } from './services/attendance-security.service';

@Module({
  controllers: [
    AttendanceRecordController,
    PointageController,
    DynamicTokenController,
  ],
  providers: [
    AttendanceRecordService,
    DynamicTokenService,
    AttendanceSecurityService,
  ],
  exports: [AttendanceRecordService, DynamicTokenService],
})
export class AttendancerecordModule {}
