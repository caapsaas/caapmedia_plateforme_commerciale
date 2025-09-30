import { Test, TestingModule } from '@nestjs/testing';
import { SecretariatService } from './secretariat.service';

describe('SecretariatService', () => {
  let service: SecretariatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecretariatService],
    }).compile();

    service = module.get<SecretariatService>(SecretariatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
