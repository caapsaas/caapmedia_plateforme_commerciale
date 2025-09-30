import { Test, TestingModule } from '@nestjs/testing';
import { SecretariatController } from './secretariat.controller';

describe('SecretariatController', () => {
  let controller: SecretariatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretariatController],
    }).compile();

    controller = module.get<SecretariatController>(SecretariatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
