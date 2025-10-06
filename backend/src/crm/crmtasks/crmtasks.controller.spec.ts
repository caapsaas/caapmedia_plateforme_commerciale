import { Test, TestingModule } from '@nestjs/testing';
import { CrmtasksController } from './crmtasks.controller';

describe('CrmtasksController', () => {
  let controller: CrmtasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrmtasksController],
    }).compile();

    controller = module.get<CrmtasksController>(CrmtasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
