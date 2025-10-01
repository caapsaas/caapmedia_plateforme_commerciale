import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceRecordController } from './maintenance_record.controller';

describe('MaintenanceRecordController', () => {
  let controller: MaintenanceRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceRecordController],
    }).compile();

    controller = module.get<MaintenanceRecordController>(MaintenanceRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
