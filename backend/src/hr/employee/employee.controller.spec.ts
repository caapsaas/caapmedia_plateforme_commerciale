import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { LoggerService } from '../../common/utils/logger/logger.service';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ id: '1' }),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of employees', async () => {
      const mockEmployees = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockEmployees as any);

      const result = await controller.findAll(
        { user: { subsidiaryId: 'sub-1' } },
        {},
      );
      expect(result).toEqual(mockEmployees);
    });
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const createEmployeeDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '1234567890',
        address: '123 Main St',
        nationality: 'US',
        socialSecurityNumber: '123-45-6789',
        positions: 'Developer',
        department: 'IT',
        hireDate: new Date(),
        workLocation: 'Office',
        baseSalary: 50000,
        bonus: 5000,
        gender: 'FEMALE' as any,
        contractType: 'CDI' as any,
        status: 'ACTIVE' as any,
        paymentMethod: 'VIREMENT_BANCAIRE' as any,
        birthDate: new Date(),
      };
      const mockCreatedEmployee = { id: '1', ...createEmployeeDto };
      jest
        .spyOn(service, 'create')
        .mockResolvedValue(mockCreatedEmployee as any);

      const result = await controller.create(createEmployeeDto, {
        user: { subsidiaryId: 'sub-1' },
      });
      expect(result).toEqual(mockCreatedEmployee);
    });
  });
});
