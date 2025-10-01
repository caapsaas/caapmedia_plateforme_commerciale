import { Test, TestingModule } from '@nestjs/testing';
import { EquipementController } from './equipement.controller';

describe('EquipementController', () => {
  let controller: EquipementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipementController],
    }).compile();

    controller = module.get<EquipementController>(EquipementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
