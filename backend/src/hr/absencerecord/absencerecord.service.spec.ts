import { Test, TestingModule } from '@nestjs/testing';
import { AbsencerecordService } from './absencerecord.service';

describe('AbsencerecordService', () => {
  let service: AbsencerecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbsencerecordService],
    }).compile();

    service = module.get<AbsencerecordService>(AbsencerecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
