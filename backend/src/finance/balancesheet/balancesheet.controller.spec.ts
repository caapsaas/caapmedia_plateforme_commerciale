import { Test, TestingModule } from '@nestjs/testing';
import { BalancesheetController } from './balancesheet.controller';

describe('BalancesheetController', () => {
  let controller: BalancesheetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalancesheetController],
    }).compile();

    controller = module.get<BalancesheetController>(BalancesheetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
