import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceRecordController } from './attendancerecord.controller';

describe('AttendanceRecordController', () => {
  let controller: AttendanceRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceRecordController],
    }).compile();

    controller = module.get<AttendanceRecordController>(
      AttendanceRecordController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
