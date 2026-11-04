import { BadRequestException } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { SupplierIdPipe } from './supplier-id.pipe';
import { generateId } from 'src/common/utils/generate-id.util';

describe('SuppliersController', () => {
  const pipe = new SupplierIdPipe();
  it.each([generateId('SUP'), '123e4567-e89b-42d3-a456-426614174000'])(
    'accepts existing supplier ID %s',
    (id) => {
      expect(pipe.transform(id)).toBe(id);
    },
  );
  it.each(['undefined', '', 'SUP-', 'ORD-ABC', 'SUP-../../etc'])(
    'rejects malformed ID %s',
    (id) => {
      expect(() => pipe.transform(id)).toThrow(BadRequestException);
    },
  );
  it('passes semantic IDs unchanged to lookup, modification and deletion', async () => {
    const service = {
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new SuppliersController(
      service as unknown as SuppliersService,
    );
    const req = { user: { subsidiaryId: 'SUB-A' } };
    const id = pipe.transform(generateId('SUP'));
    await controller.findOne(id, req);
    await controller.update(id, { supplierName: 'Updated' }, req);
    await controller.remove(id, req);
    expect(service.findOne).toHaveBeenCalledWith(id, req.user);
    expect(service.update).toHaveBeenCalledWith(
      id,
      { supplierName: 'Updated' },
      req.user,
    );
    expect(service.remove).toHaveBeenCalledWith(id, req.user);
  });
});
