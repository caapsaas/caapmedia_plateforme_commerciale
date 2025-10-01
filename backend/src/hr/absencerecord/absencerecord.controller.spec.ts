import { Test, TestingModule } from '@nestjs/testing';
import { AbsencerecordController } from './absencerecord.controller';

describe('AbsencerecordController', () => {
  let controller: AbsencerecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbsencerecordController],
    }).compile();

    controller = module.get<AbsencerecordController>(AbsencerecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
