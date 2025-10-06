import { Test, TestingModule } from '@nestjs/testing';
import { CrmtasksService } from './crmtasks.service';

describe('CrmtasksService', () => {
  let service: CrmtasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmtasksService],
    }).compile();

    service = module.get<CrmtasksService>(CrmtasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
