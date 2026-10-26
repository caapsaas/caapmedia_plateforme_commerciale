import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CameroonPayrollCalculatorService } from '../payrollrecord/cameroonpayrollcalculator.service';
//import { Logger } from '@nestjs/common';

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: {} }, // Mock PrismaService
        {
          provide: CameroonPayrollCalculatorService,
          useValue: { calculateFromNetSalary: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
