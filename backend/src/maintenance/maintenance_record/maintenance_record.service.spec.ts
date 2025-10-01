import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceRecordService } from './maintenance_record.service';

describe('MaintenanceRecordService', () => {
  let service: MaintenanceRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaintenanceRecordService],
    }).compile();

    service = module.get<MaintenanceRecordService>(MaintenanceRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
