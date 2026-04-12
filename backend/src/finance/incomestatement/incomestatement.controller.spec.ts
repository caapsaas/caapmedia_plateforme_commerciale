import { Test, TestingModule } from '@nestjs/testing';
import { IncomestatementController } from './incomestatement.controller';

describe('IncomestatementController', () => {
  let controller: IncomestatementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomestatementController],
    }).compile();

    controller = module.get<IncomestatementController>(IncomestatementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
