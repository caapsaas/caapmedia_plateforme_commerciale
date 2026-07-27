import { Test, TestingModule } from '@nestjs/testing';
import { AbsenceRecordService } from './absencerecord.service';

describe('AbsenceRecordService', () => {
  let service: AbsenceRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbsenceRecordService],
    }).compile();

    service = module.get<AbsenceRecordService>(AbsenceRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
