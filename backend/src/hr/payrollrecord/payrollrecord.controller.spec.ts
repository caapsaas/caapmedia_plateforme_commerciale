import { Test, TestingModule } from '@nestjs/testing';
import { PayrollrecordController } from './payrollrecord.controller';

describe('PayrollrecordController', () => {
  let controller: PayrollrecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollrecordController],
    }).compile();

    controller = module.get<PayrollrecordController>(PayrollrecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
