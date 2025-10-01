import { Module } from '@nestjs/common';
import { AttendanceRecordService } from './attendancerecord.service';
import { AttendanceRecordController } from './attendancerecord.controller';
import { PrismaService } from '../../common/utils/prisma/prisma.service';

@Module({
  controllers: [AttendanceRecordController],
  providers: [AttendanceRecordService, PrismaService],
  exports: [AttendanceRecordService], // On exporte le service pour qu'il soit utilisable ailleurs
})
export class AttendancerecordModule {}
