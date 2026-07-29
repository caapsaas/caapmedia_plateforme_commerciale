import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { AttendanceRecordService } from './attendancerecord.service';

describe('AttendanceRecordService', () => {
  let service: AttendanceRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceRecordService,
        {
          provide: PrismaService,
          useValue: {
            attendanceRecord: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            employee: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AttendanceRecordService>(AttendanceRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
