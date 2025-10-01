import { Test, TestingModule } from '@nestjs/testing';
import { EquipementService } from './equipement.service';

describe('EquipementService', () => {
  let service: EquipementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquipementService],
    }).compile();

    service = module.get<EquipementService>(EquipementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
