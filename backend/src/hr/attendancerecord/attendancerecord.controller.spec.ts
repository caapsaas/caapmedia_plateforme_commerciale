import { Test, TestingModule } from '@nestjs/testing';
import { AttendancerecordController } from './attendancerecord.controller';

describe('AttendancerecordController', () => {
  let controller: AttendancerecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendancerecordController],
    }).compile();

    controller = module.get<AttendancerecordController>(AttendancerecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
