import { Test, TestingModule } from '@nestjs/testing';
import { TaxesController } from './taxes.controller';
import { TaxesService } from './taxes.service';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/auth/role/role.decorator';

describe('TaxesController', () => {
  let controller: TaxesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxesController],
      providers: [{ provide: TaxesService, useValue: {} }],
    }).compile();

    controller = module.get<TaxesController>(TaxesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it.each(['findAll', 'findOne'] as const)(
    'does not restrict authenticated tax reads by active role through %s',
    (method) => {
      expect(
        Reflect.getMetadata(ROLES_KEY, TaxesController.prototype[method]),
      ).toBeUndefined();
    },
  );

  it.each(['create', 'update', 'remove'] as const)(
    'keeps %s restricted to administrators',
    (method) => {
      expect(
        Reflect.getMetadata(ROLES_KEY, TaxesController.prototype[method]),
      ).toEqual([UserRole.ADMIN]);
    },
  );
});
