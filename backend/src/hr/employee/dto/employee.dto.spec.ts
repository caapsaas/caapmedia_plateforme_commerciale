import { CreateEmployeeDto } from './employee.dto';

describe('CreateEmployeeDto', () => {
  it('should be defined', () => {
    expect(new CreateEmployeeDto()).toBeDefined();
  });
});
