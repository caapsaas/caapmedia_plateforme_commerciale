import { Test, TestingModule } from '@nestjs/testing';
import { AttendancerecordService } from './attendancerecord.service';

describe('AttendancerecordService', () => {
  let service: AttendancerecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendancerecordService],
    }).compile();

    service = module.get<AttendancerecordService>(AttendancerecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
