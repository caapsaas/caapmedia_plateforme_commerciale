import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceRecordController } from './attendancerecord.controller';
import { AttendanceRecordService } from './attendancerecord.service';

describe('AttendanceRecordController', () => {
  let controller: AttendanceRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceRecordController],
      providers: [
        {
          provide: AttendanceRecordService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AttendanceRecordController>(
      AttendanceRecordController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
