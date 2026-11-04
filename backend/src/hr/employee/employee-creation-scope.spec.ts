jest.mock('../../common/utils/file-upload.service', () => ({
  FileUploadService: class {},
}));
jest.mock('../../common/private-documents/private-documents.service', () => ({
  PrivateDocumentsService: class {},
}));

import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { LoggerService } from '../../common/utils/logger/logger.service';
import { CreateEmployeeDto } from './dto/employee.dto';

describe('Employee creation subsidiary scope', () => {
  it.each([
    ['SUPER_ADMIN', undefined, 'home'],
    ['SUPER_ADMIN', 'target', 'target'],
    ['ADMIN', 'target', 'home'],
    ['HR_MANAGER', undefined, 'home'],
  ])(
    'resolves %s with requested subsidiary %s to %s',
    async (role, requested, expected) => {
      const create = jest.fn().mockResolvedValue({ id: 'employee' });
      const controller = new EmployeeController(
        { create } as unknown as EmployeeService,
        { log: jest.fn() } as unknown as LoggerService,
        null!,
        null!,
      );
      const dto = { subsidiaryId: requested } as CreateEmployeeDto;
      await controller.create(dto, { user: { role, subsidiaryId: 'home' } });
      expect(create).toHaveBeenCalledWith(dto, expected);
    },
  );
});
